import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminLayoutUI from "@/components/AdminLayoutUI";
import { isAdmin } from "@/lib/auth/roles";

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

  if (!(await isAdmin(user, supabase))) {
    redirect("/consultantes");
  }

  return <AdminLayoutUI user={user}>{children}</AdminLayoutUI>;
}
