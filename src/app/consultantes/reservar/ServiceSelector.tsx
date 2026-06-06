"use client";

import React from "react";

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

type Props = {
  services: Service[];
  selected: Service | null;
  onSelect: (service: Service) => void;
};

export default function ServiceSelector({ services, selected, onSelect }: Props) {
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
        {services.map((service) => (
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
                        Online: ${(service.price_cents_online! / 100).toLocaleString("es-AR")}
                      </span>
                    ) : null}
                    {service.price_cents_presencial ? (
                      <span className="text-xs font-bold text-[var(--color-terracotta)] whitespace-nowrap block">
                        Presencial: ${(service.price_cents_presencial! / 100).toLocaleString("es-AR")}
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
