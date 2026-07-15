import pool from "./db";
import type { PageSchema, ResolvedContent } from "./types";

// ── helpers ──────────────────────────────────────────────────────────

function getTableName(pagePath: string): string {
  if (pagePath === "/") return "cocms_home";
  // /about     → cocms_about
  // /about/team → cocms_about_team
  return "cocms" + pagePath.replace(/\//g, "_");
}

function getDefaultValue(value: unknown): string | number {
  if (typeof value === "string" || typeof value === "number") return value;
  if (value && typeof value === "object" && "defaultValue" in value) {
    return (value as { defaultValue: string }).defaultValue;
  }
  return "";
}

function extractDefaults(schema: PageSchema): Record<string, string | number> {
  const content: Record<string, string | number> = {};
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
    const content: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(schema)) {
      if (key === "pagePath") continue;
      content[key] = row[key] ?? getDefaultValue(value);
    }

    return content as ResolvedContent<T>;
  } catch {
    // DB not available (e.g. during build) — return schema defaults
    return extractDefaults(schema) as ResolvedContent<T>;
  }
}

/**
 * Query all registered pages and their field metadata from the registry.
 * Used by the admin panel to build tab navigation and edit forms.
 */
export async function getAllPages(): Promise<
  {
    pagePath: string;
    fields: { name: string; type: string; value: string | number }[];
  }[]
> {
  try {
    // Get all distinct page paths
    const pathsResult = await pool.query(
      `SELECT DISTINCT page_path FROM cocms_fields ORDER BY page_path`,
    );

    const pages: {
      pagePath: string;
      fields: { name: string; type: string; value: string | number }[];
    }[] = [];

    for (const { page_path } of pathsResult.rows) {
      const tableName = getTableName(page_path);

      // Get field metadata
      const fieldsResult = await pool.query(
        `SELECT field_name, field_type FROM cocms_fields WHERE page_path = $1 ORDER BY field_name`,
        [page_path],
      );

      // Get current values
      let row: Record<string, unknown> = {};
      try {
        const rowResult = await pool.query(
          `SELECT * FROM ${tableName} WHERE page_path = $1`,
          [page_path],
        );
        if (rowResult.rows.length > 0) row = rowResult.rows[0];
      } catch {
        // Table might not exist yet
      }

      const fields = fieldsResult.rows.map(
        (f: { field_name: string; field_type: string }) => ({
          name: f.field_name,
          type: f.field_type,
          value: (row[f.field_name] as string | number) ?? "",
        }),
      );

      pages.push({ pagePath: page_path, fields });
    }

    return pages;
  } catch {
    return [];
  }
}

/** Re-export for use in sync */
export { getTableName, getDefaultValue };
