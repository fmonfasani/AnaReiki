"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { Slot } from "@/types/appointments";

type Props = {
  date: Date;
  modality: string;
  serviceId: string | null;
  selected: Slot | null;
  onSelect: (slot: Slot) => void;
};

export default function TimeSlots({ date, modality, serviceId, selected, onSelect }: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      const dateStr = format(date, "yyyy-MM-dd");
      const params = new URLSearchParams({ date: dateStr, modality });
      if (serviceId) params.set("service_id", serviceId);

      try {
        const res = await fetch(`/api/availability?${params}`);
        const json = await res.json();
        const available = (json.data || []).filter(
          (s: Slot) => s.booked < s.max_participants,
        );
        setSlots(available);
      } catch {
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [date, modality, serviceId]);

  const startLabel = (s: Slot) => {
    const d = new Date(s.slot_start);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const endLabel = (s: Slot) => {
    const d = new Date(s.slot_end);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-text-main)] font-display">
          Horarios disponibles
        </h2>
        <p className="text-[var(--color-text-light)] mt-1">
          {format(date, "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {loading && (
        <p className="text-center text-sm text-[var(--color-text-light)]">
          Cargando horarios...
        </p>
      )}

      {!loading && slots.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[var(--color-text-light)]">
            No hay horarios disponibles para esta fecha
          </p>
        </div>
      )}

      {!loading && slots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
          {slots.map((slot) => {
            const spotsLeft = slot.max_participants - slot.booked;
            return (
              <button
                key={slot.rule_id + slot.slot_start}
                onClick={() => onSelect(slot)}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                  selected?.slot_start === slot.slot_start
                    ? "border-[var(--color-primary-dark)] bg-[var(--color-primary)]/20 shadow-md"
                    : "border-gray-100 bg-white hover:border-[var(--color-primary)] hover:shadow-sm"
                }`}
              >
                <p className="font-semibold text-[var(--color-text-main)] text-lg">
                  {startLabel(slot)}
                </p>
                <p className="text-xs text-[var(--color-text-light)] mt-1">
                  {endLabel(slot)}
                </p>
                {spotsLeft <= 2 && (
                  <p className="text-xs text-[var(--color-terracotta)] mt-1 font-medium">
                    {spotsLeft} {spotsLeft === 1 ? "lugar" : "lugares"}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
