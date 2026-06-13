"use client";

import React, { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import type { Slot, SlotDate } from "@/types/appointments";

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

const SIMPLE_STEPS = ["Servicio", "Modalidad", "Fecha", "Horario", "Confirmar"];

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(cents / 100);

export default function SimpleBookingWizard() {
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedModality, setSelectedModality] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [expandedPromo, setExpandedPromo] = useState<string | null>(null);

  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loadingDates, setLoadingDates] = useState(false);
  const [month, setMonth] = useState<Date>(new Date());

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("/api/services");
        const json = await res.json();
        const svcs = json.data || [];
        setServices(svcs);
        setPromos(json.promos || []);
        if (svcs.length === 1) {
          setSelectedService(svcs[0]);
          setStep(1);
        }
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (step !== 2 || !selectedModality || !selectedService) return;
    const fetchAvailability = async () => {
      setLoadingDates(true);
      const from = format(startOfMonth(month), "yyyy-MM-dd");
      const to = format(endOfMonth(month), "yyyy-MM-dd");
      const params = new URLSearchParams({ from, to });
      if (selectedModality && selectedModality !== "null") params.set("modality", selectedModality);
      if (selectedService) params.set("service_id", selectedService.id);
      try {
        const res = await fetch(`/api/availability?${params}`);
        const json = await res.json();
        const dates = new Set<string>((json.data || []).map((s: SlotDate) => s.slot_date));
        setAvailableDates(dates);
      } catch {
        setAvailableDates(new Set());
      } finally {
        setLoadingDates(false);
      }
    };
    fetchAvailability();
  }, [month, selectedModality, selectedService, step]);

  useEffect(() => {
    if (step !== 3 || !selectedDate || !selectedModality) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const params = new URLSearchParams({ date: dateStr });
      if (selectedModality && selectedModality !== "null") params.set("modality", selectedModality);
      if (selectedService) params.set("service_id", selectedService.id);
      try {
        const res = await fetch(`/api/availability?${params}`);
        const json = await res.json();
        const available = (json.data || []).filter((s: Slot) => s.booked < s.max_participants);
        setSlots(available);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [step, selectedDate, selectedModality, selectedService]);

  const isDayAvailable = (date: Date) => availableDates.has(format(date, "yyyy-MM-dd"));

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    const modalities = service.allowed_modalities || ["online", "presencial"];
    if (modalities.length === 1) {
      setSelectedModality(modalities[0]);
      setStep(2);
    } else {
      setStep(1);
    }
  };

  const handleModalitySelect = (modality: string) => {
    setSelectedModality(modality);
    setStep(2);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep(3);
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
    setStep(4);
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedModality || !selectedDate || !selectedSlot) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: selectedService.id,
          rule_id: selectedSlot.rule_id,
          modality: selectedModality,
          slot_start: selectedSlot.slot_start,
        }),
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
    } catch {
      setBookingError("Error de conexión");
    } finally {
      setBookingLoading(false);
    }
  };

  const goBack = () => {
    if (step === 0) return;
    if (step === 1) { setSelectedService(null); setStep(0); return; }
    if (step === 2) { setSelectedModality(null); setStep(services.length === 1 ? 1 : 0); return; }
    if (step === 3) { setSelectedDate(null); setSelectedSlot(null); setStep(2); return; }
    if (step === 4) { setSelectedSlot(null); setStep(3); return; }
  };

  const startLabel = (s: Slot) => {
    const d = new Date(s.slot_start);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const endLabel = (s: Slot) => {
    const d = new Date(s.slot_end);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const priceCents = selectedModality === "online"
    ? (selectedService?.price_cents_online || 0)
    : (selectedService?.price_cents_presencial || 0);

  if (loadingServices) {
    return <p className="text-center text-2xl py-12 text-gray-400">Cargando...</p>;
  }

  if (appointmentId) {
    return (
      <div className="text-center space-y-8 py-8">
        <div className="text-7xl">✅</div>
        <h2 className="text-3xl font-bold text-gray-800">Reserva confirmada</h2>
        <p className="text-xl text-gray-500">Te enviamos los detalles por email.</p>
        <div className="bg-white rounded-3xl border p-6 max-w-sm mx-auto text-left space-y-3 text-lg">
          <div className="flex justify-between"><span className="text-gray-400">Servicio</span><span className="font-semibold">{selectedService?.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Modalidad</span><span className="font-semibold capitalize">{selectedModality}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Día</span><span className="font-semibold">{selectedDate && format(selectedDate, "EEEE d/M", { locale: es })}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Horario</span><span className="font-semibold">{selectedSlot && `${startLabel(selectedSlot)} - ${endLabel(selectedSlot)}`}</span></div>
        </div>
        <a href="/consultantes/mis-citas" className="inline-block text-xl px-10 py-4 bg-[var(--color-terracotta)] text-white font-bold rounded-2xl">
          Ir a Mis Citas
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-400">Paso {step + 1} de 5</p>
        <h2 className="text-xl font-bold text-gray-400 mt-1">{SIMPLE_STEPS[step]}</h2>
      </div>

      {step > 0 && (
        <button onClick={goBack} className="text-lg text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
          ← Atrás
        </button>
      )}

      {/* Servicio */}
      {step === 0 && (
        <div className="space-y-4">
          <p className="text-3xl font-bold text-gray-800 text-center mb-6">¿Qué servicio querés?</p>
          <div className="space-y-3">
            {promos.map((promo) => (
              <React.Fragment key={promo.id}>
                <button onClick={() => setExpandedPromo(expandedPromo === promo.id ? null : promo.id)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                    expandedPromo === promo.id
                      ? "border-amber-400 bg-amber-50 shadow-md"
                      : "border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:shadow-md"
                  }`}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500 text-2xl">local_offer</span>
                    <div className="flex-1">
                      <span className="text-xl font-semibold text-gray-800">{promo.name}</span>
                      <span className="block text-base font-normal text-gray-400 mt-0.5">{promo.service_ids.length} servicios</span>
                    </div>
                    <span className={`material-symbols-outlined text-amber-400 transition-transform ${
                      expandedPromo === promo.id ? "rotate-180" : ""
                    }`}>expand_more</span>
                  </div>
                </button>
                {expandedPromo === promo.id && promo.service_ids.map((sid) => {
                  const svc = services.find((s) => s.id === sid);
                  if (!svc) return null;
                  return (
                    <button key={svc.id} onClick={() => handleServiceSelect(svc)}
                      className="w-full text-left p-5 rounded-2xl border-2 border-gray-100 bg-white text-lg font-semibold text-gray-800 hover:border-[var(--color-primary-dark)] hover:shadow-md transition-all ml-4 active:scale-[0.98]">
                      {svc.name}
                      <span className="block text-base font-normal text-gray-400 mt-1">{svc.duration_minutes} min</span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
            {services.filter((s) => !promos.some((p) => p.service_ids.includes(s.id))).map((s) => (
              <button key={s.id} onClick={() => handleServiceSelect(s)}
                className="w-full text-left p-6 rounded-2xl border-2 border-gray-100 bg-white text-xl font-semibold text-gray-800 hover:border-[var(--color-primary-dark)] hover:shadow-md transition-all active:scale-[0.98]">
                {s.name}
                <span className="block text-base font-normal text-gray-400 mt-1">{s.duration_minutes} min</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modalidad */}
      {step === 1 && selectedService && (
        <div className="space-y-4">
          <p className="text-3xl font-bold text-gray-800 text-center mb-6">¿Online o presencial?</p>
          <div className="space-y-3">
            {(selectedService.allowed_modalities || ["online", "presencial"]).map((m) => (
              <button key={m} onClick={() => handleModalitySelect(m)}
                className="w-full p-6 rounded-2xl border-2 border-gray-100 bg-white text-xl font-semibold text-gray-800 hover:border-[var(--color-primary-dark)] hover:shadow-md transition-all active:scale-[0.98]">
                {m === "online" ? "💻 Online" : "🏠 Presencial"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fecha */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-3xl font-bold text-gray-800 text-center mb-4">Elegí el día</p>
          <div className="flex justify-center [&_.rdp]:scale-125 [&_.rdp]:origin-top">
            <DayPicker
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(date) => { if (date && isDayAvailable(date)) handleDateSelect(date); }}
              month={month}
              onMonthChange={setMonth}
              locale={es}
              disabled={(date) => date < new Date(new Date().toDateString()) || !isDayAvailable(date)}
              modifiersStyles={{
                today: { fontWeight: "bold", color: "var(--color-primary-dark)" },
              }}
              styles={{
                caption: { color: "var(--color-text-main)", fontWeight: "bold", fontSize: "1.2rem" },
                head_cell: { color: "var(--color-text-light)", fontSize: "1rem", fontWeight: 600 },
                day: { fontSize: "1.1rem", padding: "8px", cursor: "pointer" },
                day_disabled: { color: "#d1d5db", cursor: "not-allowed", opacity: 1 },
                day_selected: { backgroundColor: "var(--color-terracotta)", color: "#fff", borderRadius: "50%", fontSize: "1.1rem" },
                day_today: { fontWeight: "bold" },
              }}
              fromDate={new Date()}
            />
          </div>
          {loadingDates && <p className="text-center text-gray-400">Cargando...</p>}
          {!loadingDates && availableDates.size === 0 && (
            <p className="text-center text-xl text-gray-400 py-8">No hay días disponibles este mes</p>
          )}
        </div>
      )}

      {/* Horario */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-3xl font-bold text-gray-800 text-center mb-2">Elegí el horario</p>
          <p className="text-xl text-gray-400 text-center mb-4">
            {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </p>
          {loadingSlots && <p className="text-center text-xl text-gray-400">Cargando horarios...</p>}
          {!loadingSlots && slots.length === 0 && (
            <p className="text-center text-xl text-gray-400 py-8">No hay horarios disponibles</p>
          )}
          {!loadingSlots && slots.length > 0 && (
            <div className="space-y-3">
              {slots.map((slot) => (
                <button key={slot.rule_id + slot.slot_start} onClick={() => handleSlotSelect(slot)}
                  className="w-full p-5 rounded-2xl border-2 border-gray-100 bg-white text-center hover:border-[var(--color-primary-dark)] hover:shadow-md transition-all active:scale-[0.98]">
                  <span className="text-2xl font-bold text-gray-800">{startLabel(slot)}</span>
                  <span className="text-xl text-gray-400 ml-2">- {endLabel(slot)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmar */}
      {step === 4 && selectedService && selectedModality && selectedDate && selectedSlot && (
        <div className="space-y-6">
          <p className="text-3xl font-bold text-gray-800 text-center">Confirmar reserva</p>
          <div className="bg-white rounded-3xl border-2 border-gray-100 p-6 space-y-4 text-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Servicio</span>
              <span className="font-bold text-gray-800">{selectedService.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Modalidad</span>
              <span className="font-bold text-gray-800 capitalize">{selectedModality}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Duración</span>
              <span className="font-bold text-gray-800">{selectedService.duration_minutes} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Día</span>
              <span className="font-bold text-gray-800">{format(selectedDate, "EEEE d/M", { locale: es })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Horario</span>
              <span className="font-bold text-gray-800">{startLabel(selectedSlot)} - {endLabel(selectedSlot)}</span>
            </div>
            {priceCents > 0 && (
              <div className="flex justify-between items-center pt-2 border-t-2 border-gray-100">
                <span className="text-gray-400">Total</span>
                <span className="text-2xl font-bold text-[var(--color-terracotta)]">{formatPrice(priceCents)}</span>
              </div>
            )}
          </div>
          {bookingError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-lg text-center">{bookingError}</div>
          )}
          <button onClick={handleConfirm} disabled={bookingLoading}
            className="w-full py-5 rounded-2xl text-xl font-bold text-white bg-[var(--color-terracotta)] hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98]">
            {bookingLoading ? "Reservando..." : priceCents > 0 ? `Pagar ${formatPrice(priceCents)}` : "Confirmar reserva"}
          </button>
        </div>
      )}
    </div>
  );
}
