"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

type Appointment = {
  id: string;
  start_time: string;
  end_time: string;
  modality: string;
  status: string;
  notes: string | null;
  created_at: string;
  services: { id: string; name: string; slug: string } | null;
  client: { id: string; email: string; full_name: string | null } | null;
};

export default function AppointmentManager() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [actionMsg, setActionMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/appointments")
      .then((r) => r.json())
      .then((j) => setAppointments(j.data || []))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, action: string, reason?: string) => {
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    const json = await res.json();
    if (res.ok) {
      setActionMsg({ type: "ok", text: `Turno ${action === "confirm" ? "confirmado" : action === "complete" ? "completado" : action === "cancel" ? "cancelado" : "marcado como no-show"}` });
      const r = await fetch("/api/admin/appointments");
      const j = await r.json();
      setAppointments(j.data || []);
    } else {
      setActionMsg({ type: "error", text: json.error || "Error" });
    }
  };

  const filtered = filter === "all"
    ? appointments
    : appointments.filter((a) => a.status === filter);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-600",
    confirmed: "bg-blue-50 text-blue-600",
    completed: "bg-green-50 text-green-600",
    cancelled: "bg-red-50 text-red-600",
    no_show: "bg-gray-100 text-gray-600",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
    no_show: "No-show",
  };

  if (loading) {
    return <p className="text-[var(--color-text-light)]">Cargando turnos...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold font-display">Gestión de Reservas</h3>
        <div className="flex gap-2">
          {["all", "pending", "confirmed", "completed", "cancelled", "no_show"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-[var(--color-primary-dark)] text-white"
                  : "bg-gray-100 text-[var(--color-text-light)] hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "Todos" : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-3 rounded-xl text-sm ${
            actionMsg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {actionMsg.text}
          <button onClick={() => setActionMsg(null)} className="float-right font-bold">×</button>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-[var(--color-text-light)]">
            No hay turnos{filter !== "all" ? ` ${statusLabels[filter].toLowerCase()}` : ""}s
          </div>
        )}

        {filtered.map((apt) => (
          <motion.div
            key={apt.id}
            layout
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-text-main)]">
                    {apt.services?.name || "Sin servicio"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[apt.status] || ""}`}>
                    {statusLabels[apt.status] || apt.status}
                  </span>
                </div>
                <div className="text-sm text-[var(--color-text-light)] space-y-0.5">
                  <p>
                    {new Date(apt.start_time).toLocaleDateString("es-AR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    - {new Date(apt.start_time).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    {" → "}
                    {new Date(apt.end_time).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="capitalize">
                    {apt.modality === "online" ? "💻 Online" : "🏠 Presencial"}
                    {" — "}
                    {apt.client?.full_name || apt.client?.email || "Sin cliente"}
                  </p>
                  {apt.notes && <p className="italic text-xs">{apt.notes}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {apt.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleAction(apt.id, "confirm")}
                      className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:opacity-90"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleAction(apt.id, "cancel", "Cancelado por admin")}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:opacity-90"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {apt.status === "confirmed" && (
                  <>
                    <button
                      onClick={() => handleAction(apt.id, "complete")}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:opacity-90"
                    >
                      Completar
                    </button>
                    <button
                      onClick={() => handleAction(apt.id, "no-show")}
                      className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium hover:opacity-90"
                    >
                      No-show
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
