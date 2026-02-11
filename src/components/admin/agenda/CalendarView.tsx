"use client";

import { useState } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  isSameMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  saveSpecificSlot,
  deleteSpecificSlot,
  blockDate,
  unblockDate,
} from "@/actions/agenda";

interface CalendarViewProps {
  recurringAvailability: any[];
  specificAvailability: any[];
  appointments: any[];
}

type ViewMode = "month" | "week";

export default function CalendarView({
  recurringAvailability,
  specificAvailability,
  appointments,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Helper to get days to display
  const getDays = () => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, {
        weekStartsOn: 1,
      }); // Monday start
      const end = endOfWeek(currentDate, {
        weekStartsOn: 1,
      });
      return eachDayOfInterval({
        start,
        end,
      });
    }

    // Month View Logic:
    // 1. Get first and last day of current month
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    // 2. Pad start to Monday
    const startDate = startOfWeek(monthStart, {
      weekStartsOn: 1,
    });

    // 3. Pad end to Sunday
    const endDate = endOfWeek(monthEnd, {
      weekStartsOn: 1,
    });

    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  };

  const days = getDays();

  const handlePrev = () => {
    if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addMonths(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const getSlotsForDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");

    // 1. Check specific overrides
    const specific = specificAvailability.filter(
      (s) => s.specific_date === dateString,
    );

    // Check if explicitly blocked
    const isBlocked = specific.some((s) => s.is_available === false);
    if (isBlocked) return "BLOCKED";

    if (specific.length > 0) return specific;

    // 2. Fallback to recurring
    // Note: JS getDay() returns 0 for Sunday, 1 for Monday.
    // Our DB uses 0=Sunday (based on date-fns/standard usually), let's check input data.
    // Assuming 0-6 match.
    const dayOfWeek = date.getDay();
    return recurringAvailability.filter((s) => s.day_of_week === dayOfWeek);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 font-display capitalize">
          {format(currentDate, "MMMM yyyy", { locale: es })}
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-sm font-bold text-pink-600 px-3 py-1 hover:bg-pink-50 rounded-lg"
          >
            Hoy
          </button>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === "week" ? "bg-white shadow text-gray-900 font-medium" : "text-gray-500"}`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === "month" ? "bg-white shadow text-gray-900 font-medium" : "text-gray-500"}`}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-4">
        {days.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);
          const slots = getSlotsForDate(day);
          const isBlocked = slots === "BLOCKED";
          const dayAppointments = appointments.filter((a) =>
            isSameDay(parseISO(a.start_time), day),
          );

          return (
            <div
              key={day.toISOString()}
              className={`
                        border rounded-xl p-3 flex flex-col gap-2 transition-all relative group
                        ${viewMode === "week" ? "min-h-[200px]" : "min-h-[120px]"}
                        ${isToday ? "border-pink-200 bg-pink-50/30" : "border-gray-100"}
                        ${isBlocked ? "bg-gray-100/50" : ""}
                        ${!isCurrentMonth && viewMode === "month" ? "opacity-40" : ""}
                    `}
            >
              <div className="text-center mb-2 flex justify-between items-start">
                <div className="flex-1">
                  <span className="text-xs text-gray-500 uppercase font-bold block">
                    {format(day, "EEE", { locale: es })}
                  </span>
                  <span
                    className={`text-lg font-bold ${isToday ? "text-pink-600" : "text-gray-900"}`}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Block/Unblock Button (Visible on hover) */}
                {isBlocked ? (
                  <button
                    onClick={() => unblockDate(format(day, "yyyy-MM-dd"))}
                    title="Desbloquear día"
                    className="text-gray-400 hover:text-green-600"
                  >
                    <span className="material-symbols-outlined text-sm">
                      lock_open
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => blockDate(format(day, "yyyy-MM-dd"))}
                    title="Bloquear día entero"
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-sm">
                      block
                    </span>
                  </button>
                )}
              </div>

              {/* Availability Slots */}
              {isBlocked ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-400 border border-gray-200 rounded px-2 py-0.5 bg-gray-50">
                    BLOQUEADO
                  </span>
                </div>
              ) : (
                <>
                  {Array.isArray(slots) && slots.length > 0 ? (
                    slots.map((slot: any) => (
                      <div
                        key={slot.id || Math.random()}
                        className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 flex justify-between group/slot"
                      >
                        <span>
                          {slot.start_time.slice(0, 5)} -{" "}
                          {slot.end_time.slice(0, 5)}
                        </span>
                        {slot.specific_date && (
                          <button
                            onClick={() => deleteSpecificSlot(slot.id)}
                            className="hidden group-hover/slot:block text-red-500 hover:text-red-700"
                          >
                            <span className="material-symbols-outlined text-[10px]">
                              close
                            </span>
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-4 italic">
                      No disponible
                    </div>
                  )}

                  {/* Appointments */}
                  {dayAppointments.map((appt: any) => (
                    <div
                      key={appt.id}
                      className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 font-medium"
                    >
                      {format(parseISO(appt.start_time), "HH:mm")} -{" "}
                      {appt.profiles?.full_name || "Cita"}
                    </div>
                  ))}

                  {/* Add Slot Button */}
                  <button
                    onClick={() => {
                      const time = prompt(
                        "Ingresa hora inicio y fin (ej: 10:00-11:00)",
                      );
                      if (time) {
                        const [start, end] = time.split("-");
                        if (start && end) {
                          saveSpecificSlot(day, start.trim(), end.trim());
                        }
                      }
                    }}
                    className="mt-auto w-full py-1 text-xs text-center text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded border border-transparent hover:border-pink-100 transition-all opacity-0 group-hover:opacity-100"
                  >
                    + Agregar Hora
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
