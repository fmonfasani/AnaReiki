"use client";

import React, { useState } from "react";
import Link from "next/link";

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

const PRANA_FEATURES = [
  "Perfil personal",
  "Agendar citas con Ana",
  "Mi Agenda (ver/cancelar turnos)",
  "Comunidad (leer y participar)",
  "Notificaciones de recordatorio",
];

const SHAKTI_FEATURES = [
  "Todo lo de Prana",
  "Biblioteca: podcasts, meditaciones, reiki y yoga",
  "Evolución: mood tracker básico",
];

const ANANDA_FEATURES = [
  "Todo lo de Shakti sin límites",
  "Biblioteca completa (videos, podcasts, meditaciones, reiki, yoga, reflexiones, ejercicios)",
  "Todas las clases grabadas + contenido premium",
  "Comunidad: escribir, foro, comentarios",
  "Mensajes directos con otros consultantes",
  "Chat IA ilimitado",
  "Evolución completa con insights IA",
  "Favoritos y seguimiento sincronizado",
];

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

  const currentSlug = subscription?.pricing_plans?.slug;

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    setError(null);

    try {
      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar pago");
      }

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error("No se pudo generar el link de pago");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    if (currency === "ARS") {
      return `$${amount.toLocaleString("es-AR")}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  if (isPremium) {
    const planName = subscription?.pricing_plans?.name || "Ananda";
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center">
          <span className="text-6xl block mb-4">🌟</span>
          <h1 className="text-4xl font-extrabold text-gray-900">
            Tu suscripción
          </h1>
          <p className="text-lg text-gray-500 mt-2">
            {currentSlug?.startsWith("ananda")
              ? "Disfrutás de acceso completo a todo."
              : "Disfrutás de acceso parcial. Actualizá para obtener más."}
          </p>
        </header>

        <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl text-center">
          <span className="material-symbols-outlined text-5xl mb-4">diamond</span>
          <h2 className="text-2xl font-bold mb-2">Plan {planName}</h2>
          {subscription?.current_period_end && (
            <p className="text-white/80">
              Tu plan vence el{" "}
              {new Date(subscription.current_period_end).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/consultantes/biblioteca"
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <span className="material-symbols-outlined">library_books</span>
            Explorar contenido
          </Link>
        </div>
      </div>
    );
  }

  const paidPlans = plans.filter((p) => p.price_cents > 0);
  const shaktiPlans = paidPlans.filter((p) => p.slug.startsWith("shakti") && p.interval === billingInterval);
  const anandaPlans = paidPlans.filter((p) => p.slug.startsWith("ananda") && p.interval === billingInterval);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Suscripciones
        </h1>
        <p className="text-lg text-gray-500 mt-2 max-w-xl mx-auto">
          Crece en tu práctica con el plan que mejor se adapte a vos.
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm max-w-lg mx-auto">
          {error}
        </div>
      )}

      {/* Billing toggle */}
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
        {/* PRANA - Free */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-sm flex flex-col">
          <div className="mb-6">
            <span className="text-4xl block mb-3">🌿</span>
            <h3 className="text-xl font-bold text-gray-900">Prana</h3>
            <p className="text-sm text-gray-500 mt-1">Energía vital — lo esencial</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-black text-gray-900">Gratis</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {PRANA_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check</span>
                {f}
              </li>
            ))}
          </ul>
          {planTier === "prana" ? (
            <div className="w-full py-3 rounded-xl font-bold text-sm text-center bg-gray-100 text-gray-400">
              Plan actual
            </div>
          ) : null}
        </div>

        {/* SHAKTI - Medium */}
        <div className="bg-white rounded-3xl border-2 border-pink-200 p-8 shadow-sm flex flex-col relative">
          {shaktiPlans.length > 0 && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
              Popular
            </div>
          )}
          <div className="mb-6">
            <span className="text-4xl block mb-3">🔥</span>
            <h3 className="text-xl font-bold text-gray-900">Shakti</h3>
            <p className="text-sm text-gray-500 mt-1">Poder divino — expandí tu práctica</p>
          </div>
          <div className="mb-6 space-y-2">
            {shaktiPlans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between">
                <span className="text-2xl font-black text-gray-900">
                  {formatPrice(plan.price_cents, plan.currency)}
                </span>
                <span className="text-gray-400 text-sm">
                  /{plan.interval === "month" ? "mes" : "año"}
                </span>
              </div>
            ))}
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {SHAKTI_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check</span>
                {f}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            {shaktiPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  plan.interval === "year"
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-200 hover:shadow-xl hover:-translate-y-0.5"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.id
                  ? "Redirigiendo..."
                  : plan.trial_days > 0
                    ? `Probar gratis ${plan.trial_days} días`
                    : plan.interval === "month"
                      ? "Suscribirme mensual"
                      : "Suscribirme anual"}
              </button>
            ))}
          </div>
        </div>

        {/* ANANDA - Full */}
        <div className="bg-white rounded-3xl border-2 border-amber-300 p-8 shadow-sm flex flex-col relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-4 py-1 rounded-full">
            Todo incluido
          </div>
          <div className="mb-6">
            <span className="text-4xl block mb-3">☀️</span>
            <h3 className="text-xl font-bold text-gray-900">Ananda</h3>
            <p className="text-sm text-gray-500 mt-1">Dicha plena — sin límites</p>
          </div>
          <div className="mb-6 space-y-2">
            {anandaPlans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between">
                <span className="text-2xl font-black text-gray-900">
                  {formatPrice(plan.price_cents, plan.currency)}
                </span>
                <span className="text-gray-400 text-sm">
                  /{plan.interval === "month" ? "mes" : "año"}
                </span>
              </div>
            ))}
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {ANANDA_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check</span>
                {f}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            {anandaPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  plan.interval === "year"
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200 hover:shadow-xl hover:-translate-y-0.5"
                    : "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-200 hover:shadow-xl hover:-translate-y-0.5"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.id
                  ? "Redirigiendo..."
                  : plan.trial_days > 0
                    ? `Probar gratis ${plan.trial_days} días`
                    : plan.interval === "month"
                      ? "Suscribirme mensual"
                      : "Suscribirme anual"}
              </button>
            ))}
          </div>
        </div>
      </div>

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
