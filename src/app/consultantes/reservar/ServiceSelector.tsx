"use client";

import React, { useState } from "react";

type Service = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  allowed_modalities: string[] | null;
  price_cents_online?: number;
  price_cents_presencial?: number;
};

type Promo = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  service_ids: string[];
  modality: string | null;
  discount_factor: number;
  deposit_type: string;
  deposit_value: number;
  bundle_price_cents?: number;
  max_sessions?: number;
};

type UserPurchase = {
  promotion_id: string;
  sessions_remaining: number;
};

type Props = {
  services: Service[];
  promos: Promo[];
  selected: Service | null;
  onSelect: (service: Service) => void;
  onBuyPromo?: (promoId: string) => void;
  onReservePromo?: (promo: Promo) => void;
  userPurchases?: UserPurchase[];
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100);

const MODALITY_STYLES: Record<string, { dot: string; label: string }> = {
  online: { dot: "bg-blue-500", label: "Online" },
  presencial: { dot: "bg-[var(--color-terracotta)]", label: "Presencial" },
  both: { dot: "bg-green-500", label: "Ambas" },
  mixta: { dot: "bg-green-500", label: "Ambas" },
};

export default function ServiceSelector({ services, promos, selected, onSelect, onBuyPromo, onReservePromo, userPurchases = [] }: Props) {
  const servicesById = new Map(services.map((s) => [s.id, s]));
  const purchasesByPromo = new Map(userPurchases.map((p) => [p.promotion_id, p.sessions_remaining]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-center">
          <h2 className="text-2xl font-bold text-[var(--color-text-main)] font-display">
            ¿Qué querés reservar?
          </h2>
          <p className="text-sm text-[var(--color-text-light)] mt-1">
            Elegí entre nuestras promociones o servicios individuales
          </p>
        </div>
        <button
          onClick={() => window.location.href = "/consultantes/reservar/simple"}
          className="shrink-0 ml-4 px-5 py-2 rounded-full bg-[var(--color-terracotta)]/10 text-[var(--color-terracotta)] text-sm font-semibold border border-[var(--color-terracotta)]/20 hover:bg-[var(--color-terracotta)]/20 transition-colors"
        >
          Modo simple
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* LEFT: Promos (2/5 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">local_offer</span>
            Promociones
          </h3>

          {promos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No hay promociones activas
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {promos.map((promo) => {
                const childServices = promo.service_ids
                  .map((id) => servicesById.get(id))
                  .filter((s): s is Service => !!s);

                const priceField = promo.modality === "online" ? "price_cents_online" : promo.modality === "presencial" ? "price_cents_presencial" : "price_cents_online";
                const subtotal = childServices.reduce((sum, s) => sum + ((s as any)[priceField] || 0), 0);
                const df = promo.discount_factor ?? 1;
                const total = Math.round(subtotal * df);
                const hasDiscount = df > 0 && df < 1;
                const remaining = purchasesByPromo.get(promo.id);
                const hasPurchase = remaining && remaining > 0;
                const ms = MODALITY_STYLES[promo.modality || "online"] || MODALITY_STYLES.online;

                return (
                  <div
                    key={promo.id}
                    className="rounded-xl border border-amber-200 bg-white hover:bg-amber-50/30 transition-colors overflow-hidden"
                  >
                    <div className="p-3.5">
                      {/* Header */}
                      <div className="flex items-start gap-2.5 mb-2.5">
                        <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">local_offer</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm">{promo.name}</h4>
                          {promo.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{promo.description}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white border shrink-0`}>
                          <span className={`w-2 h-2 rounded-full ${ms.dot}`} />
                          {ms.label}
                        </span>
                      </div>

                      {/* Services list */}
                      <div className="space-y-1 mb-3">
                        {childServices.map((svc) => (
                          <div key={svc.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                            <span className="text-gray-600 font-medium truncate">{svc.name}</span>
                            <span className="text-gray-400 shrink-0 ml-2">
                              {(svc as any)[priceField] > 0 ? formatPrice((svc as any)[priceField]) : "—"}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Pricing */}
                      <div className="flex items-center justify-between">
                        <div>
                          {hasDiscount ? (
                            <div>
                              <span className="text-xs text-gray-400 line-through block">{formatPrice(subtotal)}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-base font-extrabold text-green-700">{formatPrice(total)}</span>
                                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                                  {Math.round((1 - df) * 100)}% OFF
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-base font-extrabold text-gray-900">{formatPrice(total)}</span>
                          )}
                        </div>

                        {/* CTA */}
                        <div className="shrink-0 ml-3">
                          {hasPurchase && onReservePromo ? (
                            <button onClick={() => onReservePromo(promo)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
                              Reservar ({remaining})
                            </button>
                          ) : promo.bundle_price_cents && promo.bundle_price_cents > 0 && onBuyPromo ? (
                            <button onClick={() => onBuyPromo(promo.id)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
                              Comprar · {promo.max_sessions || 1} ses
                            </button>
                          ) : onReservePromo ? (
                            <button onClick={() => onReservePromo(promo)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
                              Reservar
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Individual Services (3/5 width) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">spa</span>
            Servicios Individuales
          </h3>

          {services.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No hay servicios disponibles
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {services.map((service) => {
                const isSelected = selected?.id === service.id;
                const hasOnline = service.allowed_modalities?.includes("online") && (service.price_cents_online || 0) > 0;
                const hasPresencial = service.allowed_modalities?.includes("presencial") && (service.price_cents_presencial || 0) > 0;
                const isFree = !hasOnline && !hasPresencial;

                return (
                  <button
                    key={service.id}
                    onClick={() => onSelect(service)}
                    className={`text-left p-3.5 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-[var(--color-terracotta)] bg-[var(--color-terracotta)]/5"
                        : "border-gray-100 bg-white hover:border-[var(--color-terracotta)]/30 hover:bg-gray-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm">{service.name}</h4>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      <span>{service.duration_minutes} min</span>
                    </div>

                    {/* Prices row */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {hasOnline && (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          Online {formatPrice(service.price_cents_online!)}
                        </span>
                      )}
                      {hasPresencial && (
                        <span className="text-xs font-semibold text-[var(--color-terracotta)] bg-[var(--color-terracotta)]/10 px-2 py-0.5 rounded-md">
                          Presencial {formatPrice(service.price_cents_presencial!)}
                        </span>
                      )}
                      {isFree && (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                          Gratuito
                        </span>
                      )}
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-[var(--color-terracotta)]/20">
                        <span className="text-xs font-bold text-[var(--color-terracotta)]">Seleccionado ✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
