import pool from "./db";
import type { PageSchema, ResolvedContent, ArrayItemSchema } from "./types";

// ── helpers ──────────────────────────────────────────────────────────

export function getTableName(pagePath: string): string {
  if (pagePath === "/") return "cocms_home";
  return "cocms" + pagePath.replace(/[\/\-]/g, "_");
}

export function getDefaultValue(value: unknown): unknown {
  if (typeof value === "string" || typeof value === "number") return value;
  if (value && typeof value === "object" && "defaultValue" in value) {
    return (value as { defaultValue: unknown }).defaultValue;
  }
  return "";
}

function extractDefaults(schema: PageSchema): Record<string, unknown> {
  const content: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "pagePath") continue;
    content[key] = getDefaultValue(value);
  }
  return content;
}

// ── public API ───────────────────────────────────────────────────────

/**
 * Read live content for a page from the database.
 * Falls back to schema defaults if the DB row does not exist yet
 * (e.g. first boot before sync, or build-time when no DB is available).
 */
export async function getContent<T extends PageSchema>(
  schema: T,
): Promise<ResolvedContent<T>> {
  const tableName = getTableName(schema.pagePath);

  try {
    const result = await pool.query(
      `SELECT * FROM ${tableName} WHERE page_path = $1`,
      [schema.pagePath],
    );

    if (result.rows.length === 0) {
      return extractDefaults(schema) as ResolvedContent<T>;
    }

    const row = result.rows[0];

    // pg can return column names in varying case — build a case-insensitive
    // lookup map so camelCase schema keys always resolve correctly.
    const rowMap: Record<string, unknown> = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]),
    );

    const content: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema)) {
      if (key === "pagePath") continue;
      const dbValue = rowMap[key.toLowerCase()];
      // NULL / missing columns fall back to schema defaults
      content[key] = dbValue ?? getDefaultValue(value);
    }

    return content as ResolvedContent<T>;
  } catch {
    // DB not available (e.g. during build) — return schema defaults
    return extractDefaults(schema) as ResolvedContent<T>;
  }
}

/** Field metadata returned to the admin panel. */
export interface AdminField {
  name: string;
  type: string;
  value: unknown;
  fieldMeta: ArrayItemSchema | null;
}

/** Page data returned to the admin panel. */
export interface AdminPage {
  pagePath: string;
  fields: AdminField[];
}

/**
 * Query all registered pages and their field metadata from the registry.
 * Used by the admin panel to build tab navigation and edit forms.
 */
export async function getAllPages(): Promise<AdminPage[]> {
  try {
    const pathsResult = await pool.query(
      `SELECT DISTINCT page_path FROM cocms_fields ORDER BY page_path`,
    );

    const pages: AdminPage[] = [];

    for (const { page_path } of pathsResult.rows) {
      const tableName = getTableName(page_path);

      // Get field metadata (including field_meta for arrays)
      const fieldsResult = await pool.query(
        `SELECT field_name, field_type, field_meta
         FROM cocms_fields
         WHERE page_path = $1
         ORDER BY sort_order`,
        [page_path],
      );


      // Get current values
      let rawRow: Record<string, unknown> | null = null;
      try {
        const rowResult = await pool.query(
          `SELECT * FROM ${tableName} WHERE page_path = $1`,
          [page_path],
        );
        if (rowResult.rows.length > 0) rawRow = rowResult.rows[0];
      } catch {
        // Table might not exist yet
      }

      const rowMap: Record<string, unknown> = rawRow
        ? Object.fromEntries(
            Object.entries(rawRow).map(([k, v]) => [k.toLowerCase(), v]),
          )
        : {};

      const fields: AdminField[] = fieldsResult.rows.map(
        (f: {
          field_name: string;
          field_type: string;
          field_meta: unknown;
        }) => ({
          name: f.field_name,
          type: f.field_type,
          value: rowMap[f.field_name.toLowerCase()] ?? "",
          fieldMeta: (f.field_meta as ArrayItemSchema) ?? null,
        }),
      );

      pages.push({ pagePath: page_path, fields });
    }

    return pages;
  } catch {
    return [];
  }
}
