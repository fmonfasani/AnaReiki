import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AvailabilityConfig from "@/components/admin/agenda/AvailabilityConfig";
import CalendarView from "@/components/admin/agenda/CalendarView";
import AgendaTabs from "@/components/admin/agenda/AgendaTabs";

export default async function AgendaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch recurring availability
  const { data: availability } = await supabase
    .from("availability")
    .select("*")
    .eq("consultant_id", user.id)
    .is("specific_date", null) // Only recurring rules
    .order("day_of_week")
    .order("start_time");

  // Fetch specific availability (overrides)
  const { data: specificAvailability } = await supabase
    .from("availability")
    .select("*")
    .eq("consultant_id", user.id)
    .not("specific_date", "is", null)
    .order("specific_date");

  // Fetch appointments for current month (MVP: fetch next 30 days)
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, profiles:client_id(full_name)")
    .eq("consultant_id", user.id)
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
          Visualiza tu calendario, citas pendientes y configura tu
          disponibilidad.
        </p>
      </header>

      <AgendaTabs
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
