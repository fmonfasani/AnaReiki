"use client";

import React, { useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price_cents_online: number;
  price_cents_presencial: number;
  deposit_percentage: number;
  allowed_modalities: string[];
  is_active: boolean;
  created_at: string;
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100);
}

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingDuration, setEditingDuration] = useState<string | null>(null);
  const [editingDeposit, setEditingDeposit] = useState<string | null>(null);
  const [editOnline, setEditOnline] = useState("");
  const [editPresencial, setEditPresencial] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editDeposit, setEditDeposit] = useState("");
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  const fetchServices = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/services");
    const json = await res.json();
    if (json.data) setServices(json.data);
    setLoading(false);
  };

  const fetchRole = async () => {
    const res = await fetch("/api/auth/check-role");
    const json = await res.json();
    setUserRole(json.role || "");
  };

  useEffect(() => { fetchServices(); fetchRole(); }, []);

  const handleSavePrices = async (id: string) => {
    setSaving(true);
    const body: Record<string, number> = {};
    if (editOnline !== "") body.price_cents_online = Math.round(parseFloat(editOnline) * 100);
    if (editPresencial !== "") body.price_cents_presencial = Math.round(parseFloat(editPresencial) * 100);
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setEditingPrice(null);
      fetchServices();
    } else {
      const err = await res.json();
      alert("Error: " + (err.error || "desconocido"));
    }
  };

  const handleSaveDuration = async (id: string) => {
    setSaving(true);
    const durationMinutes = parseInt(editDuration);
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration_minutes: durationMinutes }),
    });
    setSaving(false);
    if (res.ok) {
      setEditingDuration(null);
      fetchServices();
    } else {
      const err = await res.json();
      alert("Error: " + (err.error || "desconocido"));
    }
  };

  const handleSaveDeposit = async (id: string) => {
    setSaving(true);
    const pct = Math.min(100, Math.max(0, parseInt(editDeposit) || 0));
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deposit_percentage: pct }),
    });
    setSaving(false);
    if (res.ok) {
      setEditingDeposit(null);
      fetchServices();
    } else {
      const err = await res.json();
      alert("Error: " + (err.error || "desconocido"));
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    });
    if (res.ok) fetchServices();
  };

  const isOwner = userRole === "owner";
  const isAdmin = isOwner || userRole === "admin";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 font-display">Servicios</h1>
        <p className="text-gray-500 text-sm">Gestioná los servicios, duración y precios por modalidad. Solo el Owner puede modificar precios.</p>
      </header>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="px-6 py-4 font-semibold">Servicio</th>
              <th className="px-6 py-4 font-semibold">Duración</th>
              <th className="px-6 py-4 font-semibold">Online</th>
              <th className="px-6 py-4 font-semibold">Presencial</th>
              <th className="px-6 py-4 font-semibold">Seña</th>
              <th className="px-6 py-4 font-semibold">Modalidad</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-40" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-12" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                  <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-100 rounded w-8 inline-block" /></td>
                </tr>
              ))
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">spa</span>
                  <p>No hay servicios todavía.</p>
                </td>
              </tr>
            ) : services.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{s.name}</p>
                  {s.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.description}</p>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {editingDuration === s.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" min={15} step={15} value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        className="w-16 border border-gray-300 rounded px-1 py-0.5 text-sm text-center" autoFocus />
                      <button onClick={() => handleSaveDuration(s.id)} disabled={saving}
                        className="text-xs font-semibold px-1.5 py-0.5 bg-pink-600 text-white rounded hover:bg-pink-700">OK</button>
                      <button onClick={() => setEditingDuration(null)} className="text-xs text-gray-400">×</button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1">
                      {s.duration_minutes} min
                      {isAdmin && (
                        <button onClick={() => { setEditingDuration(s.id); setEditDuration(String(s.duration_minutes)); }}
                          className="text-gray-300 hover:text-pink-600 transition-colors">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingPrice === s.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">$</span>
                      <input type="number" step="0.01" value={editOnline}
                        onChange={(e) => setEditOnline(e.target.value)}
                        className="w-20 border border-gray-300 rounded px-1 py-0.5 text-sm" />
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-gray-900">
                      {s.price_cents_online > 0 ? formatPrice(s.price_cents_online) : <span className="text-gray-300 font-normal">—</span>}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingPrice === s.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">$</span>
                      <input type="number" step="0.01" value={editPresencial}
                        onChange={(e) => setEditPresencial(e.target.value)}
                        className="w-20 border border-gray-300 rounded px-1 py-0.5 text-sm" />
                      <button onClick={() => handleSavePrices(s.id)} disabled={saving}
                        className="text-xs font-semibold px-2 py-1 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:bg-gray-300">
                        {saving ? "..." : "OK"}
                      </button>
                      <button onClick={() => setEditingPrice(null)}
                        className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-gray-900">
                      {s.price_cents_presencial > 0 ? formatPrice(s.price_cents_presencial) : <span className="text-gray-300 font-normal">—</span>}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingDeposit === s.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} max={100} value={editDeposit}
                        onChange={(e) => setEditDeposit(e.target.value)}
                        className="w-14 border border-gray-300 rounded px-1 py-0.5 text-sm text-center" autoFocus />
                      <span className="text-xs text-gray-400">%</span>
                      <button onClick={() => handleSaveDeposit(s.id)} disabled={saving}
                        className="text-xs font-semibold px-1.5 py-0.5 bg-pink-600 text-white rounded hover:bg-pink-700">OK</button>
                      <button onClick={() => setEditingDeposit(null)} className="text-xs text-gray-400">×</button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-gray-700">
                      {s.deposit_percentage > 0 ? `${s.deposit_percentage}%` : <span className="text-gray-300 font-normal">—</span>}
                      {isOwner && (
                        <button onClick={() => { setEditingDeposit(s.id); setEditDeposit(String(s.deposit_percentage)); }}
                          className="text-gray-300 hover:text-pink-600 transition-colors">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {s.allowed_modalities.map((m) => (
                      <span key={m} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">{m}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    s.is_active ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-400 border-gray-200"
                  }`}>
                    {s.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isOwner && (
                      <button
                        onClick={() => {
                          setEditingPrice(s.id);
                          setEditOnline((s.price_cents_online / 100).toString());
                          setEditPresencial((s.price_cents_presencial / 100).toString());
                        }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                      >
                        Editar precios
                      </button>
                    )}
                    <button
                      onClick={() => toggleActive(s.id, s.is_active)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        s.is_active ? "border-gray-200 text-gray-500 hover:bg-gray-50" : "border-pink-200 text-pink-600 hover:bg-pink-50"
                      }`}
                    >
                      {s.is_active ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        <p className="font-semibold mb-1">Importante</p>
        <p>Los precios se muestran al consultante según la modalidad elegida. El pago se procesa a través de Mercado Pago al confirmar la reserva. Solo el Owner puede modificar precios.</p>
      </div>
    </div>
  );
}
