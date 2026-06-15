import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import AdminPayments from "./AdminPayments";

export default async function AdminPagosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user, supabase))) redirect("/login");

  const svc = createServiceClient();

  const { data: payments } = await svc
    .from("payments")
    .select("*, profiles:user_id(full_name, email), pricing_plans!left(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: subscriptions } = await svc
    .from("subscriptions")
    .select("*, profiles:user_id(full_name, email), pricing_plans!left(name)")
    .order("created_at", { ascending: false });

  const { data: plans } = await svc
    .from("pricing_plans")
    .select("*")
    .order("sort_order");

  const { data: mpPayments, error: mpError } = await svc
    .from("mp_payment_logs")
    .select("*, profiles:user_id(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (mpError) console.error("mp_payment_logs error:", mpError);

  const { data: appointments } = await svc
    .from("appointments")
    .select(`
      id, status, start_time, modality, price_cents, deposit_cents, balance_cents,
      payment_status, attendance_result, promotion_id, created_at,
      services!service_id(id, name, slug),
      promotions!promotion_id(id, name),
      profiles:client_id(full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  const totalRevenue =
    payments
      ?.filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + p.amount_cents, 0) || 0;

  const sessionRevenue =
    mpPayments
      ?.filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + (Number(p.transaction_amount) || 0), 0) || 0;

  const activeSubscriptions =
    subscriptions?.filter((s) => s.status === "active").length || 0;

  return (
    <AdminPayments
      payments={(payments || []) as any[]}
      subscriptions={(subscriptions || []) as any[]}
      plans={(plans || []) as any[]}
      mpPayments={(mpPayments || []) as any[]}
      appointments={(appointments || []) as any[]}
      totalRevenue={totalRevenue}
      sessionRevenue={sessionRevenue}
      activeSubscriptions={activeSubscriptions}
    />
  );
}
