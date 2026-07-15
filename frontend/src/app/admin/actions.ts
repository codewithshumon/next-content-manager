"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import pool from "@/cocms/db";

// ── table-name helper (mirrors sync/client) ──────────────────────────

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

  if (
    username === process.env.COCMS_ADMIN_USER &&
    password === process.env.COCMS_ADMIN_PASSWORD
  ) {
    const cookieStore = await cookies();
    cookieStore.set("cocms_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
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
  fields: { name: string; type: string }[],
  _prevState: { success?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const tableName = getTableName(pagePath);
    const updates: Record<string, string | number> = {};
    const columns: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    for (const field of fields) {
      const rawValue = formData.get(field.name);

      // Handle file upload
      if (field.type === "image" || field.type === "file") {
        const file = rawValue as File | null;
        if (file && file.size > 0) {
          // Save uploaded file to /public/uploads/
          const uploadsDir = join(process.cwd(), "public", "uploads");
          await mkdir(uploadsDir, { recursive: true });

          const ext = file.name.split(".").pop() || "";
          const filename = `${Date.now()}-${file.name}`;
          const filePath = join(uploadsDir, filename);

          const bytes = await file.arrayBuffer();
          await writeFile(filePath, Buffer.from(bytes));

          columns.push(`"${field.name}"`);
          values.push(`/uploads/${filename}`);
          continue;
        }

        // URL/path paste (comes as a second field with _url suffix)
        const urlValue = formData.get(`${field.name}_url`) as string;
        if (urlValue) {
          columns.push(`"${field.name}"`);
          values.push(urlValue);
          continue;
        }

        // No change — skip this field
        continue;
      }

      // Text / number fields
      columns.push(`"${field.name}"`);
      if (field.type === "integer" || field.type === "numeric") {
        values.push(Number(rawValue) || 0);
      } else {
        values.push(String(rawValue ?? ""));
      }
    }

    if (columns.length === 0) {
      return { success: true };
    }

    // Build UPDATE query
    const setClauses = columns.map((col, i) => {
      const val = values[i];
      if (typeof val === "number") return `${col} = ${val}`;
      return `${col} = $${paramIndex++}`;
    });

    const queryValues = values.filter((v) => typeof v !== "number");
    const numParts = values.filter((v) => typeof v === "number");

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
