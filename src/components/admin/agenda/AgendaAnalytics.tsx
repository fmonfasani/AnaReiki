"use client";

import { useEffect, useState } from "react";

type AgendaStats = {
  total_appointments: number;
  confirmed: number;
  cancelled: number;
  no_show: number;
  completed: number;
  pending: number;
  cancellation_rate: number;
  avg_sessions_per_client: number;
  peak_day: number;
  peak_hour: number;
};

export default function AgendaAnalytics() {
  const [stats, setStats] = useState<AgendaStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/agenda-stats");
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-100 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const cards = [
    { label: "Totales", value: stats.total_appointments, color: "text-gray-900", bg: "bg-gray-50", icon: "event" },
    { label: "Confirmadas", value: stats.confirmed, color: "text-green-700", bg: "bg-green-50", icon: "check_circle" },
    { label: "Canceladas", value: stats.cancelled, color: "text-red-700", bg: "bg-red-50", icon: "cancel" },
    { label: "No Asistieron", value: stats.no_show, color: "text-orange-700", bg: "bg-orange-50", icon: "block" },
    { label: "Completadas", value: stats.completed, color: "text-blue-700", bg: "bg-blue-50", icon: "task_alt" },
    { label: "Pendientes", value: stats.pending, color: "text-amber-700", bg: "bg-amber-50", icon: "pending" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 font-display mb-6">
        📊 Analytics de Agenda
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`${card.bg} p-4 rounded-xl border border-gray-100`}>
            <span className="material-symbols-outlined text-gray-400 text-sm block mb-1">{card.icon}</span>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tasa de cancelación</p>
          <p className="text-xl font-bold text-gray-900">{stats.cancellation_rate}%</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Día pico</p>
          <p className="text-xl font-bold text-gray-900">{dayNames[stats.peak_day] || "—"}</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hora pico</p>
          <p className="text-xl font-bold text-gray-900">
            {stats.peak_hour != null ? `${String(stats.peak_hour).padStart(2, "0")}:00 hs` : "—"}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">* Datos de los últimos 30 días</p>
    </div>
  );
}
