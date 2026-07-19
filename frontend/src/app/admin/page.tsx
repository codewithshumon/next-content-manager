import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllPages } from "@/cocms/client";
import pool from "@/cocms/db";
import AdminPanel from "./AdminPanel";
import type { AdminUser } from "./SettingsPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  // Auth check
  const cookieStore = await cookies();
  const token = cookieStore.get("cocms_token");

  if (!token || token.value !== "authenticated") {
    redirect("/admin/login");
  }

  const pages = await getAllPages();

  // Fetch the admin user for the settings tab.
  let user: AdminUser | null = null;
  try {
    const result = await pool.query(
      `SELECT id, username, display_name, created_at
       FROM cocms_users
       WHERE username = $1`,
      [process.env.COCMS_ADMIN_USER || "admin"],
    );
    if (result.rows.length > 0) user = result.rows[0];
  } catch {
    // users table not ready yet
  }

  const params = await searchParams;
  const rawP = params.p;
  const initialPage =
    rawP && (rawP === "settings" || pages.some((p) => p.pagePath === rawP))
      ? rawP
      : undefined;

  return <AdminPanel pages={pages} initialPage={initialPage} user={user} />;
}
