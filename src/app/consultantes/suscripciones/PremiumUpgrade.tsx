"use client";

import React from "react";

const TIERS = [
  {
    slug: "prana",
    name: "Prana",
    emoji: "🌿",
    desc: "Energía vital — lo esencial",
    border: "border-gray-100",
    features: [
      "Perfil personal",
      "Agendar citas con Ana",
      "Mis Citas (ver/cancelar turnos)",
      "Comunidad",
      "Mensajes directos",
      "Notificaciones de recordatorio",
    ],
  },
  {
    slug: "shakti",
    name: "Shakti",
    emoji: "🔥",
    desc: "Poder divino — expandí tu práctica",
    border: "border-pink-200",
    price: "$149/mes",
    features: [
      "Todo lo de Prana",
      "Biblioteca: podcasts, meditaciones, reiki y yoga",
      "Evolución: mood tracker básico",
    ],
  },
  {
    slug: "ananda",
    name: "Ananda",
    emoji: "☀️",
    desc: "Dicha plena — sin límites",
    border: "border-amber-300",
    price: "$299/mes",
    features: [
      "Todo lo de Shakti",
      "Todas las clases grabadas",
      "Chat Buda (IA ilimitado)",
      "Evolución completa con insights IA",
    ],
  },
];

export default function PremiumUpgrade() {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-display">
          Suscripciones
        </h1>
        <p className="text-lg text-gray-500 mt-2 max-w-xl mx-auto">
          Estás en el plan Prana. Los planes pagos estarán disponibles
          próximamente.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {TIERS.map((tier) => {
          const isPrana = tier.slug === "prana";
          return (
            <div
              key={tier.slug}
              className={`bg-white rounded-3xl border-2 ${tier.border} p-8 shadow-sm flex flex-col relative ${
                isPrana ? "ring-2 ring-[var(--color-primary-dark)] ring-offset-2" : ""
              }`}
            >
              {tier.slug === "shakti" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Popular
                </div>
              )}

              <div className="mb-6">
                <span className="text-4xl block mb-3">{tier.emoji}</span>
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{tier.desc}</p>
              </div>

              <div className="mb-6">
                {isPrana ? (
                  <span className="text-4xl font-black text-gray-900">Gratis</span>
                ) : (
                  <span className="text-2xl font-black text-gray-900">{tier.price}</span>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 text-sm mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isPrana ? (
                <div className="w-full py-3 rounded-xl font-bold text-sm text-center bg-[var(--color-primary)]/30 text-[var(--color-primary-dark)] border border-[var(--color-primary)]">
                  Plan actual
                </div>
              ) : (
                <div className="w-full py-3 rounded-xl font-bold text-sm text-center bg-gray-100 text-gray-400 border border-gray-200">
                  Próximamente
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400 max-w-lg mx-auto">
          Los planes de pago estarán disponibles pronto. Actualmente disfrutás
          del plan Prana con todas sus funcionalidades gratuitas.
        </p>
      </div>
    </div>
  );
}
