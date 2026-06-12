"use client";

import React, { useEffect, useState, useMemo } from "react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents_online: number;
  price_cents_presencial: number;
  allowed_modalities: string[];
  is_active: boolean;
};

type Promotion = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  service_ids: string[];
  modality: string | null;
  discount_factor: number;
  deposit_type: string;
  deposit_value: number;
  max_purchases: number | null;
  allowed_tiers: string[] | null;
  expires_at: string | null;
  created_at: string;
};

type PromoForm = {
  name: string;
  description: string;
  service_ids: string[];
  modality: string;
  discount_factor: string;
  deposit_type: string;
  deposit_value: string;
  allowed_tiers: string[];
  max_purchases: string;
  is_active: boolean;
  expires_at: string;
};

const emptyForm: PromoForm = {
  name: "",
  description: "",
  service_ids: [],
  modality: "online",
  discount_factor: "1",
  deposit_type: "none",
  deposit_value: "",
  allowed_tiers: [],
  max_purchases: "",
  is_active: true,
  expires_at: "",
};

const ALL_TIERS = ["prana", "shakti", "ananda"];

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100);

export default function PromosPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const selectedServices = allServices.filter((s) => form.service_ids.includes(s.id));

  const subtotal = useMemo(() => {
    const priceField = form.modality === "online" ? "price_cents_online" : "price_cents_presencial";
    return selectedServices.reduce((sum, s) => sum + (s[priceField] || 0), 0);
  }, [selectedServices, form.modality]);

  const discount = parseFloat(form.discount_factor) || 1;
  const discountedTotal = Math.round(subtotal * discount);
  let depositCents = 0;
  const depositVal = parseFloat(form.deposit_value) || 0;
  if (form.deposit_type === "percent" && depositVal > 0) {
    depositCents = Math.round(discountedTotal * (depositVal / 100));
  } else if (form.deposit_type === "fixed" && depositVal > 0) {
    depositCents = Math.round(depositVal);
  }

  const fetchPromos = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/promos");
    const json = await res.json();
    if (json.data) setPromos(json.data);
    setLoading(false);
  };

  useEffect(() => { fetchPromos(); fetchServices(); }, []);

  const fetchServices = async () => {
    const res = await fetch("/api/admin/services");
    const json = await res.json();
    if (json.data) setAllServices(json.data);
  };

  const toggleTier = (tier: string) => {
    setForm((f) => ({
      ...f,
      allowed_tiers: f.allowed_tiers.includes(tier)
        ? f.allowed_tiers.filter((t) => t !== tier)
        : [...f.allowed_tiers, tier],
    }));
  };

  const toggleService = (id: string) => {
    setForm((f) => ({
      ...f,
      service_ids: f.service_ids.includes(id)
        ? f.service_ids.filter((s) => s !== id)
        : [...f.service_ids, id],
    }));
  };

  const openEdit = (p: Promotion) => {
    setForm({
      name: p.name,
      description: p.description || "",
      service_ids: p.service_ids || [],
      modality: p.modality || "online",
      discount_factor: String(p.discount_factor ?? 1),
      deposit_type: p.deposit_type || "none",
      deposit_value: p.deposit_value ? String(p.deposit_value) : "",
      allowed_tiers: p.allowed_tiers || [],
      max_purchases: p.max_purchases ? String(p.max_purchases) : "",
      is_active: p.is_active,
      expires_at: p.expires_at ? p.expires_at.slice(0, 10) : "",
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Calcular duracion total del paquete (suma de servicios)
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);

    const body: Record<string, unknown> = {
      name: form.name,
      description: form.description || null,
      service_ids: form.service_ids.length > 0 ? form.service_ids : null,
      modality: form.modality,
      discount_factor: discount,
      deposit_type: form.deposit_type,
      deposit_value: depositVal,
      duration_minutes: totalDuration,
      allowed_tiers: form.allowed_tiers.length > 0 ? form.allowed_tiers : null,
      max_purchases: form.max_purchases ? parseInt(form.max_purchases) : null,
      is_active: form.is_active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };

    const method = editingId ? "PATCH" : "POST";
    if (editingId) body.id = editingId;

    const res = await fetch("/api/admin/promos", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      resetForm();
      fetchPromos();
    } else {
      const err = await res.json();
      alert("Error: " + (err.error || "desconocido"));
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch("/api/admin/promos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !current }),
    });
    fetchPromos();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Promociones</h1>
          <p className="text-gray-500 text-sm">Creá y gestioná promociones para tus consultantes.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors"
        >
          {showForm ? "Cancelar" : "Nueva Promoción"}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Servicios incluidos</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50/50">
              {allServices.length === 0 ? (
                <span className="text-xs text-gray-400 p-2 col-span-2">Cargando servicios...</span>
              ) : allServices.filter((s) => s.is_active).map((svc) => {
                const selected = form.service_ids.includes(svc.id);
                return (
                  <button key={svc.id} type="button" onClick={() => toggleService(svc.id)}
                    className={`text-left p-3 rounded-xl border text-sm transition-all ${
                      selected
                        ? "border-pink-300 bg-pink-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-pink-200"
                    }`}>
                    <div className="font-medium text-gray-900">{svc.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {svc.duration_minutes} min · Online: {formatPrice(svc.price_cents_online)} · Presencial: {formatPrice(svc.price_cents_presencial)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Modalidad</label>
            <div className="flex gap-3">
              {["online", "presencial"].map((m) => (
                <label key={m} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  form.modality === m ? "border-pink-300 bg-pink-50 text-pink-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}>
                  <input type="radio" name="modality" value={m} checked={form.modality === m}
                    onChange={() => setForm({ ...form, modality: m })} className="text-pink-600" />
                  <span className="capitalize font-medium text-sm">{m === "online" ? "💻 Online" : "🏠 Presencial"}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 space-y-2">
            <h4 className="font-semibold text-sm text-amber-800">Resumen de precios</h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
              <span className="text-gray-600">Subtotal ({form.modality}):</span>
              <span className="font-semibold text-gray-900 text-right">{formatPrice(subtotal)}</span>
              <span className="text-gray-600">Factor de descuento:</span>
              <div className="text-right">
                <input type="number" step="0.01" min="0" max="1" value={form.discount_factor}
                  onChange={(e) => setForm({ ...form, discount_factor: e.target.value })}
                  className="w-20 border border-gray-300 rounded px-1.5 py-0.5 text-sm text-right" />
              </div>
              <span className="text-gray-600">Duración total:</span>
              <span className="font-semibold text-gray-900 text-right">{selectedServices.reduce((s, svc) => s + svc.duration_minutes, 0)} min</span>
              <span className="text-gray-600">Total con descuento:</span>
              <span className={`font-bold text-right ${discount < 1 ? "text-green-700" : "text-gray-900"}`}>
                {formatPrice(discountedTotal)}
                {discount < 1 && (
                  <span className="ml-1.5 text-xs text-green-500 bg-green-100 px-1.5 py-0.5 rounded-full">
                    {Math.round((1 - discount) * 100)}% OFF
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-2">
            <h4 className="font-semibold text-sm text-blue-800">Seña / Depósito</h4>
            <div className="flex items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                <select value={form.deposit_type} onChange={(e) => setForm({ ...form, deposit_type: e.target.value })}
                  className="border-gray-200 rounded-lg text-sm">
                  <option value="none">Sin seña</option>
                  <option value="percent">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo</option>
                </select>
              </div>
              {form.deposit_type !== "none" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {form.deposit_type === "percent" ? "Porcentaje" : "Monto en centavos"}
                  </label>
                  <input type="number" step={form.deposit_type === "percent" ? "1" : "100"} min="0"
                    value={form.deposit_value}
                    onChange={(e) => setForm({ ...form, deposit_value: e.target.value })}
                    className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                </div>
              )}
              {depositCents > 0 && (
                <div className="text-sm font-semibold text-blue-700 py-1">
                  Seña: {formatPrice(depositCents)}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compras máximas</label>
              <input type="number" value={form.max_purchases} onChange={(e) => setForm({ ...form, max_purchases: e.target.value })}
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500" placeholder="Ilimitado" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vence</label>
              <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-pink-600" />
                <span className="text-sm text-gray-700">Activa</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {ALL_TIERS.map((tier) => (
              <button key={tier} type="button" onClick={() => toggleTier(tier)}
                className={`px-3 py-1.5 rounded-lg text-sm border capitalize transition-colors ${
                  form.allowed_tiers.includes(tier)
                    ? "bg-pink-100 border-pink-300 text-pink-700"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                }`}>
                {tier}
              </button>
            ))}
            <span className="text-xs text-gray-400 ml-1">Tiers (opcional)</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving || !form.name || form.service_ids.length === 0}
              className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-lg transition-colors">
              {saving ? "Guardando..." : editingId ? "Actualizar Promoción" : "Crear Promoción"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm}
                className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="px-4 py-4 font-semibold">Nombre</th>
              <th className="px-4 py-4 font-semibold">Modalidad</th>
              <th className="px-4 py-4 font-semibold">Subtotal</th>
              <th className="px-4 py-4 font-semibold">Dto.</th>
              <th className="px-4 py-4 font-semibold">Total</th>
              <th className="px-4 py-4 font-semibold">Seña</th>
              <th className="px-4 py-4 font-semibold">Servicios</th>
              <th className="px-4 py-4 font-semibold">Estado</th>
              <th className="px-4 py-4 font-semibold text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-28" /></td>
                  <td className="px-4 py-4" colSpan={8}><div className="h-4 bg-gray-100 rounded w-full" /></td>
                </tr>
              ))
            ) : promos.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">local_offer</span>
                  <p>No hay promociones todavía.</p>
                </td>
              </tr>
            ) : promos.map((p) => {
              const svcs = (p.service_ids || []).map((sid) => allServices.find((s) => s.id === sid)).filter(Boolean) as Service[];
              const priceField = p.modality === "online" ? "price_cents_online" : "price_cents_presencial";
              const sub = svcs.reduce((sum, s) => sum + (s[priceField] || 0), 0);
              const df = p.discount_factor ?? 1;
              const total = Math.round(sub * df);
              let depCents = 0;
              if (p.deposit_type === "percent" && p.deposit_value > 0) depCents = Math.round(total * (p.deposit_value / 100));
              else if (p.deposit_type === "fixed" && p.deposit_value > 0) depCents = Math.round(p.deposit_value);
              return (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-4">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                    p.modality === "online" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                  }`}>
                    {p.modality === "online" ? "💻 Online" : "🏠 Presencial"}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-gray-700">{formatPrice(sub)}</td>
                <td className="px-4 py-4 text-sm">
                  {df < 1 ? (
                    <span className="text-green-600 font-semibold">{Math.round((1 - df) * 100)}%</span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-4 text-sm font-bold text-gray-900">{formatPrice(total)}</td>
                <td className="px-4 py-4 text-sm text-blue-600">
                  {depCents > 0 ? formatPrice(depCents) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 max-w-32">
                  {svcs.length > 0 ? svcs.map((s) => (
                    <span key={s.id} className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs mr-1 mb-1">{s.name}</span>
                  )) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    p.is_active ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-400 border-gray-200"
                  }`}>
                    {p.is_active ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(p)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
                      Editar
                    </button>
                    <button onClick={() => toggleActive(p.id, p.is_active)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        p.is_active ? "border-gray-200 text-gray-500 hover:bg-gray-50" : "border-pink-200 text-pink-600 hover:bg-pink-50"
                      }`}>
                      {p.is_active ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
