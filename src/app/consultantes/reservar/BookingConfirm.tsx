"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Slot } from "@/types/appointments";

type Service = { id: string; name: string; duration_minutes: number; price_cents?: number };

type Promo = {
  id: string;
  name: string;
  description: string | null;
  discount_percent: number | null;
  discount_fixed: number | null;
  price_override: number | null;
  final_price_cents: number;
  original_price_cents: number;
  expires_at: string | null;
};

type Props = {
  service: Service;
  modality: string;
  date: Date;
  slot: Slot;
  promotionId: string | null;
  onPromoSelect: (promotionId: string | null, priceCents: number | undefined) => void;
  onConfirm: (notes?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
};

const startLabel = (s: Slot) => {
  const d = new Date(s.slot_start);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const endLabel = (s: Slot) => {
  const d = new Date(s.slot_end);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const slotDurationMinutes = (s: Slot) => {
  return Math.round((new Date(s.slot_end).getTime() - new Date(s.slot_start).getTime()) / 60000);
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(cents / 100);

export default function BookingConfirm({
  service,
  modality,
  date,
  slot,
  promotionId,
  onPromoSelect,
  onConfirm,
  loading,
  error,
}: Props) {
  const [notes, setNotes] = useState("");
  const [promos, setPromos] = useState<Promo[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const hasPrice = (service.price_cents || 0) > 0;

  const selectedPromo = promos.find((p) => p.id === promotionId) || null;
  const effectivePrice = selectedPromo ? selectedPromo.final_price_cents : (service.price_cents || 0);
  const hasDiscount = selectedPromo && effectivePrice < (service.price_cents || 0);

  useEffect(() => {
    if (!hasPrice) return;
    setPromosLoading(true);
    fetch(`/api/promos/available?service_id=${service.id}`)
      .then((r) => r.json())
      .then((json) => {
        setPromos(json.data || []);
        if (json.data?.length === 0) onPromoSelect(null, undefined);
      })
      .catch(() => setPromos([]))
      .finally(() => setPromosLoading(false));
  }, [service.id]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-text-main)] font-display">
          Resumen de tu reserva
        </h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 max-w-md mx-auto shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--color-text-light)]">Servicio</span>
          <span className="font-semibold text-[var(--color-text-main)]">{service.name}</span>
        </div>

        {hasPrice && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--color-text-light)]">Precio</span>
            <span className="font-bold text-lg text-[var(--color-terracotta)]">
              {hasDiscount ? (
                <span className="flex items-center gap-2">
                  <span className="line-through text-sm text-gray-400 font-normal">
                    {formatPrice(service.price_cents!)}
                  </span>
                  {formatPrice(effectivePrice)}
                </span>
              ) : (
                formatPrice(service.price_cents!)
              )}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--color-text-light)]">Modalidad</span>
          <span className="font-medium text-[var(--color-text-main)] capitalize">
            {modality === "online" ? "💻 Online" : "🏠 Presencial"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--color-text-light)]">Fecha</span>
          <span className="font-medium text-[var(--color-text-main)]">
            {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--color-text-light)]">Horario</span>
          <span className="font-medium text-[var(--color-text-main)]">
            {startLabel(slot)} - {endLabel(slot)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--color-text-light)]">Duración</span>
          <span className="font-medium text-[var(--color-text-main)]">
            {slotDurationMinutes(slot)} minutos
          </span>
        </div>

        {hasPrice && promos.length > 0 && (
          <>
            <hr className="border-gray-100" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-main)] mb-3">
                Promociones disponibles
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => onPromoSelect(null, undefined)}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                    !selectedPromo
                      ? "border-[var(--color-primary-dark)] bg-[var(--color-primary-dark)]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium">Sin promo</span>
                  <span className="float-right text-gray-500">{formatPrice(service.price_cents!)}</span>
                </button>
                {promos.map((promo) => (
                  <button
                    key={promo.id}
                    onClick={() => onPromoSelect(promo.id, promo.final_price_cents)}
                    className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                      selectedPromo?.id === promo.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <div>
                      <span className="font-medium text-green-700">{promo.name}</span>
                      {promo.description && (
                        <span className="text-gray-500 ml-2">{promo.description}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-green-600 font-bold">
                        {formatPrice(promo.final_price_cents)}
                      </span>
                      {promo.final_price_cents < promo.original_price_cents && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(promo.original_price_cents)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {promosLoading && (
          <div className="text-center py-2">
            <span className="text-xs text-gray-400">Cargando promos...</span>
          </div>
        )}

        <hr className="border-gray-100" />

        <div>
          <label className="text-sm text-[var(--color-text-light)] block mb-2">
            Notas adicionales (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alguna nota para Ana..."
            className="w-full p-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-[var(--color-primary-dark)] transition-colors"
            rows={3}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      {hasPrice && (
        <p className="text-xs text-[var(--color-text-light)] text-center">
          Al confirmar serás redirigido a Mercado Pago para realizar el pago de forma segura.
          Tu turno se reservará una vez confirmado el pago.
        </p>
      )}

      <div className="flex justify-center">
        <button
          onClick={() => onConfirm(notes || undefined)}
          disabled={loading}
          className="px-8 py-3 bg-[var(--color-terracotta)] text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Reservando..."
            : hasPrice
              ? `Pagar y reservar (${formatPrice(effectivePrice)})`
              : "Confirmar Reserva"}
        </button>
      </div>
    </div>
  );
}
