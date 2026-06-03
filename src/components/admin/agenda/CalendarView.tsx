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
import type { RuleV2 } from "@/types/appointments";

type Appointment = {
  id: string;
  start_time: string;
  profiles: {
    full_name: string | null;
  } | null;
};

interface CalendarViewProps {
  rules: RuleV2[];
  appointments: Appointment[];
}

type ViewMode = "month" | "week";

export default function CalendarView({
  rules,
  appointments,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  const getDays = () => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, {
        weekStartsOn: 1,
      });
      const end = endOfWeek(currentDate, {
        weekStartsOn: 1,
      });
      return eachDayOfInterval({ start, end });
    }
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
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

  const getWindowsForDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    const specific = rules.filter((r) => r.specific_date === dateString);
    if (specific.length > 0) return specific;
    const dayOfWeek = date.getDay();
    return rules.filter((r) => r.day_of_week === dayOfWeek && r.is_active);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 font-display capitalize">
          {format(currentDate, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-full">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-sm font-bold text-pink-600 px-3 py-1 hover:bg-pink-50 rounded-lg"
          >
            Hoy
          </button>
          <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-full">
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

      <div className="grid grid-cols-7 gap-4">
        {days.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);
          const windows = getWindowsForDate(day);
          const dayAppointments = appointments.filter((a) =>
            isSameDay(parseISO(a.start_time), day),
          );

          return (
            <div
              key={day.toISOString()}
              className={`
                border rounded-xl p-3 flex flex-col gap-2 transition-all
                ${viewMode === "week" ? "min-h-[200px]" : "min-h-[120px]"}
                ${isToday ? "border-pink-200 bg-pink-50/30" : "border-gray-100"}
                ${!isCurrentMonth && viewMode === "month" ? "opacity-40" : ""}
              `}
            >
              <div className="text-center mb-2">
                <span className="text-xs text-gray-500 uppercase font-bold block">
                  {format(day, "EEE", { locale: es })}
                </span>
                <span className={`text-lg font-bold ${isToday ? "text-pink-600" : "text-gray-900"}`}>
                  {format(day, "d")}
                </span>
              </div>

              {windows.length > 0 ? (
                windows.map((rule) => (
                  <div
                    key={rule.id}
                    className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100"
                  >
                    {rule.start_time.slice(0, 5)} - {rule.end_time.slice(0, 5)}
                    <span className="ml-1 text-[10px] opacity-60">{rule.duration_minutes}min</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 text-center py-4 italic">
                  No disponible
                </div>
              )}

              {dayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 font-medium"
                >
                  {format(parseISO(appt.start_time), "HH:mm")} -{" "}
                  {appt.profiles?.full_name || "Cita"}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
