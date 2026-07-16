import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import pool from "@/cocms/db";
import SettingsPanel from "./SettingsPanel";

export const dynamic = "force-dynamic";

interface UserRow {
  id: number;
  username: string;
  display_name: string | null;
  created_at: string;
}

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cocms_token");
  if (!token || token.value !== "authenticated") redirect("/admin/login");

  let user: UserRow | null = null;
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

  return <SettingsPanel user={user} />;
}
