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
};

const STEPS = ["Servicio", "Modalidad", "Fecha", "Horario", "Confirmar", "Listo"];

export default function BookingWizard() {
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedModality, setSelectedModality] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  const [promoPriceCents, setPromoPriceCents] = useState<number | undefined>(undefined);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("/api/services");
        const json = await res.json();
        setServices(json.data || []);
        setPromos(json.promos || []);
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(1);
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
    setSelectedPromotionId(null);
    setPromoPriceCents(undefined);
    setStep(4);
  };

  const handlePromoSelect = (promotionId: string | null, priceCents: number | undefined) => {
    setSelectedPromotionId(promotionId);
    setPromoPriceCents(priceCents);
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
        if (promoPriceCents !== undefined) {
          body.price_cents = promoPriceCents;
        }
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
      setStep(0);
    } else if (step === 2) {
      setSelectedModality(null);
      setStep(1);
    } else if (step === 3) {
      setSelectedDate(null);
      setStep(2);
    } else if (step === 4) {
      setSelectedSlot(null);
      setStep(3);
    }
  };

  if (loadingServices) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-text-light)]">Cargando servicios...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step
                  ? "bg-[var(--color-terracotta)] text-white"
                  : i === step
                    ? "bg-[var(--color-primary-dark)] text-white"
                    : "bg-gray-100 text-[var(--color-text-light)]"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-6 h-0.5 ${
                  i < step ? "bg-[var(--color-terracotta)]" : "bg-gray-100"
                }`}
              />
            )}
          </React.Fragment>
        ))}
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
          <ServiceSelector
            services={services}
            promos={promos}
            selected={selectedService}
            onSelect={handleServiceSelect}
          />
        )}

        {step === 1 && selectedService && (
          <ModalitySelector
            allowedModalities={selectedService.allowed_modalities || ["online", "presencial"]}
            selected={selectedModality}
            onSelect={handleModalitySelect}
          />
        )}

        {step === 2 && selectedModality && (
          <DatePicker
            modality={selectedModality}
            serviceId={selectedService?.id || null}
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
            onPromoSelect={handlePromoSelect}
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
