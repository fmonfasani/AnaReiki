"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, addWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { useAppointmentActions } from "@/hooks/useAppointmentActions";
import { joinWaitlist, getMyWaitlist, cancelWaitlist } from "@/actions/waitlist";
import { createRecurringTemplate, getMyRecurringTemplates } from "@/actions/recurring";

type AvailabilityWindow = {
  start_time: string;
  end_time: string;
  is_available?: boolean;
};

type WaitlistEntry = {
  id: string;
  preferred_date: string;
  preferred_start_time: string;
  status: string;
};

type RecurringEntry = {
  id: string;
  day_of_week: number;
  start_time: string;
  frequency: string;
  services?: { name: string } | null;
};

export default function BookingCalendar() {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<{
    id: string;
    serviceId: string;
  } | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<"weekly" | "biweekly">("weekly");
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [recurringEntries, setRecurringEntries] = useState<RecurringEntry[]>([]);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const { create, isPending: bookingLoading, setError } = useAppointmentActions();
  const supabase = createClient();

  useEffect(() => {
    const fetchAdmin = async () => {
      const { data: consultantSlots } = await supabase
        .from("availability_rules")
        .select("consultant_id")
        .eq("is_active", true)
        .limit(1);

      const consultantId = consultantSlots?.[0]?.consultant_id;
      if (!consultantId) {
        setAdminError("No hay consultantes disponibles en este momento.");
        return;
      }

      const { data: services } = await supabase
        .from("services")
        .select("id")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1);

      if (!services?.[0]?.id) {
        setAdminError("No hay servicios configurados.");
        return;
      }

      setAdminProfile({ id: consultantId, serviceId: services[0].id });
    };
    fetchAdmin();
    loadWaitlist();
    loadRecurring();
  }, []);

  async function loadWaitlist() {
    const entries = await getMyWaitlist();
    setWaitlistEntries(entries as WaitlistEntry[]);
  }

  async function loadRecurring() {
    const entries = await getMyRecurringTemplates();
    setRecurringEntries(entries as RecurringEntry[]);
  }

  async function fetchSlots(date: Date) {
    if (!adminProfile) return;
    setLoading(true);

    const dateString = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay();

    const { data: specificAvailability } = await supabase
      .from("availability_exceptions")
      .select("start_time, end_time, is_available")
      .eq("consultant_id", adminProfile.id)
      .eq("exception_date", dateString);

    let activeWindows: AvailabilityWindow[] = [];

    if (specificAvailability && specificAvailability.length > 0) {
      activeWindows = specificAvailability.filter((slot) => slot.is_available);
    } else {
      const { data: recurringAvailability } = await supabase
        .from("availability_rules")
        .select("start_time, end_time")
        .eq("day_of_week", dayOfWeek)
        .eq("consultant_id", adminProfile.id)
        .eq("is_active", true);

      if (recurringAvailability) {
        activeWindows = recurringAvailability;
      }
    }

    if (activeWindows.length === 0) {
      setAvailableSlots([]);
      setLoading(false);
      return;
    }

    const { data: appointments } = await supabase
      .from("appointments")
      .select("start_time, end_time")
      .eq("consultant_id", adminProfile.id)
      .in("status", ["pending", "confirmed"])
      .gte("start_time", `${dateString}T00:00:00`)
      .lte("end_time", `${dateString}T23:59:59`);

    const slots: string[] = [];
    const duration = 60;
    const buffer = 0;

    activeWindows.forEach((window) => {
      let current = new Date(`${dateString}T${window.start_time}`);
      const windowEnd = new Date(`${dateString}T${window.end_time}`);

      while (true) {
        const slotEnd = new Date(current.getTime() + duration * 60000);
        if (slotEnd > windowEnd) break;

        const timeString = format(current, "HH:mm");

        const isBooked = appointments?.some((app) => {
          const appStart = new Date(app.start_time);
          const appEnd = new Date(app.end_time);
          return current < appEnd && slotEnd > appStart;
        });

        if (!isBooked) {
          slots.push(timeString);
        }

        current = new Date(slotEnd.getTime() + buffer * 60000);
      }
    });

    setAvailableSlots(slots);
    setLoading(false);
  }

  useEffect(() => {
    if (selectedDay && adminProfile) {
      fetchSlots(selectedDay);
    }
  }, [selectedDay, adminProfile]);

  const bookAppointment = async (time: string) => {
    if (!selectedDay || !adminProfile) return;

    const wantsRecurring = showRecurring && availableSlots.includes(time);

    if (!confirm(`¿Confirmar cita para el ${format(selectedDay, "dd/MM")} a las ${time}?${wantsRecurring ? " (se repetirá periódicamente)" : ""}`)) return;

    setError(null);
    setActionMsg(null);
    const dateString = format(selectedDay, "yyyy-MM-dd");
    const startDateTime = `${dateString}T${time}:00`;
    const result = await create({
      serviceId: adminProfile.serviceId,
      consultantId: adminProfile.id,
      startTime: new Date(startDateTime).toISOString(),
    });

    if (result.success) {
      setActionMsg("¡Cita solicitada con éxito!");
      fetchSlots(selectedDay);

      if (wantsRecurring) {
        const [h, m] = time.split(":").map(Number);
        const endH = h + 1;
        const endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

        const rResult = await createRecurringTemplate({
          consultantId: adminProfile.id,
          serviceId: adminProfile.serviceId,
          dayOfWeek: selectedDay.getDay(),
          startTime: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
          endTime,
          frequency: recurringFreq,
        });

        if (rResult.success) {
          setActionMsg("¡Cita solicitada! Sesión recurrente configurada.");
          loadRecurring();
        }
      }
    } else {
      setActionMsg("Error al reservar: " + result.error);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!selectedDay || !adminProfile) return;

    const dateString = format(selectedDay, "yyyy-MM-dd");
    const startTime = "09:00";
    const endTime = "10:00";

    const result = await joinWaitlist({
      consultantId: adminProfile.id,
      serviceId: adminProfile.serviceId,
      preferredDate: dateString,
      preferredStartTime: startTime,
      preferredEndTime: endTime,
    });

    if (result.success) {
      setActionMsg("Te anotamos en la lista de espera. Te avisaremos si se libera un turno.");
      setShowWaitlist(false);
      loadWaitlist();
    } else {
      setActionMsg("Error: " + result.error);
    }
  };

  const handleCancelWaitlist = async (id: string) => {
    const result = await cancelWaitlist(id);
    if (result.success) {
      setActionMsg("Lista de espera cancelada.");
      loadWaitlist();
    }
  };

  return (
    <div className="space-y-6">
      {actionMsg && (
        <div className="rounded-xl border border-pink-200 bg-pink-50 p-4 text-sm text-pink-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-pink-500">info</span>
          {actionMsg}
          <button onClick={() => setActionMsg(null)} className="ml-auto text-pink-400 hover:text-pink-600">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        {adminError && (
          <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {adminError}
          </div>
        )}
        <div className="md:border-r md:border-gray-100 md:pr-6">
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
          <p className="text-sm text-gray-500 mb-4">
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
            <>
              <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto mb-4">
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
                  <div className="col-span-2 text-center py-6 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                    <span className="material-symbols-outlined block text-3xl mb-2">
                      event_busy
                    </span>
                    No hay horarios disponibles para este día.
                  </div>
                )}
              </div>

              {availableSlots.length === 0 && selectedDay && (
                <button
                  onClick={() => setShowWaitlist(!showWaitlist)}
                  className="w-full py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm align-text-bottom mr-1">
                    notifications
                  </span>
                  {showWaitlist ? "Cancelar" : "Anotarme en lista de espera"}
                </button>
              )}

              {showWaitlist && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-800 mb-3">
                    Te avisaremos por email si se libera un turno para este día.
                  </p>
                  <button
                    onClick={handleJoinWaitlist}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                  >
                    Confirmar lista de espera
                  </button>
                </div>
              )}

              {availableSlots.length > 0 && (
                <>
                  <label className="flex items-center gap-2 mt-4 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRecurring}
                      onChange={(e) => setShowRecurring(e.target.checked)}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-600">
                      Repetir esta cita semanalmente
                    </span>
                  </label>
                  {showRecurring && (
                    <select
                      value={recurringFreq}
                      onChange={(e) => setRecurringFreq(e.target.value as "weekly" | "biweekly")}
                      className="w-full border-gray-200 rounded-lg text-sm focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="weekly">Todas las semanas</option>
                      <option value="biweekly">Cada dos semanas</option>
                    </select>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {waitlistEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 font-display">
            Mis solicitudes en lista de espera
          </h3>
          <div className="space-y-2">
            {waitlistEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {format(new Date(entry.preferred_date), "dd/MM/yyyy", { locale: es })} — {entry.preferred_start_time.slice(0, 5)} hs
                  </p>
                  <p className="text-xs text-amber-600">
                    {entry.status === "waiting" ? "Esperando notificación" : entry.status}
                  </p>
                </div>
                {entry.status === "waiting" && (
                  <button
                    onClick={() => handleCancelWaitlist(entry.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {recurringEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 font-display">
            Mis sesiones recurrentes
          </h3>
          <div className="space-y-2">
            {recurringEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    Día {["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][entry.day_of_week]} — {entry.start_time.slice(0, 5)} hs
                  </p>
                  <p className="text-xs text-purple-600">
                    {entry.frequency === "weekly" ? "Semanal" : "Cada 15 días"}
                    {entry.services?.name ? ` — ${entry.services.name}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
