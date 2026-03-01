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

  // Verify admin role from the user's own profile row.
  // This avoids hard dependency on a custom RPC that may not exist.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    redirect("/miembros");
  }

  return <AdminLayoutUI user={user}>{children}</AdminLayoutUI>;
}
