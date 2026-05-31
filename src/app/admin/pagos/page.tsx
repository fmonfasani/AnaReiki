import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import AdminPayments from "./AdminPayments";

export default async function AdminPagosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user, supabase))) redirect("/login");

  const { data: payments } = await supabase
    .from("payments")
    .select("*, profiles:user_id(full_name, email), pricing_plans!left(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*, profiles:user_id(full_name, email), pricing_plans!left(name)")
    .order("created_at", { ascending: false });

  const { data: plans } = await supabase
    .from("pricing_plans")
    .select("*")
    .order("sort_order");

  const totalRevenue =
    payments
      ?.filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + p.amount_cents, 0) || 0;

  const activeSubscriptions =
    subscriptions?.filter((s) => s.status === "active").length || 0;

  return (
    <AdminPayments
      payments={(payments || []) as any[]}
      subscriptions={(subscriptions || []) as any[]}
      plans={(plans || []) as any[]}
      totalRevenue={totalRevenue}
      activeSubscriptions={activeSubscriptions}
    />
  );
}
