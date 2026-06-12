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
  bundle_price_cents?: number;
  max_sessions?: number;
};

type Props = {
  services: Service[];
  promos: Promo[];
  selected: Service | null;
  onSelect: (service: Service) => void;
  onBuyPromo?: (promoId: string) => void;
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(cents / 100);

const formatSimplePrice = (cents: number) =>
  `$${(cents / 100).toLocaleString("es-AR")}`;

export default function ServiceSelector({ services, promos, selected, onSelect, onBuyPromo }: Props) {
  const [expandedPromo, setExpandedPromo] = useState<string | null>(null);

  const servicesById = new Map(services.map((s) => [s.id, s]));

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-text-main)] font-display">
          ¿Qué servicio querés reservar?
        </h2>
        <p className="text-[var(--color-text-light)] mt-1">
          Elegí entre nuestras opciones de bienestar
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {promos.map((promo) => {
          const isExpanded = expandedPromo === promo.id;
          const childServices = promo.service_ids
            .map((id) => servicesById.get(id))
            .filter((s): s is Service => !!s);
          const hasBundlePrice = !!promo.bundle_price_cents && promo.bundle_price_cents > 0;

          return (
            <React.Fragment key={promo.id}>
              <div
                className={`rounded-2xl border-2 transition-all duration-200 ${
                  isExpanded
                    ? "border-amber-400 bg-amber-50 shadow-md"
                    : "border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:shadow-sm"
                }`}
              >
                <button
                  onClick={() => setExpandedPromo(isExpanded ? null : promo.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500">local_offer</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--color-text-main)] text-sm">
                        {promo.name}
                      </h3>
                      {promo.description && (
                        <p className="text-xs text-[var(--color-text-light)] mt-0.5 line-clamp-1">
                          {promo.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasBundlePrice && (
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          {formatSimplePrice(promo.bundle_price_cents!)}
                        </span>
                      )}
                      <span className="text-xs text-amber-600 font-medium whitespace-nowrap">
                        {childServices.length} servicios
                      </span>
                      <span className={`material-symbols-outlined text-amber-400 text-lg transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}>
                        expand_more
                      </span>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {hasBundlePrice && onBuyPromo && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onBuyPromo(promo.id); }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-bold transition-all"
                      >
                        Comprar Promo {formatSimplePrice(promo.bundle_price_cents!)} · {promo.max_sessions || 1} sesiones
                      </button>
                    )}
                    {!hasBundlePrice && childServices.length > 0 && (
                      <p className="text-xs text-amber-600 text-center pt-1 pb-1">
                        Seleccioná un servicio para reservar con descuento
                      </p>
                    )}
                    {childServices.map((svc) => (
                      <button
                        key={svc.id}
                        onClick={() => onSelect(svc)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                          selected?.id === svc.id
                            ? "border-[var(--color-primary-dark)] bg-[var(--color-primary)]/20 shadow-md"
                            : "border-gray-100 bg-white hover:border-[var(--color-primary)] hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-[var(--color-text-main)] text-sm">
                              {svc.name}
                            </h3>
                            {svc.description && (
                              <p className="text-xs text-[var(--color-text-light)] mt-1 line-clamp-2">
                                {svc.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {(svc.price_cents_online || svc.price_cents_presencial || 0) > 0 ? (
                              <div className="text-right">
                                {svc.price_cents_online ? (
                                  <span className="text-xs font-bold text-[var(--color-terracotta)] whitespace-nowrap block">
                                    Online: {formatPrice(svc.price_cents_online!)}
                                  </span>
                                ) : null}
                                {svc.price_cents_presencial ? (
                                  <span className="text-xs font-bold text-[var(--color-terracotta)] whitespace-nowrap block">
                                    Presencial: {formatPrice(svc.price_cents_presencial!)}
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-green-600 whitespace-nowrap">
                                Gratuito
                              </span>
                            )}
                            <span className="text-xs font-medium text-[var(--color-primary-dark)] bg-[var(--color-primary)]/30 px-2 py-1 rounded-full whitespace-nowrap">
                              {svc.duration_minutes} min
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {services.filter((s) => !promos.some((p) => p.service_ids.includes(s.id))).map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
              selected?.id === service.id
                ? "border-[var(--color-primary-dark)] bg-[var(--color-primary)]/20 shadow-md"
                : "border-gray-100 bg-white hover:border-[var(--color-primary)] hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--color-text-main)] text-sm">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-xs text-[var(--color-text-light)] mt-1 line-clamp-2">
                    {service.description}
                  </p>
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
                  <span className="text-xs font-medium text-green-600 whitespace-nowrap">
                    Gratuito
                  </span>
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
  );
}
