"use client";

import React, { useState, useEffect, useCallback } from "react";

type Rule = {
  id: string;
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  modality: string;
  session_type: string;
  max_participants: number;
  max_online: number | null;
  max_presencial: number | null;
  service_ids: string[];
  promotion_id: string | null;
  is_active: boolean;
  created_at: string;
};

type Service = {
  id: string;
  name: string;
};

type Promo = {
  id: string;
  name: string;
  modality: string | null;
  service_ids: string[];
};

const DAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MODALITIES = ["online", "presencial", "both", "mixta"];
const SESSION_TYPES = ["individual", "group", "both"];

const emptyForm = {
  day_of_week: "" as string | number,
  specific_date: "",
  start_time: "09:00",
  end_time: "17:00",
  duration_minutes: 60,
  modality: "both",
  session_type: "individual",
  max_participants: 1,
  service_ids: [] as string[],
  promotion_id: null as string | null,
  is_active: true,
};

export default function RuleManager() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [mode, setMode] = useState<"weekly" | "specific">("weekly");

  const fetchRules = useCallback(async () => {
    const res = await fetch(`/api/admin/availability/rules`);
    const json = await res.json();
    if (json.data) setRules(json.data);
  }, []);

  const fetchServices = useCallback(async () => {
    const res = await fetch("/api/services");
    const json = await res.json();
    if (json.data) setServices(json.data);
    if (json.promos) setPromos(json.promos);
  }, []);

  useEffect(() => {
    Promise.all([fetchRules(), fetchServices()]).finally(() => setLoading(false));
  }, [fetchRules, fetchServices]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setMode("weekly");
  };

  const handleEdit = (rule: Rule) => {
    setForm({
      day_of_week: rule.day_of_week ?? "",
      specific_date: rule.specific_date || "",
      start_time: rule.start_time.slice(0, 5),
      end_time: rule.end_time.slice(0, 5),
      duration_minutes: rule.duration_minutes,
      modality: rule.modality,
      session_type: rule.session_type,
      max_participants: rule.max_participants,
      service_ids: rule.service_ids || [],
      promotion_id: rule.promotion_id || null,
      is_active: rule.is_active,
    });
    setEditingId(rule.id);
    setMode(rule.day_of_week !== null ? "weekly" : "specific");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const body: Record<string, unknown> = {
      start_time: form.start_time,
      end_time: form.end_time,
      duration_minutes: form.duration_minutes,
      modality: form.modality,
      session_type: form.session_type,
      max_participants: form.max_participants || 1,
      service_ids: form.service_ids,
      promotion_id: form.promotion_id || null,
      is_active: form.is_active,
    };

    if (mode === "weekly") {
      body.day_of_week = form.day_of_week === "" ? null : Number(form.day_of_week);
      body.specific_date = null;
    } else {
      body.day_of_week = null;
      body.specific_date = form.specific_date || null;
    }

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/admin/availability/rules/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/admin/availability/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const json = await res.json();
      if (res.ok) {
        setMsg({ type: "ok", text: editingId ? "Regla actualizada" : "Regla creada" });
        resetForm();
        setShowForm(false);
        fetchRules();
      } else {
        setMsg({ type: "error", text: json.error || "Error" });
      }
    } catch {
      setMsg({ type: "error", text: "Error de conexión" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta regla?")) return;
    const res = await fetch(`/api/admin/availability/rules/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "ok", text: "Regla eliminada" });
      fetchRules();
    } else {
      const json = await res.json();
      setMsg({ type: "error", text: json.error || "Error al eliminar" });
    }
  };

  const toggleActive = async (rule: Rule) => {
    const res = await fetch(`/api/admin/availability/rules/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !rule.is_active }),
    });
    if (res.ok) {
      setMsg({ type: "ok", text: rule.is_active ? "Regla desactivada" : "Regla activada" });
      fetchRules();
    }
  };

  const weeklyRules = rules.filter((r) => r.day_of_week !== null);
  const specificRules = rules.filter((r) => r.specific_date !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold font-display text-gray-900">Reglas de Disponibilidad (v2)</h3>
          <p className="text-sm text-gray-500">Reglas semanales y por fecha específica. Los slots se generan dinámicamente.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2 bg-pink-600 text-white rounded-xl text-sm font-semibold hover:bg-pink-700 transition-colors"
        >
          {showForm ? "Cancelar" : "+ Nueva Regla"}
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm flex items-center justify-between ${
          msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-bold text-lg leading-none">×</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex gap-4">
            <button type="button" onClick={() => setMode("weekly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                mode === "weekly" ? "bg-pink-100 border-pink-300 text-pink-700" : "bg-gray-50 border-gray-200 text-gray-600"
              }`}>Semanal</button>
            <button type="button" onClick={() => setMode("specific")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                mode === "specific" ? "bg-pink-100 border-pink-300 text-pink-700" : "bg-gray-50 border-gray-200 text-gray-600"
              }`}>Fecha específica</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {mode === "weekly" ? (
              <div>
                <label className="block text-sm text-gray-500 mb-1">Día de la semana</label>
                <select value={String(form.day_of_week)} onChange={(e) => setForm({ ...form, day_of_week: e.target.value ? Number(e.target.value) : "" })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-sm">
                  <option value="">Seleccionar día</option>
                  {DAY_LABELS.map((label, i) => (
                    <option key={i} value={i}>{label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-500 mb-1">Fecha</label>
                <input type="date" value={form.specific_date} onChange={(e) => setForm({ ...form, specific_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-sm" />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-500 mb-1">Servicios (opcional)</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-xl">
                {services.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                    <input type="checkbox" checked={form.service_ids.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, service_ids: [...form.service_ids, s.id], promotion_id: null });
                        } else {
                          setForm({ ...form, service_ids: form.service_ids.filter((id) => id !== s.id) });
                        }
                      }}
                      className="rounded border-gray-300 text-pink-600" />
                    {s.name}
                  </label>
                ))}
                {services.length > 0 && (
                  <div className="flex gap-2 pt-1 border-t border-gray-100 mt-1">
                    <button type="button" onClick={() => setForm({ ...form, service_ids: services.map((s) => s.id), promotion_id: null })}
                      className="text-xs text-pink-600 hover:text-pink-700 font-medium">Seleccionar todos</button>
                    <button type="button" onClick={() => setForm({ ...form, service_ids: [] })}
                      className="text-xs text-gray-400 hover:text-gray-600 font-medium">Deseleccionar todos</button>
                  </div>
                )}
              </div>
              {form.service_ids.length === 0 && !form.promotion_id && <p className="text-xs text-gray-400 mt-1">Si no seleccionás ninguno, la regla aplica a todos los servicios.</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Promo (opcional)</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-xl">
                {promos.length === 0 && <p className="text-xs text-gray-400 py-2 text-center">No hay promos activas</p>}
                {promos.map((p) => (
                  <label key={p.id} className={`flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded ${form.promotion_id === p.id ? "bg-purple-50" : ""}`}>
                    <input type="radio" name="promotion_id" checked={form.promotion_id === p.id}
                      onChange={() => {
                        setForm({ ...form, promotion_id: p.id, service_ids: [] });
                      }}
                      className="text-purple-600" />
                    <span className="font-medium">{p.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${p.modality === "online" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
                      {p.modality === "online" ? "Online" : p.modality === "presencial" ? "Presencial" : "Ambos"}
                    </span>
                    <span className="text-xs text-gray-400">{p.service_ids.length} servicios</span>
                  </label>
                ))}
                {promos.length > 0 && (
                  <div className="flex gap-2 pt-1 border-t border-gray-100 mt-1">
                    <button type="button" onClick={() => setForm({ ...form, promotion_id: null })}
                      className="text-xs text-gray-400 hover:text-gray-600 font-medium">Quitar promo</button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Desde</label>
              <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm" required />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Hasta</label>
              <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm" required />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Duración (min)</label>
              <input type="number" min={15} step={15} value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm" required />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Modalidad</label>
              <select value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm">
                {MODALITIES.map((m) => (
                  <option key={m} value={m}>{m === "online" ? "Online" : m === "presencial" ? "Presencial" : m === "both" ? "Online y Presencial" : "Mixta"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Tipo de sesión</label>
              <select value={form.session_type} onChange={(e) => setForm({ ...form, session_type: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm">
                {SESSION_TYPES.map((t) => (
                  <option key={t} value={t}>{t === "individual" ? "Individual" : t === "group" ? "Grupal" : "Ambos"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Cupo máximo</label>
              <input type="number" min={1} value={form.max_participants}
                onChange={(e) => setForm({ ...form, max_participants: parseInt(e.target.value) || 1 })}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-2.5">
                <input type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-pink-600" />
                <span className="text-sm text-gray-700">Activa</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-pink-600 text-white font-semibold rounded-xl text-sm hover:bg-pink-700 disabled:opacity-50 transition-colors">
              {saving ? "Guardando..." : editingId ? "Actualizar Regla" : "Crear Regla"}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-6 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm hover:border-gray-300 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">Cargando reglas...</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <span className="material-symbols-outlined text-4xl mb-2">schedule</span>
          <p>No hay reglas de disponibilidad. Creá la primera.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {weeklyRules.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">date_range</span>
                Reglas semanales
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {DAY_LABELS.map((label, day) => {
                  const dayRules = weeklyRules.filter((r) => r.day_of_week === day);
                  if (dayRules.length === 0) return null;
                  return (
                    <div key={day} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                      <h5 className="font-bold text-gray-900 mb-2">{label}</h5>
                      <div className="space-y-2">
                        {dayRules.map((rule) => (
                          <div key={rule.id} className={`p-2 rounded-lg text-xs border ${rule.is_active ? "border-green-100 bg-green-50/30" : "border-gray-100 bg-gray-50 opacity-60"}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-800">
                                {rule.start_time.slice(0, 5)} - {rule.end_time.slice(0, 5)}
                              </span>
                              <div className="flex gap-1">
                                <button onClick={() => handleEdit(rule)} className="text-gray-400 hover:text-pink-600 transition-colors">
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button onClick={() => handleDelete(rule.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-1">
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{rule.duration_minutes}min</span>
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]">{rule.modality}</span>
                              {rule.promotion_id ? (
                                (() => {
                                  const promo = promos.find((p) => p.id === rule.promotion_id);
                                  return promo ? (
                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium">📦 {promo.name}</span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded text-[10px]">Promo {rule.promotion_id.slice(0, 8)}</span>
                                  );
                                })()
                              ) : rule.service_ids && rule.service_ids.length > 0 ? (
                                rule.service_ids.slice(0, 2).map((sid) => {
                                  const svc = services.find((s) => s.id === sid);
                                  return svc ? (
                                    <span key={sid} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px]">{svc.name}</span>
                                  ) : null;
                                })
                              ) : (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-[10px]">Todos</span>
                              )}
                              {rule.service_ids && rule.service_ids.length > 2 && (
                                <span className="text-[10px] text-gray-400">+{rule.service_ids.length - 2}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-[10px]">{rule.max_participants} participantes</span>
                              <button onClick={() => toggleActive(rule)}
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                                  rule.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                                }`}>
                                {rule.is_active ? "Activa" : "Inactiva"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {specificRules.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">event</span>
                Fechas específicas
              </h4>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-50">
                  {specificRules.map((rule) => (
                    <div key={rule.id} className={`flex items-center justify-between p-3 text-sm ${rule.is_active ? "" : "opacity-60"}`}>
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-900 min-w-[100px]">{rule.specific_date}</span>
                        <span className="text-gray-600">{rule.start_time.slice(0, 5)} - {rule.end_time.slice(0, 5)}</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{rule.duration_minutes}min</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{rule.modality}</span>
                        {rule.promotion_id ? (
                          (() => {
                            const promo = promos.find((p) => p.id === rule.promotion_id);
                            return promo ? (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">📦 {promo.name}</span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded text-xs">Promo</span>
                            );
                          })()
                        ) : rule.service_ids && rule.service_ids.length > 0 ? (
                          rule.service_ids.map((sid) => {
                            const svc = services.find((s) => s.id === sid);
                            return svc ? (
                              <span key={sid} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">{svc.name}</span>
                            ) : null;
                          })
                        ) : (
                          <span className="text-gray-400 text-xs">Todos los servicios</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(rule)}
                          className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                            rule.is_active ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}>
                          {rule.is_active ? "Desactivar" : "Activar"}
                        </button>
                        <button onClick={() => handleDelete(rule.id)}
                          className="px-2 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100">
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
