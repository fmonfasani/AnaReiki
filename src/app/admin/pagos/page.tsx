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
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (mpError) console.error("mp_payment_logs error:", mpError);

  const { data: rawAppointments } = await svc
    .from("appointments")
    .select("id, status, start_time, modality, price_cents, deposit_cents, balance_cents, payment_status, attendance_result, promotion_id, service_id, client_id, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const appointments = rawAppointments || [];

  const serviceIds = [...new Set(appointments.map(a => a.service_id).filter(Boolean))];
  const promoIds = [...new Set(appointments.map(a => a.promotion_id).filter(Boolean))];
  const clientIds = [...new Set(appointments.map(a => a.client_id).filter(Boolean))];

  const [servicesRes, promosRes, profilesRes] = await Promise.all([
    serviceIds.length > 0
      ? svc.from("services").select("id, name, slug").in("id", serviceIds)
      : Promise.resolve({ data: [] }),
    promoIds.length > 0
      ? svc.from("promotions").select("id, name").in("id", promoIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? svc.from("profiles").select("id, full_name, email").in("id", clientIds)
      : Promise.resolve({ data: [] }),
  ]);

  const serviceMap = Object.fromEntries((servicesRes.data || []).map(s => [s.id, s]));
  const promoMap = Object.fromEntries((promosRes.data || []).map(p => [p.id, p]));
  const profileMap = Object.fromEntries((profilesRes.data || []).map(p => [p.id, p]));

  for (const a of appointments) {
    (a as Record<string, unknown>).services = serviceMap[a.service_id] || null;
    (a as Record<string, unknown>).promotions = promoMap[a.promotion_id] || null;
    (a as Record<string, unknown>).profiles = profileMap[a.client_id] || null;
  }

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
