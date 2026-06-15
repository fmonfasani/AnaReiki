"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ServiceSelector from "./ServiceSelector";
import ModalitySelector from "./ModalitySelector";
import DatePicker from "./DatePicker";
import TimeSlots from "./TimeSlots";
import BookingConfirm from "./BookingConfirm";
import BookingConfirmation from "./BookingConfirmation";

import type { Slot } from "@/types/appointments";

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

const STEPS = ["Servicio", "Modalidad", "Fecha", "Horario", "Confirmar", "Listo"];

export default function BookingWizard() {
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [userPurchases, setUserPurchases] = useState<UserPurchase[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedModality, setSelectedModality] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  const [promoPriceCents, setPromoPriceCents] = useState<number | undefined>(undefined);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [buyingPromo, setBuyingPromo] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const [svcRes, purchasesRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/promos/my"),
        ]);
        const svcJson = await svcRes.json();
        setServices(svcJson.data || []);
        setPromos(svcJson.promos || []);

        const purchasesJson = await purchasesRes.json();
        setUserPurchases((purchasesJson.data || []).map((p: any) => ({
          promotion_id: p.promotion_id,
          sessions_remaining: p.sessions_remaining,
        })));
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const getPromoTotal = (promo: Promo): number => {
    const svcs = promo.service_ids.map((id) => services.find((s) => s.id === id)).filter(Boolean) as Service[];
    const priceField = promo.modality === "online" ? "price_cents_online" : "price_cents_presencial";
    const subtotal = svcs.reduce((sum, s) => sum + ((s as any)[priceField] || 0), 0);
    return Math.round(subtotal * (promo.discount_factor ?? 1));
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedPromo(null);
    setSelectedPromotionId(null);
    setPromoPriceCents(undefined);
    setStep(1);
  };

  const handleReservePromo = (promo: Promo) => {
    const firstService = promo.service_ids
      .map((id) => services.find((s) => s.id === id))
      .find(Boolean);
    if (!firstService) return;

    setSelectedService(firstService);
    setSelectedPromo(promo);
    setSelectedModality(promo.modality || "online");
    setSelectedPromotionId(promo.id);
    setPromoPriceCents(getPromoTotal(promo));
    // Skip modality step (promo has fixed modality) -> go to date
    setStep(2);
  };

  const handleModalitySelect = (modality: string) => {
    setSelectedModality(modality);
    setStep(2);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep(3);
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
    setStep(4);
  };

  const handleBuyPromo = async (promoId: string) => {
    setBuyingPromo(true);
    try {
      const res = await fetch(`/api/promos/${promoId}/buy`, { method: "POST" });
      const json = await res.json();
      if (json.mp_init_point) {
        window.location.href = json.mp_init_point;
      } else {
        setBookingError(json.error || "Error al comprar promo");
      }
    } catch {
      setBookingError("Error de conexión");
    }
    setBuyingPromo(false);
  };

  const handleConfirm = async (notes?: string) => {
    if (!selectedService || !selectedModality || !selectedDate || !selectedSlot) return;

    setBookingLoading(true);
    setBookingError(null);

    try {
      const body: Record<string, unknown> = {
        service_id: selectedService.id,
        rule_id: selectedSlot.rule_id,
        modality: selectedModality,
        slot_start: selectedSlot.slot_start,
        notes,
      };

      if (selectedPromotionId) {
        body.promotion_id = selectedPromotionId;
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        setBookingError(json.error || "Error al reservar");
        return;
      }

      if (json.requires_payment && json.mp_init_point) {
        window.location.href = json.mp_init_point;
        return;
      }

      setAppointmentId(json.data.id);
      setStep(5);
    } catch {
      setBookingError("Error de conexión");
    } finally {
      setBookingLoading(false);
    }
  };

  const goBack = () => {
    if (step === 1) {
      setSelectedService(null);
      setSelectedPromo(null);
      setSelectedPromotionId(null);
      setPromoPriceCents(undefined);
      setStep(0);
    } else if (step === 2) {
      if (selectedPromo) {
        // Came from promo, go back to service selection
        setSelectedPromo(null);
        setSelectedPromotionId(null);
        setPromoPriceCents(undefined);
        setSelectedService(null);
        setSelectedModality(null);
        setStep(0);
      } else {
        setSelectedModality(null);
        setStep(1);
      }
    } else if (step === 3) {
      setSelectedDate(null);
      setStep(2);
    } else if (step === 4) {
      setSelectedSlot(null);
      setStep(3);
    }
  };

  const stepLabel = selectedPromo ? (
    [STEPS[0], "—", STEPS[2], STEPS[3], STEPS[4], STEPS[5]]
  ) : STEPS;

  const displaySteps = selectedPromo
    ? ["Servicio", "", "Fecha", "Horario", "Confirmar", "Listo"]
    : STEPS;

  if (loadingServices) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-text-light)]">Cargando servicios...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper with labels */}
      <div className="mb-10">
        <div className="flex items-center justify-center">
          {displaySteps.map((label, i) => {
            if (!label) return <div key={i} className="w-8 h-0.5 bg-gray-100" />;
            return (
              <React.Fragment key={label}>
                {i > 0 && displaySteps[i - 1] && (
                  <div className={`w-10 h-0.5 ${i <= step ? "bg-[var(--color-terracotta)]" : "bg-gray-100"}`} />
                )}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      i < step
                        ? "bg-[var(--color-terracotta)] text-white shadow-sm"
                        : i === step
                          ? "bg-white text-[var(--color-terracotta)] border-2 border-[var(--color-terracotta)] shadow-sm"
                          : "bg-gray-50 text-gray-300 border border-gray-200"
                    }`}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight max-w-14 ${
                    i === step ? "text-[var(--color-terracotta)]" : i < step ? "text-gray-500" : "text-gray-300"
                  }`}>
                    {label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {step > 0 && step < 5 && (
        <button
          onClick={goBack}
          className="text-sm text-[var(--color-text-light)] hover:text-[var(--color-text-main)] mb-4 flex items-center gap-1"
        >
          ← Volver
        </button>
      )}

      <div className="animate-in fade-in duration-300">
        {step === 0 && (
          <>
            <ServiceSelector
              services={services}
              promos={promos}
              selected={selectedService}
              onSelect={handleServiceSelect}
              onBuyPromo={buyingPromo ? undefined : handleBuyPromo}
              onReservePromo={handleReservePromo}
              userPurchases={userPurchases}
            />
            {buyingPromo && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Redirigiendo a Mercado Pago...</p>
              </div>
            )}
          </>
        )}

        {step === 1 && selectedService && !selectedPromo && (
          <ModalitySelector
            allowedModalities={selectedService.allowed_modalities || ["online", "presencial"]}
            selected={selectedModality}
            onSelect={handleModalitySelect}
          />
        )}

        {step === 2 && selectedModality && (
          <DatePicker
            modality={selectedModality}
            serviceId={selectedPromo ? selectedPromo.service_ids[0] || null : (selectedService?.id || null)}
            selected={selectedDate}
            onSelect={handleDateSelect}
          />
        )}

        {step === 3 && selectedDate && selectedModality && (
          <TimeSlots
            date={selectedDate}
            modality={selectedModality}
            serviceId={selectedService?.id || null}
            selected={selectedSlot}
            onSelect={handleSlotSelect}
          />
        )}

        {step === 4 && selectedService && selectedModality && selectedDate && selectedSlot && (
          <BookingConfirm
            service={selectedService}
            modality={selectedModality}
            date={selectedDate}
            slot={selectedSlot}
            promotionId={selectedPromotionId}
            onPromoSelect={() => {}}
            onConfirm={handleConfirm}
            loading={bookingLoading}
            error={bookingError}
          />
        )}

        {step === 5 && selectedService && selectedModality && selectedDate && selectedSlot && appointmentId && (
          <BookingConfirmation
            service={selectedService}
            modality={selectedModality}
            date={selectedDate}
            slot={selectedSlot}
            appointmentId={appointmentId}
          />
        )}
      </div>
    </div>
  );
}
