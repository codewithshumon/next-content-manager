import pool from "./db";
import type { PageSchema } from "./types";

// ── helpers ──────────────────────────────────────────────────────────

function getTableName(pagePath: string): string {
  if (pagePath === "/") return "cocms_home";
  return "cocms" + pagePath.replace(/\//g, "_");
}

function getFieldType(value: unknown): string {
  if (typeof value === "string") return "text";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "numeric";
  }
  if (value && typeof value === "object" && "type" in value) {
    return (value as { type: string }).type; // "image" | "file"
  }
  return "text";
}

function getColumnType(fieldType: string): string {
  switch (fieldType) {
    case "integer":
      return "INTEGER";
    case "numeric":
      return "NUMERIC";
    case "image":
    case "file":
    case "text":
    default:
      return "TEXT";
  }
}

function getDefaultValue(value: unknown): string | number {
  if (typeof value === "string" || typeof value === "number") return value;
  if (value && typeof value === "object" && "defaultValue" in value) {
    return (value as { defaultValue: string }).defaultValue;
  }
  return "";
}

// ── public API ───────────────────────────────────────────────────────

/**
 * Run once at server boot (called from `instrumentation.ts`).
 *
 * For every schema file passed in:
 * 1. Creates the per-page table if it doesn't exist.
 * 2. Adds any missing columns (never drops — data safety).
 * 3. Upserts field metadata into `cocms_fields` registry.
 * 4. Inserts a default row if one doesn't already exist.
 *
 * Failures for one schema are isolated — they do not prevent
 * other schemas from syncing.
 */
export async function syncSchemas(schemas: PageSchema[]): Promise<void> {
  // Ensure the registry table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cocms_fields (
      page_path  TEXT NOT NULL,
      field_name TEXT NOT NULL,
      field_type TEXT NOT NULL,
      PRIMARY KEY (page_path, field_name)
    )
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

        // 3. Upsert registry row
        await pool.query(
          `INSERT INTO cocms_fields (page_path, field_name, field_type)
           VALUES ($1, $2, $3)
           ON CONFLICT (page_path, field_name)
           DO UPDATE SET field_type = $3`,
          [schema.pagePath, col, fieldType],
        );
      }

      // 4. Insert default row if no row exists for this pagePath
      const placeholders = columns.map((_, i) => `$${i + 2}`);
      const values = columns.map((col) => getDefaultValue(schema[col]));

      await pool.query(
        `INSERT INTO ${tableName} (page_path, ${columns.map((c) => `"${c}"`).join(", ")})
         VALUES ($1, ${placeholders.join(", ")})
         ON CONFLICT (page_path) DO NOTHING`,
        [schema.pagePath, ...values],
      );

      console.log(`[CoCMS] ✓ Synced: ${schema.pagePath} → ${tableName}`);
    } catch (err) {
      console.error(`[CoCMS] ✗ Failed to sync ${schema.pagePath}:`, err);
    }
  }

  console.log(`[CoCMS] Sync complete — ${schemas.length} schema(s) processed`);
}
