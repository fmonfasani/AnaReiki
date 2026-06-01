"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

type Slot = {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  modality: "online" | "presencial";
  service_id: string | null;
  capacity: number;
  booked_count: number;
  is_available: boolean;
  services?: { id: string; name: string; slug: string } | null;
};

type Service = {
  id: string;
  name: string;
  slug: string;
  duration_minutes: number;
  allowed_modalities: string[];
};

export default function SlotManager() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "add" | "batch">("list");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [modality, setModality] = useState<"online" | "presencial">("online");
  const [serviceId, setServiceId] = useState("");
  const [capacity, setCapacity] = useState(1);
  const [notes, setNotes] = useState("");

  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split("T")[0];
  });
  const [batchSchedule, setBatchSchedule] = useState<Record<string, { start: string; end: string }[]>>({});

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/availability/slots").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ]).then(([slotsRes, servicesRes]) => {
      setSlots(slotsRes.data || []);
      setServices(servicesRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const loadSlots = async () => {
    const res = await fetch("/api/admin/availability/slots");
    const json = await res.json();
    setSlots(json.data || []);
  };

  const handleAddSlot = async () => {
    if (!date || !startTime || !endTime) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/availability/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          start: startTime,
          end: endTime,
          modality,
          service_id: serviceId || null,
          capacity,
          notes: notes || null,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setMsg({ type: "ok", text: "Slot creado" });
        setMode("list");
        loadSlots();
      } else {
        setMsg({ type: "error", text: json.error || "Error" });
      }
    } catch {
      setMsg({ type: "error", text: "Error de conexión" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    const res = await fetch(`/api/admin/availability/slots/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSlots((prev) => prev.filter((s) => s.id !== id));
      setMsg({ type: "ok", text: "Slot eliminado" });
    }
  };

  const toggleSlot = async (slot: Slot) => {
    const res = await fetch(`/api/admin/availability/slots/${slot.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_available: !slot.is_available }),
    });
    if (res.ok) {
      loadSlots();
    }
  };

  const handleBatchCreate = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/availability/slots/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: weekStart,
          modality,
          service_id: serviceId || null,
          capacity,
          schedule: batchSchedule,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setMsg({ type: "ok", text: `Creados ${json.count || 0} slots` });
        loadSlots();
      } else {
        setMsg({ type: "error", text: json.error || "Error" });
      }
    } catch {
      setMsg({ type: "error", text: "Error de conexión" });
    } finally {
      setSaving(false);
    }
  };

  const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayLabels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  const addBatchSlot = (day: string) => {
    setBatchSchedule((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { start: "09:00", end: "10:00" }],
    }));
  };

  const updateBatchSlot = (day: string, idx: number, field: "start" | "end", value: string) => {
    setBatchSchedule((prev) => {
      const slots = [...(prev[day] || [])];
      slots[idx] = { ...slots[idx], [field]: value };
      return { ...prev, [day]: slots };
    });
  };

  const removeBatchSlot = (day: string, idx: number) => {
    setBatchSchedule((prev) => {
      const slots = (prev[day] || []).filter((_, i) => i !== idx);
      const next = { ...prev };
      if (slots.length === 0) delete next[day];
      else next[day] = slots;
      return next;
    });
  };

  if (loading) {
    return <p className="text-[var(--color-text-light)]">Cargando slots...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold font-display">Disponibilidad por Slots</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("add")}
            className="px-4 py-2 bg-[var(--color-terracotta)] text-white rounded-xl text-sm font-semibold hover:opacity-90"
          >
            + Agregar Slot
          </button>
          <button
            onClick={() => setMode("batch")}
            className="px-4 py-2 border-2 border-gray-200 text-[var(--color-text-main)] rounded-xl text-sm font-semibold hover:border-[var(--color-primary)]"
          >
            + Generar Semana
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl text-sm ${
            msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
          <button onClick={() => setMsg(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {mode === "list" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {slots.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-text-light)]">
              No hay slots creados. Creá el primero.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {slots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-4 text-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-[var(--color-text-main)] min-w-[90px]">
                      {slot.slot_date}
                    </span>
                    <span className="text-[var(--color-text-main)]">
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        slot.modality === "online"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {slot.modality === "online" ? "💻 Online" : "🏠 Presencial"}
                    </span>
                    {slot.services?.name && (
                      <span className="text-[var(--color-text-light)] text-xs">{slot.services.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${
                        slot.is_available ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {slot.is_available
                        ? `${slot.capacity - slot.booked_count}/${slot.capacity}`
                        : "Bloqueado"}
                    </span>
                    <button
                      onClick={() => toggleSlot(slot)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        slot.is_available
                          ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {slot.is_available ? "Bloquear" : "Activar"}
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="px-2 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "add" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 p-6 max-w-lg"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm text-[var(--color-text-light)] block mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--color-text-light)] block mb-1">Desde</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--color-text-light)] block mb-1">Hasta</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--color-text-light)] block mb-1">Modalidad</label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as "online" | "presencial")}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="online">Online</option>
                <option value="presencial">Presencial</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-[var(--color-text-light)] block mb-1">Cupo</label>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-[var(--color-text-light)] block mb-1">Servicio (opcional)</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="">Cualquier servicio</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm text-[var(--color-text-light)] block mb-1">Notas</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddSlot}
              disabled={saving}
              className="px-6 py-2.5 bg-[var(--color-terracotta)] text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar Slot"}
            </button>
            <button
              onClick={() => setMode("list")}
              className="px-6 py-2.5 border-2 border-gray-200 text-[var(--color-text-main)] rounded-xl text-sm hover:border-gray-300"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {mode === "batch" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-lg">
            <div>
              <label className="text-sm text-[var(--color-text-light)] block mb-1">Semana del</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--color-text-light)] block mb-1">Modalidad</label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as "online" | "presencial")}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="online">Online</option>
                <option value="presencial">Presencial</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {dayNames.map((day, i) => (
              <div key={day} className="flex items-start gap-4">
                <div className="w-24 pt-2.5 text-sm font-medium text-[var(--color-text-main)]">
                  {dayLabels[i]}
                </div>
                <div className="flex-1 space-y-2">
                  {(batchSchedule[day] || []).map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateBatchSlot(day, idx, "start", e.target.value)}
                        className="p-2 rounded-lg border border-gray-200 text-sm w-28"
                      />
                      <span className="text-[var(--color-text-light)]">a</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateBatchSlot(day, idx, "end", e.target.value)}
                        className="p-2 rounded-lg border border-gray-200 text-sm w-28"
                      />
                      <button
                        onClick={() => removeBatchSlot(day, idx)}
                        className="px-2 py-1 rounded-lg text-xs bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addBatchSlot(day)}
                    className="text-xs text-[var(--color-terracotta)] font-medium hover:underline"
                  >
                    + Agregar horario
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleBatchCreate}
              disabled={saving}
              className="px-6 py-2.5 bg-[var(--color-terracotta)] text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Creando..." : "Crear Semana Completa"}
            </button>
            <button
              onClick={() => setMode("list")}
              className="px-6 py-2.5 border-2 border-gray-200 text-[var(--color-text-main)] rounded-xl text-sm hover:border-gray-300"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
