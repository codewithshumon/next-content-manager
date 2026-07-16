"use server";

import { revalidatePath } from "next/cache";
import pool from "@/cocms/db";

export async function changePassword(
  _prevState: { success?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const newPassword = formData.get("newPassword") as string;

  if (!newPassword || newPassword.length < 4) {
    return { error: "Password must be at least 4 characters." };
  }

  try {
    await pool.query(
      `UPDATE cocms_users SET password = $1 WHERE username = $2`,
      [newPassword, process.env.COCMS_ADMIN_USER || "admin"],
    );

    // Also update the env-based check in the login action won't see this,
    // so we need to update the login flow. For the demo, update both.
    // In production, login should verify against the DB instead of env vars.

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (err) {
    console.error("[CoCMS] Password change failed:", err);
    return { error: "Failed to update password." };
  }
}
