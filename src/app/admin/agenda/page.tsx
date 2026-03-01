import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AvailabilityConfig from "@/components/admin/agenda/AvailabilityConfig";
import CalendarView from "@/components/admin/agenda/CalendarView";
import AgendaTabs from "@/components/admin/agenda/AgendaTabs";
import PendingAppointments from "@/components/admin/agenda/PendingAppointments";
import { isAdminFromAppMetadata } from "@/lib/auth/roles";

export default async function AgendaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  if (!isAdminFromAppMetadata(user)) {
    redirect("/miembros");
  }

  // Fetch recurring availability (from new rules table)
  const { data: availability } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("consultant_id", user.id)
    .eq("is_active", true)
    .order("day_of_week")
    .order("start_time");

  // Fetch specific availability (from exceptions table)
  const { data: specificAvailability } = await supabase
    .from("availability_exceptions")
    .select("*")
    .eq("consultant_id", user.id)
    .order("exception_date");

  // Fetch ALL pending appointments (for the requests tab)
  const { data: pendingAppointments } = await supabase
    .from("appointments")
    .select("*, profiles:client_id(full_name)")
    .eq("consultant_id", user.id)
    .eq("status", "pending")
    .order("start_time", { ascending: true });

  // Fetch appointments for current calendar view (confirmed/upcoming)
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, profiles:client_id(full_name)")
    .eq("consultant_id", user.id)
    .neq("status", "cancelled")
    .gte("start_time", today.toISOString())
    .lte("end_time", nextMonth.toISOString());

  // Fetch session duration from metadata (default to 60 if not set)
  const sessionDuration = user.user_metadata?.session_duration || 60;
  const bufferTime = user.user_metadata?.buffer_time || 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Gestión de Agenda 📅
        </h1>
        <p className="text-gray-500">
          Visualiza tu calendario, confirma nuevas solicitudes y configura tu
          disponibilidad.
        </p>
      </header>

      <AgendaTabs
        pendingCount={pendingAppointments?.length || 0}
        pendingComponent={
          <PendingAppointments appointments={pendingAppointments || []} />
        }
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
            appointments={appointments || []}
          />
        }
      />
    </div>
  );
}
