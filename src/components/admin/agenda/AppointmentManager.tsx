"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

type Appointment = {
  id: string;
  start_time: string;
  end_time: string;
  modality: string;
  status: string;
  attendance_result?: string | null;
  notes: string | null;
  price_cents: number | null;
  deposit_cents: number | null;
  balance_cents: number | null;
  payment_status: string | null;
  created_at: string;
  services: { id: string; name: string; slug: string } | null;
  client: { id: string; email: string; full_name: string | null } | null;
};

export default function AppointmentManager() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [completeModal, setCompleteModal] = useState<{ appointmentId: string; clientName: string } | null>(null);

  const fetchAppointments = async () => {
    const r = await fetch("/api/admin/appointments");
    const j = await r.json();
    setAppointments(j.data || []);
  };

  useEffect(() => {
    fetchAppointments()
      .catch((err) => {
        console.error("AppointmentManager fetch error:", err);
        setActionMsg({ type: "error", text: "Error al cargar turnos: " + err.message });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, action: string) => {
    const endpoint = action === "confirm" ? "/api/appointments/approve" : `/api/appointments/${id}/complete`;
    const body = action === "confirm"
      ? { appointment_id: id }
      : { attendance_result: action };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (res.ok) {
      const msg = action === "confirm" ? "Turno confirmado" : `Turno completado (${action})`;
      setActionMsg({ type: "ok", text: msg });
      await fetchAppointments();
    } else {
      setActionMsg({ type: "error", text: json.error || "Error" });
    }
  };

  const handleMarkBalancePaid = async (id: string) => {
    if (!confirm("¿Marcar el saldo restante como pagado? (efectivo/transferencia)")) return;
    setLoadingId(id);
    try {
      const res = await fetch("/api/admin/appointments/mark-balance-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: id }),
      });
      const json = await res.json();
      if (res.ok) {
        setActionMsg({ type: "ok", text: "Saldo marcado como pagado" });
        await fetchAppointments();
      } else {
        setActionMsg({ type: "error", text: json.error || "Error" });
      }
    } catch {
      setActionMsg({ type: "error", text: "Error de conexión" });
    }
    setLoadingId(null);
  };

  const filtered = filter === "all"
    ? appointments
    : appointments.filter((a) => a.status === filter);

  const statusColors: Record<string, string> = {
    pending_payment: "bg-amber-50 text-amber-600",
    pending_confirmation: "bg-purple-50 text-purple-600",
    confirmed: "bg-blue-50 text-blue-600",
    completed: "bg-green-50 text-green-600",
    cancelled: "bg-red-50 text-red-600",
  };

  const statusLabels: Record<string, string> = {
    pending_payment: "Pendiente de pago",
    pending_confirmation: "Pendiente confirmación",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
  };

  if (loading) {
    return <p className="text-[var(--color-text-light)]">Cargando turnos...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold font-display">Gestión de Reservas</h3>
        <div className="flex gap-2">
          {["all", "pending_confirmation", "confirmed", "completed", "cancelled"].map((s) => (
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
            No hay turnos{filter !== "all" ? ` ${statusLabels[filter]?.toLowerCase() || ""}` : ""}
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
                  {apt.attendance_result && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      apt.attendance_result === "attended" ? "bg-green-100 text-green-700" :
                      apt.attendance_result === "no_show" ? "bg-red-100 text-red-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      {apt.attendance_result === "attended" ? "Asistió" :
                       apt.attendance_result === "no_show" ? "No asistió" : "Reprogramado"}
                    </span>
                  )}
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
                  {(apt.price_cents || apt.deposit_cents || apt.balance_cents) ? (
                    <div className="flex gap-3 text-xs text-gray-400 mt-1">
                      {apt.price_cents ? <span>Total: ${(apt.price_cents / 100).toFixed(2)}</span> : null}
                      {apt.deposit_cents ? <span>Seña: ${(apt.deposit_cents / 100).toFixed(2)}</span> : null}
                      {apt.balance_cents && apt.balance_cents > 0 ? <span className="text-amber-500 font-medium">Saldo: ${(apt.balance_cents / 100).toFixed(2)}</span> : null}
                      {apt.balance_cents === 0 && apt.deposit_cents ? <span className="text-green-500 font-medium">Saldado ✓</span> : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {apt.status === "pending_confirmation" && (
                  <>
                    <button
                      onClick={() => handleAction(apt.id, "confirm")}
                      className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:opacity-90"
                    >
                      ✓ Confirmar
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("¿Rechazar este turno?")) return;
                        const res = await fetch("/api/appointments/reject", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ appointment_id: apt.id, action: "refund" }),
                        });
                        const json = await res.json();
                        if (res.ok) {
                          setActionMsg({ type: "ok", text: "Turno rechazado" });
                          await fetchAppointments();
                        } else {
                          setActionMsg({ type: "error", text: json.error || "Error" });
                        }
                      }}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:opacity-90"
                    >
                      ✗ Rechazar
                    </button>
                  </>
                )}

                {apt.status === "confirmed" && (
                  <>
                    {(apt.balance_cents || 0) > 0 && (
                      <button
                        onClick={() => handleMarkBalancePaid(apt.id)}
                        disabled={loadingId === apt.id}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50"
                      >
                        {loadingId === apt.id ? "..." : "💰 Saldo pagado"}
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(apt.id, "attended")}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:opacity-90"
                    >
                      ✓ Asistió
                    </button>
                    <button
                      onClick={() => handleAction(apt.id, "no_show")}
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
