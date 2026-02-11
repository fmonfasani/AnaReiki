import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminLayoutUI from "@/components/AdminLayoutUI";

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

  // Verify Admin Role via secure RPC function (bypasses RLS)
  const { data: isAdmin, error } = await supabase.rpc("is_admin_user", {
    target_user_id: user.id,
  });

  if (!isAdmin || error) {
    redirect("/miembros");
  }

  return <AdminLayoutUI user={user}>{children}</AdminLayoutUI>;
}
