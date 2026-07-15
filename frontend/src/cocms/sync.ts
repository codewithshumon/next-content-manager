import pool from "./db";
import type { PageSchema, ArrayItemSchema } from "./types";

// ── helpers ──────────────────────────────────────────────────────────

function getTableName(pagePath: string): string {
  if (pagePath === "/") return "cocms_home";
  return "cocms" + pagePath.replace(/\//g, "_");
}

export function getFieldType(value: unknown): string {
  if (typeof value === "string") return "text";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "numeric";
  }
  if (value && typeof value === "object" && "type" in value) {
    return (value as { type: string }).type; // "image" | "file" | "array"
  }
  return "text";
}

function getColumnType(fieldType: string): string {
  switch (fieldType) {
    case "integer":
      return "INTEGER";
    case "numeric":
      return "NUMERIC";
    case "array":
      return "JSONB";
    case "image":
    case "file":
    case "text":
    default:
      return "TEXT";
  }
}

export function getDefaultValue(value: unknown): unknown {
  if (typeof value === "string" || typeof value === "number") return value;
  if (value && typeof value === "object" && "defaultValue" in value) {
    return (value as { defaultValue: unknown }).defaultValue;
  }
  return "";
}

/** Infer the item schema for an array field from its default value. */
export function inferItemSchema(defaultValue: unknown[]): ArrayItemSchema {
  if (defaultValue.length === 0) return { itemType: "string" };
  const first = defaultValue[0];
  if (typeof first === "string") return { itemType: "string" };
  if (typeof first === "number") return { itemType: "number" };
  if (typeof first === "object" && first !== null) {
    const fields: Record<string, string> = {};
    for (const [key, val] of Object.entries(first)) {
      fields[key] = getFieldType(val);
    }
    return { itemType: "object", fields };
  }
  return { itemType: "string" };
}

// ── public API ───────────────────────────────────────────────────────

/**
 * Run once at server boot (called from `instrumentation.ts`).
 *
 * For every schema file passed in:
 * 1. Creates the per-page table if it doesn't exist.
 * 2. Adds any missing columns (never drops — data safety).
 * 3. Upserts field metadata into `cocms_fields` registry (incl. array item schema).
 * 4. Inserts a default row if one doesn't already exist.
 *
 * Failures for one schema are isolated — they do not prevent
 * other schemas from syncing.
 */
export async function syncSchemas(schemas: PageSchema[]): Promise<void> {
  // Ensure the registry table exists (with optional field_meta column)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cocms_fields (
      page_path  TEXT NOT NULL,
      field_name TEXT NOT NULL,
      field_type TEXT NOT NULL,
      PRIMARY KEY (page_path, field_name)
    )
  `);

  // Add field_meta column if it doesn't exist yet
  await pool.query(`
    ALTER TABLE cocms_fields
    ADD COLUMN IF NOT EXISTS field_meta JSONB
  `);

  for (const schema of schemas) {
    try {
      const tableName = getTableName(schema.pagePath);

      // 1. Create per-page table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id         SERIAL PRIMARY KEY,
          page_path  TEXT UNIQUE NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT now()
        )
      `);

      const columns = Object.keys(schema).filter((k) => k !== "pagePath");

      // 2. Add any missing columns
      for (const col of columns) {
        const fieldType = getFieldType(schema[col]);
        const columnType = getColumnType(fieldType);

        await pool.query(`
          ALTER TABLE ${tableName}
          ADD COLUMN IF NOT EXISTS "${col}" ${columnType}
        `);

        // Build field_meta for array fields
        let fieldMeta: unknown = null;
        if (fieldType === "array") {
          const arrVal = schema[col] as { defaultValue: unknown[] };
          fieldMeta = inferItemSchema(arrVal.defaultValue);
        }

        // 3. Upsert registry row (with field_meta)
        await pool.query(
          `INSERT INTO cocms_fields (page_path, field_name, field_type, field_meta)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (page_path, field_name)
           DO UPDATE SET field_type = $3, field_meta = $4`,
          [schema.pagePath, col, fieldType, fieldMeta ? JSON.stringify(fieldMeta) : null],
        );
      }

      // 4. Insert default row if no row exists for this pagePath
      const insertParts: string[] = [];
      const insertValues: unknown[] = [schema.pagePath];
      let insertIdx = 2;

      for (const col of columns) {
        const fieldType = getFieldType(schema[col]);
        const def = getDefaultValue(schema[col]);

        if (fieldType === "array") {
          // pg mishandles JS arrays for JSONB — stringify explicitly
          insertParts.push(`$${insertIdx++}::jsonb`);
          insertValues.push(JSON.stringify(def));
        } else {
          insertParts.push(`$${insertIdx++}`);
          insertValues.push(def);
        }
      }

      await pool.query(
        `INSERT INTO ${tableName} (page_path, ${columns.map((c) => `"${c}"`).join(", ")})
         VALUES ($1, ${insertParts.join(", ")})
         ON CONFLICT (page_path) DO NOTHING`,
        insertValues,
      );

      console.log(`[CoCMS] ✓ Synced: ${schema.pagePath} → ${tableName}`);
    } catch (err) {
      console.error(`[CoCMS] ✗ Failed to sync ${schema.pagePath}:`, err);
    }
  }

  console.log(`[CoCMS] Sync complete — ${schemas.length} schema(s) processed`);
}
