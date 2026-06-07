"use client";

import React, { useEffect, useState } from "react";

type Promotion = {
  id: string;
  name: string;
  description: string | null;
  discount_percent: number | null;
  discount_fixed: number | null;
  price_override: number | null;
  allowed_tiers: string[] | null;
  max_purchases: number | null;
  current_purchases: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  service_ids: string[];
};

type Service = {
  id: string;
  name: string;
  slug: string;
};

type PromoForm = {
  name: string;
  description: string;
  discount_type: "percent" | "fixed" | "override";
  discount_value: string;
  allowed_tiers: string[];
  max_purchases: string;
  is_active: boolean;
  expires_at: string;
  service_ids: string[];
};

const emptyForm: PromoForm = {
  name: "",
  description: "",
  discount_type: "percent",
  discount_value: "",
  allowed_tiers: [],
  max_purchases: "",
  is_active: true,
  expires_at: "",
  service_ids: [],
};

const ALL_TIERS = ["prana", "shakti", "ananda"];

export default function PromosPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPromos = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/promos");
    const json = await res.json();
    if (json.data) setPromos(json.data);
    setLoading(false);
  };

  const fetchServices = async () => {
    const res = await fetch("/api/admin/services");
    const json = await res.json();
    if (json.data) setServices(json.data);
  };

  useEffect(() => { fetchPromos(); fetchServices(); }, []);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const discountValue = parseFloat(form.discount_value);
    const discountPercent = form.discount_type === "percent" ? discountValue : null;
    const discountFixed = form.discount_type === "fixed" ? discountValue : null;
    const priceOverride = form.discount_type === "override" ? discountValue : null;

    const res = await fetch("/api/admin/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        discount_percent: discountPercent,
        discount_fixed: discountFixed,
        price_override: priceOverride,
        allowed_tiers: form.allowed_tiers.length > 0 ? form.allowed_tiers : null,
        max_purchases: form.max_purchases ? parseInt(form.max_purchases) : null,
        is_active: form.is_active,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        service_ids: form.service_ids,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setForm(emptyForm);
      setShowForm(false);
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

  const discountLabel = (p: Promotion) => {
    if (p.discount_percent) return `${p.discount_percent}% OFF`;
    if (p.discount_fixed) return `$${p.discount_fixed} OFF`;
    if (p.price_override) return `$${p.price_override}`;
    return "—";
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Promociones</h1>
          <p className="text-gray-500 text-sm">Creá y gestioná promociones para tus consultantes.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors"
        >
          {showForm ? "Cancelar" : "Nueva Promoción"}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de descuento</label>
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500">
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
                <option value="override">Precio personalizado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
              <input type="number" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compras máximas (opcional)</label>
              <input type="number" value={form.max_purchases} onChange={(e) => setForm({ ...form, max_purchases: e.target.value })}
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500" placeholder="Ilimitado" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border-gray-200 rounded-lg focus:ring-pink-500" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiers permitidos (opcional)</label>
            <div className="flex gap-2">
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
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Servicios incluidos</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-pink-700">
                  <input type="checkbox" checked={form.service_ids.includes(s.id)}
                    onChange={() => toggleService(s.id)}
                    className="rounded border-gray-300 text-pink-600" />
                  {s.name}
                </label>
              ))}
              {services.length === 0 && <p className="text-gray-400 text-sm col-span-full">Cargando servicios...</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vence (opcional)</label>
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
          <button type="submit" disabled={saving || !form.name}
            className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-lg transition-colors">
            {saving ? "Guardando..." : "Crear Promoción"}
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="px-6 py-4 font-semibold">Nombre</th>
              <th className="px-6 py-4 font-semibold">Descuento</th>
              <th className="px-6 py-4 font-semibold">Tiers</th>
              <th className="px-6 py-4 font-semibold">Compras</th>
              <th className="px-6 py-4 font-semibold">Vence</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-12" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                  <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-100 rounded w-8 inline-block" /></td>
                </tr>
              ))
            ) : promos.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">local_offer</span>
                  <p>No hay promociones todavía.</p>
                </td>
              </tr>
            ) : promos.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-pink-600">{discountLabel(p)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {(p.allowed_tiers || []).length > 0
                    ? (p.allowed_tiers as string[]).map((t) => (
                        <span key={t} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs mr-1 capitalize">{t}</span>
                      ))
                    : <span className="text-gray-300">Todos</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {p.current_purchases}{p.max_purchases ? ` / ${p.max_purchases}` : ""}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    p.is_active ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-400 border-gray-200"
                  }`}>
                    {p.is_active ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => toggleActive(p.id, p.is_active)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      p.is_active ? "border-gray-200 text-gray-500 hover:bg-gray-50" : "border-pink-200 text-pink-600 hover:bg-pink-50"
                    }`}
                  >
                    {p.is_active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
