"use client";

import React, { useEffect, useState } from "react";

type PromoPurchase = {
  id: string;
  sessions_remaining: number;
  paid_at: string;
  promotion: {
    id: string;
    name: string;
    description: string | null;
    bundle_price_cents: number | null;
    max_sessions: number;
  };
};

export default function MisPromosCard() {
  const [promos, setPromos] = useState<PromoPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/promos/my")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setPromos(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <div className="h-5 bg-gray-100 rounded w-40 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-64 animate-pulse" />
      </div>
    );
  }

  if (promos.length === 0) return null;

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <h3 className="font-bold text-gray-900 font-display text-lg flex items-center gap-2">
        <span className="material-symbols-outlined text-green-500">inventory_2</span>
        Mis Promociones Activas
      </h3>
      <div className="space-y-3">
        {promos.map((pp) => (
          <div key={pp.id} className="flex items-center justify-between p-4 bg-green-50/50 rounded-xl border border-green-100">
            <div>
              <p className="font-semibold text-gray-900">{pp.promotion.name}</p>
              {pp.promotion.description && (
                <p className="text-xs text-gray-500">{pp.promotion.description}</p>
              )}
              {pp.promotion.bundle_price_cents && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Pagaste {formatPrice(pp.promotion.bundle_price_cents)} · {pp.promotion.max_sessions} sesiones
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-green-600">{pp.sessions_remaining}</span>
              <span className="text-xs text-gray-500 block">sesiones restantes</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">Al reservar un turno, se descuenta una sesión de tu promo automáticamente.</p>
    </div>
  );
}
