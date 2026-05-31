"use client";

import React, { useState } from "react";

type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  interval: string;
  trial_days: number;
};

type Subscription = {
  id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  pricing_plans?: { name: string; slug: string } | null;
};

interface PremiumUpgradeProps {
  isPremium: boolean;
  planTier: string;
  plans: Plan[];
  subscription: Subscription | null;
  userEmail: string;
}

const TIER_ORDER = ["prana", "shakti", "ananda"] as const;
type Tier = (typeof TIER_ORDER)[number];

const TIER_LABELS: Record<Tier, { name: string; emoji: string; desc: string }> = {
  prana: { name: "Prana", emoji: "🌿", desc: "Energía vital — lo esencial" },
  shakti: { name: "Shakti", emoji: "🔥", desc: "Poder divino — expandí tu práctica" },
  ananda: { name: "Ananda", emoji: "☀️", desc: "Dicha plena — sin límites" },
};

const FEATURES: Record<Tier, string[]> = {
  prana: [
    "Perfil personal",
    "Agendar citas con Ana",
    "Mi Agenda (ver/cancelar turnos)",
    "Comunidad (leer y participar)",
    "Notificaciones de recordatorio",
  ],
  shakti: [
    "Todo lo de Prana",
    "Biblioteca: podcasts, meditaciones, reiki y yoga",
    "Evolución: mood tracker básico",
  ],
  ananda: [
    "Todo lo de Shakti sin límites",
    "Biblioteca completa (videos, podcasts, meditaciones, reiki, yoga, reflexiones, ejercicios)",
    "Todas las clases grabadas + contenido premium",
    "Comunidad: escribir, foro, comentarios",
    "Mensajes directos con otros consultantes",
    "Chat IA ilimitado",
    "Evolución completa con insights IA",
    "Favoritos y seguimiento sincronizado",
  ],
};

const TIER_BORDERS: Record<Tier, string> = {
  prana: "border-gray-100",
  shakti: "border-pink-200",
  ananda: "border-amber-300",
};

export default function PremiumUpgrade({
  isPremium,
  planTier,
  plans,
  subscription,
  userEmail,
}: PremiumUpgradeProps) {
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentTier = (TIER_ORDER.includes(planTier as Tier) ? planTier : "prana") as Tier;
  const currentIdx = TIER_ORDER.indexOf(currentTier);

  const tierPlans = (tier: Tier) =>
    plans.filter((p) => {
      if (tier === "prana") return p.slug === "prana";
      return p.slug.startsWith(tier) && p.interval === billingInterval;
    });

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    return currency === "ARS"
      ? `$${amount.toLocaleString("es-AR")}`
      : `$${amount.toFixed(2)}`;
  };

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);
    setError(null);
    try {
      const endpoint = isPremium
        ? "/api/mercadopago/change-plan"
        : "/api/mercadopago/create-preference";
      const body = isPremium
        ? JSON.stringify({ planId, action: "upgrade" })
        : JSON.stringify({ planId });
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar pago");
      if (data.init_point) {
        window.location.href = data.init_point;
      } else if (data.success) {
        window.location.reload();
      } else {
        throw new Error("No se pudo generar el link de pago");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoading(null);
    }
  };

  const handleDowngrade = async (planId: string) => {
    if (!confirm("¿Estás seguro de que querés bajar de plan? Perderás acceso a las funciones del plan actual.")) return;
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/mercadopago/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, action: "downgrade" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar de plan");
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("¿Estás seguro? Perderás acceso a todo el contenido premium al final del período.")) return;
    setLoading("cancel");
    setError(null);
    try {
      const res = await fetch("/api/mercadopago/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cancelar");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Suscripciones
        </h1>
        <p className="text-lg text-gray-500 mt-2 max-w-xl mx-auto">
          {isPremium
            ? `Estás en el plan ${TIER_LABELS[currentTier].name}. Elegí el que mejor se adapte a vos.`
            : "Crece en tu práctica con el plan que mejor se adapte a vos."}
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm max-w-lg mx-auto">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-xl p-1 inline-flex items-center gap-1">
          <button
            onClick={() => setBillingInterval("month")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              billingInterval === "month"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingInterval("year")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              billingInterval === "year"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Anual
            <span className="ml-1.5 text-xs text-green-600 font-bold">Ahorrá 2 meses</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {TIER_ORDER.map((tier) => {
          const tierPlansList = tierPlans(tier);
          const isCurrent = tier === currentTier;
          const tierIdx = TIER_ORDER.indexOf(tier);

          return (
            <div
              key={tier}
              className={`bg-white rounded-3xl border-2 ${TIER_BORDERS[tier]} p-8 shadow-sm flex flex-col relative ${
                tier === currentTier
                  ? "ring-2 ring-pink-500 ring-offset-2"
                  : ""
              }`}
            >
              {tier === "shakti" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Popular
                </div>
              )}
              {tier === "ananda" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Todo incluido
                </div>
              )}

              <div className="mb-6">
                <span className="text-4xl block mb-3">{TIER_LABELS[tier].emoji}</span>
                <h3 className="text-xl font-bold text-gray-900">{TIER_LABELS[tier].name}</h3>
                <p className="text-sm text-gray-500 mt-1">{TIER_LABELS[tier].desc}</p>
              </div>

              <div className="mb-6 space-y-2">
                {tier === "prana" ? (
                  <span className="text-4xl font-black text-gray-900">Gratis</span>
                ) : tierPlansList.length === 0 ? (
                  <span className="text-gray-400 italic">No disponible</span>
                ) : (
                  tierPlansList.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between">
                      <span className="text-2xl font-black text-gray-900">
                        {formatPrice(plan.price_cents, plan.currency)}
                      </span>
                      <span className="text-gray-400 text-sm">
                        /{plan.interval === "month" ? "mes" : "año"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {FEATURES[tier].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">
                      check
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-3 rounded-xl font-bold text-sm text-center bg-pink-50 text-pink-700 border border-pink-200">
                  Plan actual
                </div>
              ) : tierIdx > currentIdx ? (
                <button
                  onClick={() => tierPlansList[0] && handleUpgrade(tierPlansList[0].id)}
                  disabled={loading !== null || tierPlansList.length === 0}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === tierPlansList[0]?.id
                    ? "Redirigiendo..."
                    : tier === "ananda"
                      ? "Actualizar a Ananda"
                      : "Actualizar a Shakti"}
                </button>
              ) : (
                <button
                  onClick={() => tierPlansList[0] && handleDowngrade(tierPlansList[0]?.id || "")}
                  disabled={loading !== null}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === (tierPlansList[0]?.id || "downgrade")
                    ? "Procesando..."
                    : `Bajar a ${TIER_LABELS[tier].name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isPremium && currentTier !== "prana" && (
        <div className="text-center">
          <button
            onClick={handleCancel}
            disabled={loading === "cancel"}
            className="text-sm text-gray-400 hover:text-red-600 underline underline-offset-2 disabled:opacity-50"
          >
            {loading === "cancel"
              ? "Cancelando..."
              : "Cancelar suscripción (al final del período vigente)"}
          </button>
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-gray-400 max-w-lg mx-auto">
          Al suscribirte aceptás los términos y condiciones. Podés cancelar en
          cualquier momento desde tu panel. Los pagos son procesados de forma
          segura por Mercado Pago.
        </p>
      </div>
    </div>
  );
}
