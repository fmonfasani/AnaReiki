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

      {/* Two-column layout: Services (left, wider) | Promos (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        {/* LEFT: Individual Services */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 min-h-[400px]">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">spa</span>
            Servicios Individuales
          </h3>

          {services.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No hay servicios disponibles
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((service) => {
                const isSelected = selected?.id === service.id;
                const hasOnline = service.allowed_modalities?.includes("online") && (service.price_cents_online || 0) > 0;
                const hasPresencial = service.allowed_modalities?.includes("presencial") && (service.price_cents_presencial || 0) > 0;
                const isFree = !hasOnline && !hasPresencial;

                return (
                  <button
                    key={service.id}
                    onClick={() => onSelect(service)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-200 flex flex-col min-h-[180px] ${
                      isSelected
                        ? "border-[var(--color-terracotta)] bg-[var(--color-terracotta)]/5"
                        : "border-gray-100 bg-white hover:border-gray-300"
                    }`}
                  >
                    <h4 className="font-medium text-gray-900">{service.name}</h4>

                    <div className="flex items-center gap-1 mt-2 text-[13px] text-gray-400">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      <span>{service.duration_minutes} min</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
                      {hasOnline && (
                        <span className="text-[13px] font-semibold text-[#185FA5] bg-[#185FA5]/10 px-2 py-0.5 rounded-md">
                          Online {formatPrice(service.price_cents_online!)}
                        </span>
                      )}
                      {hasPresencial && (
                        <span className="text-[13px] font-semibold text-[#D85A30] bg-[#D85A30]/10 px-2 py-0.5 rounded-md">
                          Presencial {formatPrice(service.price_cents_presencial!)}
                        </span>
                      )}
                      {isFree && (
                        <span className="text-[13px] font-semibold text-[#3B6D11] bg-[#3B6D11]/10 px-2 py-0.5 rounded-md">
                          Gratuito
                        </span>
                      )}
                    </div>

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

        {/* RIGHT: Promos */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 min-h-[400px]">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">local_offer</span>
            Promociones
          </h3>

          {promos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No hay promociones activas
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="rounded-xl border border-amber-200 bg-white hover:border-amber-300 transition-colors overflow-visible"
                  >
                    <div className="p-4">
                      <div className="flex flex-col gap-1 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-500 text-sm shrink-0">local_offer</span>
                          <h4 className="font-medium text-gray-900">{promo.name}</h4>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full bg-white border self-start">
                          <span className={`w-1.5 h-1.5 rounded-full ${ms.dot}`} />
                          {ms.label}
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        {childServices.map((svc) => (
                          <div key={svc.id} className="flex items-center justify-between text-[13px] bg-gray-50 rounded px-2 py-1">
                            <span className="text-gray-600 font-medium">{svc.name}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          {hasDiscount ? (
                            <div>
                              <span className="text-[13px] text-gray-400 line-through">{formatPrice(subtotal)}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-extrabold text-green-700">{formatPrice(total)}</span>
                                <span className="text-[11px] font-bold text-green-600 bg-green-100 px-1 py-0.5 rounded-full">
                                  {Math.round((1 - df) * 100)}% OFF
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm font-extrabold text-gray-900">{formatPrice(total)}</span>
                          )}
                        </div>

                        <div className="shrink-0 ml-2">
                          {hasPurchase && onReservePromo ? (
                            <button onClick={() => onReservePromo(promo)}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[13px] font-bold rounded-lg transition-colors whitespace-nowrap">
                              ({remaining})
                            </button>
                          ) : promo.bundle_price_cents && promo.bundle_price_cents > 0 && onBuyPromo ? (
                            <button onClick={() => onBuyPromo(promo.id)}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[13px] font-bold rounded-lg transition-colors whitespace-nowrap">
                              Comprar
                            </button>
                          ) : onReservePromo ? (
                            <button onClick={() => onReservePromo(promo)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-bold rounded-lg transition-colors whitespace-nowrap">
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
      </div>
    </div>
  );
}
