"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, addMonths } from "date-fns";
import { es } from "date-fns/locale";

export default function BookingCalendar({ userId }: { userId: string }) {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);

  const supabase = createClient();

  // Fetch Admin Profile on mount to get settings
  useEffect(() => {
    const fetchAdmin = async () => {
      // Find the admin user to get their settings/id
      // For this app we assume there is one main admin/consultant.
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "admin") // Assuming role is 'admin'
        .limit(1);

      if (profiles && profiles.length > 0) {
        setAdminProfile(profiles[0]);
      }
    };
    fetchAdmin();
  }, []);

  useEffect(() => {
    if (selectedDay && adminProfile) {
      fetchSlots(selectedDay);
    }
  }, [selectedDay, adminProfile]);

  const fetchSlots = async (date: Date) => {
    if (!adminProfile) return;
    setLoading(true);

    const dateString = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay(); // 0-6

    // 1. Check for Specific Date Override (Blocked or Custom)
    const { data: specificAvailability } = await supabase
      .from("availability")
      .select("start_time, end_time, is_available")
      .eq("consultant_id", adminProfile.id)
      .eq("specific_date", dateString);

    let activeWindows: any[] = [];

    if (specificAvailability && specificAvailability.length > 0) {
      // If specific rules exist, they override recurring.
      // Filter only available ones. If is_available=false (blocked), this will be empty.
      activeWindows = specificAvailability.filter((slot) => slot.is_available);
    } else {
      // 2. Fallback to Recurring
      const { data: recurringAvailability } = await supabase
        .from("availability")
        .select("start_time, end_time")
        .eq("day_of_week", dayOfWeek)
        .eq("consultant_id", adminProfile.id)
        .is("specific_date", null) // Only recurring
        .eq("is_available", true); // Use correct column

      if (recurringAvailability) {
        activeWindows = recurringAvailability;
      }
    }

    if (activeWindows.length === 0) {
      setAvailableSlots([]);
      setLoading(false);
      return;
    }

    // 3. Get existing appointments for this specific date
    const { data: appointments } = await supabase
      .from("appointments")
      .select("start_time, end_time")
      .eq("consultant_id", adminProfile.id)
      .eq("status", "pending")
      .gte("start_time", `${dateString}T00:00:00`)
      .lte("end_time", `${dateString}T23:59:59`);

    // 4. Generate slots (Dynamic logic)
    const slots: string[] = [];
    const duration = adminProfile.user_metadata?.session_duration || 60; // Minutes
    const buffer = adminProfile.user_metadata?.buffer_time || 0; // Minutes

    activeWindows.forEach((window: any) => {
      let current = new Date(`${dateString}T${window.start_time}`);
      const windowEnd = new Date(`${dateString}T${window.end_time}`);

      // While (current + duration) <= windowEnd
      while (true) {
        const slotEnd = new Date(current.getTime() + duration * 60000);
        if (slotEnd > windowEnd) break;

        const timeString = format(current, "HH:mm");

        // Check collision
        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        const isBooked = appointments?.some((app) => {
          const appStart = new Date(app.start_time);
          const appEnd = new Date(app.end_time);
          return current < appEnd && slotEnd > appStart;
        });

        if (!isBooked) {
          slots.push(timeString);
        }

        // Increment: current + duration + buffer
        current = new Date(slotEnd.getTime() + buffer * 60000);
      }
    });

    setAvailableSlots(slots);
    setLoading(false);
  };

  const bookAppointment = async (time: string) => {
    if (!selectedDay || !userId || !adminProfile) return;

    const duration = adminProfile.user_metadata?.session_duration || 60;

    if (
      !confirm(
        `¿Confirmar cita para el ${format(selectedDay, "dd/MM")} a las ${time}?`,
      )
    )
      return;

    setBookingLoading(true);
    const dateString = format(selectedDay, "yyyy-MM-dd");
    const startDateTime = `${dateString}T${time}:00`;

    // Calculate end time dynamic
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const endDateTime = endDate.toISOString();

    const { error } = await supabase.from("appointments").insert([
      {
        user_id: userId,
        consultant_id: adminProfile.id,
        start_time: startDate.toISOString(),
        end_time: endDateTime,
        status: "pending",
      },
    ]);

    setBookingLoading(false);

    if (!error) {
      alert("¡Cita solicitada con éxito! Recibirás confirmación pronto.");
      fetchSlots(selectedDay); // Refresh
    } else {
      alert("Error al reservar: " + error.message);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="border-r border-gray-100 pr-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 font-display">
          Selecciona una fecha
        </h3>
        <style>{`.rdp { --rdp-accent-color: #db2777; --rdp-background-color: #fce7f3; margin: 0; } .rdp-day_selected:not([disabled]) { color: white; }`}</style>
        <DayPicker
          mode="single"
          selected={selectedDay}
          onSelect={setSelectedDay}
          locale={es}
          disabled={{ before: new Date() }}
          footer={
            <p className="mt-4 text-sm text-gray-500">
              * Solo se muestran días con disponibilidad.
            </p>
          }
        />
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1 font-display">
          Horarios Disponibles
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          {selectedDay
            ? format(selectedDay, "EEEE d 'de' MMMM", { locale: es })
            : "Selecciona un día"}
        </p>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-50 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
            {availableSlots.length > 0 ? (
              availableSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => bookAppointment(time)}
                  disabled={bookingLoading}
                  className="px-4 py-2 text-sm font-medium text-pink-700 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors border border-pink-100 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                >
                  {time} hs
                </button>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                <span className="material-symbols-outlined block text-3xl mb-2">
                  event_busy
                </span>
                No hay horarios disponibles para este día.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
