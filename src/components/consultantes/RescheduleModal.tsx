"use client";

import React, { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { rescheduleAppointment } from "@/actions/appointments";
import { motion, AnimatePresence } from "framer-motion";
import type { Slot } from "@/types/appointments";

interface RescheduleModalProps {
  appointmentId: string;
  currentDate: string;
  currentSlotStart?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RescheduleModal({
  appointmentId,
  currentDate,
  currentSlotStart,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const [step, setStep] = useState<"date" | "time" | "confirm">("date");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(currentDate));
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSelectedSlot(null);

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    fetch(`/api/availability?date=${dateStr}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          const slots: Slot[] = json.data || [];
          setAvailableSlots(currentSlotStart ? slots.filter((s) => s.slot_start !== currentSlotStart) : slots);
          setLoadingSlots(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableSlots([]);
          setLoadingSlots(false);
        }
      });

    return () => { cancelled = true; };
  }, [selectedDate]);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setError(null);

    const result = await rescheduleAppointment({
      appointmentId,
      newStartTime: selectedSlot.slot_start,
    });

    setSubmitting(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "Error al reprogramar");
    }
  };

  const minDate = new Date();
  const maxDate = addDays(new Date(), 60);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Reprogramar Cita</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {step === "date" && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Seleccioná una nueva fecha
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                  {Array.from({ length: 30 }, (_, i) => {
                    const d = addDays(minDate, i);
                    if (d > maxDate) return null;
                    const isSelected =
                      format(d, "yyyy-MM-dd") ===
                      format(selectedDate, "yyyy-MM-dd");
                    const isToday =
                      format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedDate(d);
                          setStep("time");
                        }}
                        className={`p-3 rounded-xl text-center text-sm transition-all border
                          ${
                            isSelected
                              ? "bg-pink-600 text-white border-pink-600"
                              : "bg-gray-50 text-gray-700 border-gray-100 hover:border-pink-200 hover:bg-pink-50"
                          }`}
                      >
                        <div className="font-bold">
                          {format(d, "dd")}
                        </div>
                        <div className="text-[10px] opacity-70">
                          {isToday
                            ? "Hoy"
                            : format(d, "EEE", { locale: es })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === "time" && (
              <div className="space-y-4">
                <button
                  onClick={() => setStep("date")}
                  className="text-sm text-pink-600 hover:text-pink-700 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    arrow_back
                  </span>
                  Volver a fechas
                </button>
                <p className="text-sm text-gray-700 font-medium">
                  Horarios disponibles para{" "}
                  <span className="font-bold">
                    {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                  </span>
                </p>

                {loadingSlots ? (
                  <div className="space-y-2 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-gray-50 rounded-lg" />
                    ))}
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.slot_start}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setStep("confirm");
                        }}
                        disabled={loadingSlots}
                        className="px-3 py-2 text-sm font-medium text-pink-700 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors border border-pink-100"
                      >
                        {format(new Date(slot.slot_start), "HH:mm")} hs
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    No hay horarios disponibles para este día.
                  </p>
                )}
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-green-600 text-3xl">
                    event_repeat
                  </span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Nueva fecha y horario:</p>
                  <p className="text-xl font-bold text-gray-900">
                    {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-2xl font-bold text-pink-600">
                    {selectedSlot ? format(new Date(selectedSlot.slot_start), "HH:mm") : ""} hs
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("time")}
                    disabled={submitting}
                    className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
                  >
                    Cambiar horario
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-3 text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-xl transition-all disabled:opacity-50"
                  >
                    {submitting ? "Reprogramando..." : "Confirmar cambio"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
