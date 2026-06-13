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

export default function ServiceSelector({ services, promos, selected, onSelect, onBuyPromo, onReservePromo, userPurchases = [] }: Props) {
  const servicesById = new Map(services.map((s) => [s.id, s]));
  const purchasesByPromo = new Map(userPurchases.map((p) => [p.promotion_id, p.sessions_remaining]));

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-text-main)] font-display">
          ¿Qué querés reservar?
        </h2>
        <p className="text-[var(--color-text-light)] mt-1">
          Elegí entre nuestras promociones o servicios individuales
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Promos */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">local_offer</span>
            Promociones
          </h3>
          <div className="space-y-3">
            {promos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                No hay promociones activas
              </p>
            ) : promos.map((promo) => {
              const childServices = promo.service_ids
                .map((id) => servicesById.get(id))
                .filter((s): s is Service => !!s);

              const priceField = promo.modality === "online" ? "price_cents_online" : "price_cents_presencial";
              const subtotal = childServices.reduce((sum, s) => sum + ((s as any)[priceField] || 0), 0);
              const df = promo.discount_factor ?? 1;
              const total = Math.round(subtotal * df);
              const hasDiscount = df > 0 && df < 1;
              const remaining = purchasesByPromo.get(promo.id);
              const hasPurchase = remaining && remaining > 0;

              let depositCents = 0;
              if (promo.deposit_type === "percent" && promo.deposit_value > 0) {
                depositCents = Math.round(total * (promo.deposit_value / 100));
              } else if (promo.deposit_type === "fixed" && promo.deposit_value > 0) {
                depositCents = Math.round(promo.deposit_value);
              }

              return (
                <div key={promo.id} className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 overflow-hidden hover:shadow-sm transition-all">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-amber-500 mt-0.5">local_offer</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--color-text-main)]">{promo.name}</h3>
                        {promo.description && (
                          <p className="text-xs text-[var(--color-text-light)] mt-0.5">{promo.description}</p>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                        promo.modality === "online" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {promo.modality === "online" ? "💻 Online" : "🏠 Presencial"}
                      </span>
                    </div>

                    {/* Services list */}
                    <div className="mt-3 space-y-1.5">
                      {childServices.map((svc) => (
                        <div key={svc.id} className="flex items-center justify-between text-sm bg-white/70 rounded-lg px-3 py-2 border border-amber-100/50">
                          <span className="text-gray-700 font-medium">{svc.name}</span>
                          <span className="text-xs text-gray-400">{svc.duration_minutes} min · {formatPrice((svc as any)[priceField] || 0)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pricing */}
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        {hasDiscount ? (
                          <div className="space-y-0.5">
                            <span className="text-sm text-gray-400 line-through block">{formatPrice(subtotal)}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg font-extrabold text-green-700">{formatPrice(total)}</span>
                              <span className="text-xs font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full shrink-0">
                                {Math.round((1 - df) * 100)}% OFF
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-lg font-extrabold text-gray-900">{formatPrice(total)}</span>
                        )}
                        {depositCents > 0 && (
                          <p className="text-xs text-blue-600 mt-0.5">Seña: {formatPrice(depositCents)}</p>
                        )}
                      </div>

                      {/* CTA button */}
                      {hasPurchase && onReservePromo ? (
                        <button
                          onClick={() => onReservePromo(promo)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
                        >
                          Reservar sesión (te {remaining === 1 ? "queda" : "quedan"} {remaining})
                        </button>
                      ) : promo.bundle_price_cents && promo.bundle_price_cents > 0 && onBuyPromo ? (
                        <button
                          onClick={() => onBuyPromo(promo.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all"
                        >
                          Comprar Promo {formatPrice(promo.bundle_price_cents)} · {promo.max_sessions || 1} sesiones
                        </button>
                      ) : onReservePromo ? (
                        <button
                          onClick={() => onReservePromo(promo)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all"
                        >
                          Reservar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Individual Services */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">spa</span>
            Servicios Individuales
          </h3>
          <div className="space-y-3">
            {services.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                No hay servicios disponibles
              </p>
            ) : services.map((service) => (
              <button
                key={service.id}
                onClick={() => onSelect(service)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                  selected?.id === service.id
                    ? "border-[var(--color-primary-dark)] bg-[var(--color-primary)]/20 shadow-md"
                    : "border-gray-100 bg-white hover:border-[var(--color-primary)] hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--color-text-main)]">{service.name}</h3>
                    {service.description && (
                      <p className="text-xs text-[var(--color-text-light)] mt-1 line-clamp-2">{service.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {(service.price_cents_online || service.price_cents_presencial || 0) > 0 ? (
                      <div className="text-right">
                        {service.price_cents_online ? (
                          <span className="text-xs font-bold text-[var(--color-terracotta)] whitespace-nowrap block">
                            Online: {formatPrice(service.price_cents_online!)}
                          </span>
                        ) : null}
                        {service.price_cents_presencial ? (
                          <span className="text-xs font-bold text-[var(--color-terracotta)] whitespace-nowrap block">
                            Presencial: {formatPrice(service.price_cents_presencial!)}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-green-600 whitespace-nowrap">Gratuito</span>
                    )}
                    <span className="text-xs font-medium text-[var(--color-primary-dark)] bg-[var(--color-primary)]/30 px-2 py-1 rounded-full whitespace-nowrap">
                      {service.duration_minutes} min
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
