import React from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import RuleManager from "@/components/admin/agenda/RuleManager";
import CalendarView from "@/components/admin/agenda/CalendarView";
import AgendaTabs from "@/components/admin/agenda/AgendaTabs";
import AgendaAnalytics from "@/components/admin/agenda/AgendaAnalytics";
import AdminWaitlistManager from "@/components/admin/agenda/AdminWaitlistManager";
import AppointmentManager from "@/components/admin/agenda/AppointmentManager";
import { isAdmin } from "@/lib/auth/roles";

export default async function AgendaPage() {
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

  const svc = createServiceClient();

  const { data: rulesV2 } = await svc
    .from("availability_rules_v2")
    .select("*, services:service_id(name, slug)")
    .order("day_of_week")
    .order("start_time");

  const { data: rawAppointments } = await svc
    .from("appointments")
    .select("*, services!service_id(id, name, slug)")
    .order("start_time", { ascending: false });

  const ids = new Set<string>();
  for (const a of rawAppointments || []) {
    if (a.client_id) ids.add(a.client_id);
    if (a.consultant_id) ids.add(a.consultant_id);
  }
  const allAppointments = rawAppointments || [];
  if (ids.size > 0) {
    const { data: profiles } = await svc
      .from("profiles")
      .select("id, email, full_name")
      .in("id", [...ids]);
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    for (const a of allAppointments) {
      (a as Record<string, unknown>).client = profileMap[a.client_id] || null;
      (a as Record<string, unknown>).consultant = profileMap[a.consultant_id] || null;
    }
  }

  const pendingCount = allAppointments?.filter(a => a.status === 'pending').length || 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Gestión de Agenda 📅
        </h1>
        <p className="text-gray-500">
          Visualiza tu calendario, confirma solicitudes, gestioná slots y revisá analytics.
        </p>
      </header>

      <AgendaAnalytics />

      <AgendaTabs
        pendingCount={pendingCount}
        appointments={allAppointments || []}
        recurringComponent={
          <RuleManager />
        }
        calendarComponent={
          <CalendarView
            rules={rulesV2 || []}
            appointments={allAppointments || []}
          />
        }
      />

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <AppointmentManager />
      </div>

      <AdminWaitlistManager />
    </div>
  );
}
