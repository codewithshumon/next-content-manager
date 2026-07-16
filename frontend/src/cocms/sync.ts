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
  // ── Users table for admin authentication ──
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cocms_users (
      id           SERIAL PRIMARY KEY,
      username     TEXT UNIQUE NOT NULL,
      password     TEXT NOT NULL,
      display_name TEXT,
      created_at   TIMESTAMPTZ DEFAULT now()
    )
  `);

  // Seed default admin user (demo-only, plain-text password)
  await pool.query(
    `INSERT INTO cocms_users (username, password, display_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (username) DO NOTHING`,
    [process.env.COCMS_ADMIN_USER || "admin",
     process.env.COCMS_ADMIN_PASSWORD || "admin123",
     "Admin User"],
  );

  // ── Registry table ──
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

  // Add sort_order column if it doesn't exist yet
  await pool.query(`
    ALTER TABLE cocms_fields
    ADD COLUMN IF NOT EXISTS sort_order INTEGER
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
      let sortIdx = 0;
      for (const col of columns) {
        const fieldType = getFieldType(schema[col]);
        const columnType = getColumnType(fieldType);

        await pool.query(`
          ALTER TABLE ${tableName}
          ADD COLUMN IF NOT EXISTS "${col}" ${columnType}
        `);

        // Backfill default value for existing rows where the new column is NULL
        const defVal = getDefaultValue(schema[col]);
        if (fieldType === "array") {
          await pool.query(
            `UPDATE ${tableName} SET "${col}" = $1::jsonb WHERE page_path = $2 AND "${col}" IS NULL`,
            [JSON.stringify(defVal), schema.pagePath],
          );
        } else {
          await pool.query(
            `UPDATE ${tableName} SET "${col}" = $1 WHERE page_path = $2 AND "${col}" IS NULL`,
            [defVal, schema.pagePath],
          );
        }

        // Build field_meta for array fields
        let fieldMeta: unknown = null;
        if (fieldType === "array") {
          const arrVal = schema[col] as { defaultValue: unknown[] };
          fieldMeta = inferItemSchema(arrVal.defaultValue);
        }

        // 3. Upsert registry row (with field_meta and sort_order)
        await pool.query(
          `INSERT INTO cocms_fields (page_path, field_name, field_type, field_meta, sort_order)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (page_path, field_name)
           DO UPDATE SET field_type = $3, field_meta = $4, sort_order = $5`,
          [schema.pagePath, col, fieldType, fieldMeta ? JSON.stringify(fieldMeta) : null, sortIdx],
        );
        sortIdx++;
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

  // Clean up registry entries for schemas that no longer exist
  const activePaths = schemas.map((s) => s.pagePath);
  if (activePaths.length > 0) {
    const placeholders = activePaths.map((_, i) => `$${i + 1}`).join(", ");
    const result = await pool.query(
      `DELETE FROM cocms_fields WHERE page_path NOT IN (${placeholders})`,
      activePaths,
    );
    if (result.rowCount && result.rowCount > 0) {
      console.log(`[CoCMS] Cleaned up ${result.rowCount} orphaned registry row(s)`);
    }
  }

  console.log(`[CoCMS] Sync complete — ${schemas.length} schema(s) processed`);
}
