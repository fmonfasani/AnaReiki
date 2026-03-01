import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminLayoutUI from "@/components/AdminLayoutUI";
import { isAdminFromAppMetadata } from "@/lib/auth/roles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminFromAppMetadata(user)) {
    redirect("/miembros");
  }

  return <AdminLayoutUI user={user}>{children}</AdminLayoutUI>;
}
