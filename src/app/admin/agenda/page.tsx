import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AvailabilityConfig from "@/components/admin/agenda/AvailabilityConfig";
import CalendarView from "@/components/admin/agenda/CalendarView";
import AgendaTabs from "@/components/admin/agenda/AgendaTabs";
import AgendaAnalytics from "@/components/admin/agenda/AgendaAnalytics";
import AdminWaitlistManager from "@/components/admin/agenda/AdminWaitlistManager";
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

  const { data: availability } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("consultant_id", user.id)
    .eq("is_active", true)
    .order("day_of_week")
    .order("start_time");

  const { data: specificAvailability } = await supabase
    .from("availability_exceptions")
    .select("*")
    .eq("consultant_id", user.id)
    .order("exception_date");

  const { data: allAppointments } = await supabase
    .from("appointments")
    .select("*, profiles:client_id(full_name), services:service_id(name)")
    .order("start_time", { ascending: false });

  const pendingCount = allAppointments?.filter(a => a.status === 'pending').length || 0;

  const sessionDuration = user.user_metadata?.session_duration || 60;
  const bufferTime = user.user_metadata?.buffer_time || 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Gestión de Agenda 📅
        </h1>
        <p className="text-gray-500">
          Visualiza tu calendario, confirma solicitudes, revisa analytics y gestioná la lista de espera.
        </p>
      </header>

      <AgendaAnalytics />

      <AgendaTabs
        pendingCount={pendingCount}
        appointments={allAppointments || []}
        recurringComponent={
          <AvailabilityConfig
            initialData={availability || []}
            sessionDuration={sessionDuration}
            bufferTime={bufferTime}
          />
        }
        calendarComponent={
          <CalendarView
            recurringAvailability={availability || []}
            specificAvailability={specificAvailability || []}
            appointments={allAppointments || []}
          />
        }
      />

      <AdminWaitlistManager />
    </div>
  );
}
