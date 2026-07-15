import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllPages } from "@/cocms/client";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Auth check
  const cookieStore = await cookies();
  const token = cookieStore.get("cocms_token");

  if (!token || token.value !== "authenticated") {
    redirect("/admin/login");
  }

  const pages = await getAllPages();

  return <AdminPanel pages={pages} />;
}
