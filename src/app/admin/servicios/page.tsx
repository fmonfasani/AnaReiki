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
  is_visible: boolean;
  created_at: string;
};

type Promo = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_visible: boolean;
  service_ids: string[];
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100);
}

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [svcRes, promosRes] = await Promise.all([
      fetch("/api/admin/services"),
      fetch("/api/admin/promos"),
    ]);
    const svcJson = await svcRes.json();
    if (svcJson.data) setServices(svcJson.data);
    const promosJson = await promosRes.json();
    if (promosJson.data) setPromos(promosJson.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleVisibility = async (type: "service" | "promo", id: string, current: boolean) => {
    setSavingId(id);
    if (type === "service") {
      await fetch(`/api/admin/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: !current }),
      });
    } else {
      await fetch("/api/admin/promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_visible: !current }),
      });
    }
    setSavingId(null);
    fetchData();
  };

  const toggleActive = async (type: "service" | "promo", id: string, current: boolean) => {
    setSavingId(id);
    if (type === "service") {
      await fetch(`/api/admin/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !current }),
      });
    } else {
      await fetch("/api/admin/promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !current }),
      });
    }
    setSavingId(null);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 font-display">Servicios</h1>
        <p className="text-gray-500 text-sm">Gestioná servicios y promos. Usá "Publicar" para que aparezcan en la reserva del consultante.</p>
      </header>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* LEFT: Services (3/5) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">spa</span>
              Servicios Individuales
              <span className="text-xs font-normal text-gray-300 ml-1">({services.length})</span>
            </h3>

            {services.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">No hay servicios</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {services.map((s) => (
                  <div key={s.id} className={`rounded-xl border-2 p-3 transition-all ${s.is_active ? "border-gray-100 bg-white" : "border-gray-100 bg-gray-50/50 opacity-60"}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight">{s.name}</h4>
                      <button
                        onClick={() => toggleVisibility("service", s.id, s.is_visible)}
                        disabled={savingId === s.id}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors shrink-0 ${
                          s.is_visible
                            ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        {s.is_visible ? "Publicado" : "Publicar"}
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      <span>{s.duration_minutes} min</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {s.allowed_modalities.map((m) => (
                        <span key={m} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          m === "online" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                        }`}>{m}</span>
                      ))}
                    </div>

                    <div className="space-y-0.5 text-xs mb-2.5">
                      {s.price_cents_online > 0 && <span className="text-[var(--color-terracotta)] font-medium block">Online: {formatPrice(s.price_cents_online)}</span>}
                      {s.price_cents_presencial > 0 && <span className="text-[var(--color-terracotta)] font-medium block">Presencial: {formatPrice(s.price_cents_presencial)}</span>}
                      {s.price_cents_online === 0 && s.price_cents_presencial === 0 && <span className="text-green-600 font-medium">Gratuito</span>}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        s.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
                      }`}>{s.is_active ? "Activo" : "Inactivo"}</span>
                      <button
                        onClick={() => toggleActive("service", s.id, s.is_active)}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                          s.is_active ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}>{s.is_active ? "Desactivar" : "Activar"}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Promos (2/5) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">local_offer</span>
              Promociones
              <span className="text-xs font-normal text-gray-300 ml-1">({promos.length})</span>
            </h3>

            {promos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">No hay promos</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {promos.map((p) => (
                  <div key={p.id} className={`rounded-xl border-2 p-3 transition-all ${p.is_active ? "border-amber-200 bg-amber-50/20" : "border-gray-100 bg-gray-50/50 opacity-60"}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="material-symbols-outlined text-amber-500 text-sm shrink-0">local_offer</span>
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate">{p.name}</h4>
                      </div>
                      <button
                        onClick={() => toggleVisibility("promo", p.id, p.is_visible)}
                        disabled={savingId === p.id}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors shrink-0 ${
                          p.is_visible
                            ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        {p.is_visible ? "Publicado" : "Publicar"}
                      </button>
                    </div>

                    {p.description && <p className="text-xs text-gray-400 mb-2 line-clamp-1">{p.description}</p>}

                    <div className="text-xs text-gray-500 mb-2.5">
                      {p.service_ids.length > 0
                        ? `${p.service_ids.length} servicio${p.service_ids.length > 1 ? "s" : ""} incluido${p.service_ids.length > 1 ? "s" : ""}`
                        : <span className="text-gray-300">Sin servicios vinculados</span>}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-amber-100/50">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        p.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
                      }`}>{p.is_active ? "Activa" : "Inactiva"}</span>
                      <button
                        onClick={() => toggleActive("promo", p.id, p.is_active)}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                          p.is_active ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}>{p.is_active ? "Desactivar" : "Activar"}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        <p className="font-semibold mb-1">¿Cómo funciona?</p>
        <p>El botón "Publicar" controla si el servicio/promo aparece en la pantalla de reserva del consultante, independientemente de "Activar/Desactivar" (estado operativo). Un servicio puede estar activo pero sin publicar, o inactivo pero publicado (no recomendado). Los turnos ya creados no se ven afectados.</p>
      </div>
    </div>
  );
}
