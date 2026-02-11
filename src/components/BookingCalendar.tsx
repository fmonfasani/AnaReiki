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
  const supabase = createClient();

  useEffect(() => {
    if (selectedDay) {
      fetchSlots(selectedDay);
    }
  }, [selectedDay]);

  const fetchSlots = async (date: Date) => {
    setLoading(true);
    const dayOfWeek = date.getDay(); // 0-6

    // 1. Get Teacher's availability for this day of week
    const { data: availability } = await supabase
      .from("availability")
      .select("start_time, end_time")
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    if (!availability || availability.length === 0) {
      setAvailableSlots([]);
      setLoading(false);
      return;
    }

    // 2. Get existing appointments for this specific date
    const dateString = format(date, "yyyy-MM-dd");
    const { data: appointments } = await supabase
      .from("appointments")
      .select("start_time")
      .gte("start_time", `${dateString}T00:00:00`)
      .lte("end_time", `${dateString}T23:59:59`)
      .not("status", "eq", "cancelled");

    // 3. Generate slots (simplified logic: 1 hour slots)
    const slots: string[] = [];

    availability.forEach((window) => {
      let current = new Date(`${dateString}T${window.start_time}`);
      const end = new Date(`${dateString}T${window.end_time}`);

      while (current < end) {
        const timeString = format(current, "HH:mm");

        // Check collision
        const isBooked = appointments?.some((app) => {
          const appTime = new Date(app.start_time).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return appTime === timeString;
        });

        if (!isBooked) {
          slots.push(timeString);
        }

        // Increment 1 hour
        current.setHours(current.getHours() + 1);
      }
    });

    setAvailableSlots(slots);
    setLoading(false);
  };

  const bookAppointment = async (time: string) => {
    if (!selectedDay || !userId) return;
    if (
      !confirm(
        `¿Confirmar cita para el ${format(selectedDay, "dd/MM")} a las ${time}?`,
      )
    )
      return;

    setBookingLoading(true);
    const dateString = format(selectedDay, "yyyy-MM-dd");
    const startDateTime = `${dateString}T${time}:00`;

    // Calculate end time (assuming 1 hour duration)
    const endDate = new Date(startDateTime);
    endDate.setHours(endDate.getHours() + 1);
    const endDateTime = endDate.toISOString();

    const { error } = await supabase.from("appointments").insert([
      {
        user_id: userId,
        start_time: new Date(startDateTime).toISOString(),
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
