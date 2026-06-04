import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const svc = createServiceClient();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    { count: totalUsers },
    { count: premiumUsers },
    { count: pendingAppointments },
    { count: appointmentsThisMonth },
    moodResult,
  ] = await Promise.all([
    svc.from("profiles").select("*", { count: "exact", head: true }),
    svc
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_premium", true),
    svc
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    svc
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("start_time", firstOfMonth.toISOString()),
    svc
      .from("daily_reflections")
      .select("mood_score")
      .gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  const { count: activeThisMonth } = await svc
    .from("daily_reflections")
    .select("user_id", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo.toISOString());

  const { count: recentSignups } = await svc
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo.toISOString());

  const avgMood =
    moodResult.data && moodResult.data.length > 0
      ? Math.round(
          (moodResult.data.reduce((s, r) => s + r.mood_score, 0) /
            moodResult.data.length) *
            10,
        ) / 10
      : null;

  return (
    <AdminDashboard
      kpis={{
        totalUsers: totalUsers || 0,
        premiumUsers: premiumUsers || 0,
        pendingAppointments: pendingAppointments || 0,
        activeThisMonth: activeThisMonth || 0,
        appointmentsThisMonth: appointmentsThisMonth || 0,
        recentSignups: recentSignups || 0,
        avgMood,
      }}
    />
  );
}
