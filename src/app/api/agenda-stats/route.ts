import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/roles";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const admin = await isAdmin(user, supabase);
    const svc = createServiceClient();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    let query = svc
      .from("appointments")
      .select("id, status, start_time, attendance_result, created_at")
      .gte("created_at", thirtyDaysAgo);

    if (!admin) {
      query = query.eq("client_id", user.id);
    }

    const { data: appointments, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const all = appointments || [];
    const total = all.length;
    const confirmed = all.filter(a => a.status === "confirmed").length;
    const cancelled = all.filter(a => a.status === "cancelled").length;
    const completed = all.filter(a => a.status === "completed").length;
    const pending = all.filter(a => a.status === "pending_payment").length;
    const pending_confirmation = all.filter(a => a.status === "pending_confirmation").length;
    const noShow = all.filter(a => a.attendance_result === "no_show").length;
    const rescheduled = all.filter(a => a.attendance_result === "rescheduled").length;

    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

    const dayCounts: Record<number, number> = {};
    const hourCounts: Record<number, number> = {};
    for (const a of all) {
      const d = new Date(a.start_time);
      const day = d.getDay();
      const hour = d.getHours();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    const stats = {
      total_appointments: total,
      confirmed,
      cancelled,
      no_show: noShow,
      completed,
      pending,
      pending_confirmation,
      cancellation_rate: cancellationRate,
      peak_day: peakDay ? Number(peakDay[0]) : 0,
      peak_hour: peakHour ? Number(peakHour[0]) : null,
      attended: all.filter(a => a.attendance_result === "attended").length,
      rescheduled,
      avg_sessions_per_client: 0,
    };

    return NextResponse.json({ stats });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
