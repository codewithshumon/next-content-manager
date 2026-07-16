"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import pool from "@/cocms/db";
import type { AdminField } from "@/cocms/client";

// ── table-name helper ────────────────────────────────────────────────

function getTableName(pagePath: string): string {
  if (pagePath === "/") return "cocms_home";
  return "cocms" + pagePath.replace(/\//g, "_");
}

// ── auth ─────────────────────────────────────────────────────────────

export async function login(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  let authenticated = false;

  // Try DB users table first
  try {
    const result = await pool.query(
      `SELECT password FROM cocms_users WHERE username = $1`,
      [username],
    );
    if (result.rows.length > 0 && result.rows[0].password === password) {
      authenticated = true;
    }
  } catch {
    // users table not available — fall back to env vars
  }

  // Fall back to env vars (for first boot before sync)
  if (
    !authenticated &&
    username === process.env.COCMS_ADMIN_USER &&
    password === process.env.COCMS_ADMIN_PASSWORD
  ) {
    authenticated = true;
  }

  if (authenticated) {
    const cookieStore = await cookies();
    cookieStore.set("cocms_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });
    redirect("/admin");
  }

  return { error: "Invalid username or password." };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("cocms_token");
  redirect("/admin/login");
}

// ── content update ────────────────────────────────────────────────────

export async function updatePage(
  pagePath: string,
  fields: AdminField[],
  _prevState: { success?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const tableName = getTableName(pagePath);
    const setClauses: string[] = [];
    const queryValues: unknown[] = [];
    let paramIndex = 1;

    for (const field of fields) {
      // ── array field — read JSON from hidden input ──
      if (field.type === "array") {
        const jsonStr = formData.get(`${field.name}_json`) as string;
        if (jsonStr !== null) {
          const parsed = JSON.parse(jsonStr);
          setClauses.push(`"${field.name}" = $${paramIndex++}::jsonb`);
          queryValues.push(JSON.stringify(parsed));
        }
        continue;
      }

      // ── image / file fields ──
      if (field.type === "image" || field.type === "file") {
        const rawValue = formData.get(field.name);

        // File upload
        const file = rawValue as File | null;
        if (file && file.size > 0) {
          const uploadsDir = join(process.cwd(), "public", "uploads");
          await mkdir(uploadsDir, { recursive: true });

          const filename = `${Date.now()}-${file.name}`;
          const filePath = join(uploadsDir, filename);

          const bytes = await file.arrayBuffer();
          await writeFile(filePath, Buffer.from(bytes));

          setClauses.push(`"${field.name}" = $${paramIndex++}`);
          queryValues.push(`/uploads/${filename}`);
          continue;
        }

        // URL/path paste
        const urlValue = formData.get(`${field.name}_url`) as string;
        if (urlValue) {
          setClauses.push(`"${field.name}" = $${paramIndex++}`);
          queryValues.push(urlValue);
          continue;
        }

        continue; // no change
      }

      // ── text / number fields ──
      const rawValue = formData.get(field.name);
      setClauses.push(`"${field.name}" = $${paramIndex++}`);
      if (field.type === "integer" || field.type === "numeric") {
        queryValues.push(Number(rawValue) || 0);
      } else {
        queryValues.push(String(rawValue ?? ""));
      }
    }

    if (setClauses.length === 0) {
      return { success: true };
    }

    const updateQuery = `
      UPDATE ${tableName}
      SET ${setClauses.join(", ")}, updated_at = now()
      WHERE page_path = $${paramIndex}
    `;

    await pool.query(updateQuery, [...queryValues, pagePath]);

    revalidatePath(pagePath);
    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error("[CoCMS] Update failed:", err);
    return { error: "Failed to save changes. Check the server logs." };
  }
}
