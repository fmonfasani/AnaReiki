"use client";

import React, { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import type { SlotDate } from "@/types/appointments";

type Props = {
  modality: string;
  serviceId: string | null;
  selected: Date | null;
  onSelect: (date: Date) => void;
};

export default function DatePicker({ modality, serviceId, selected, onSelect }: Props) {
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState<Date>(new Date());

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      const from = format(startOfMonth(month), "yyyy-MM-dd");
      const to = format(endOfMonth(month), "yyyy-MM-dd");

      const params = new URLSearchParams({ from, to, modality });
      if (serviceId) params.set("service_id", serviceId);

      try {
        const res = await fetch(`/api/availability?${params}`);
        const json = await res.json();
        const dates = new Set<string>((json.data || []).map((s: SlotDate) => s.slot_date));
        setAvailableDates(dates);
      } catch {
        setAvailableDates(new Set());
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [month, modality, serviceId]);

  const isDayAvailable = (date: Date) => {
    return availableDates.has(format(date, "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-text-main)] font-display">
          Elegí una fecha
        </h2>
        <p className="text-[var(--color-text-light)] mt-1">
          Los días resaltados tienen disponibilidad
        </p>
      </div>

      <div className="flex justify-center">
        <DayPicker
          mode="single"
          selected={selected || undefined}
          onSelect={(date) => { if (date) onSelect(date); }}
          month={month}
          onMonthChange={setMonth}
          locale={es}
          disabled={{ before: new Date() }}
          modifiers={{
            available: (date) => isDayAvailable(date),
          }}
          modifiersStyles={{
            available: {
              backgroundColor: "var(--color-primary)",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "50%",
            },
          }}
          styles={{
            caption: { color: "var(--color-text-main)", fontWeight: "bold" },
            head_cell: { color: "var(--color-text-light)", fontSize: "0.8rem" },
            day: { color: "var(--color-text-light)" },
            day_disabled: { color: "#d1d5db", cursor: "not-allowed", opacity: 1 },
          }}
        />
      </div>

      {loading && (
        <p className="text-center text-sm text-[var(--color-text-light)]">
          Cargando disponibilidad...
        </p>
      )}

      {selected && (
        <div className="text-center">
          <p className="text-sm text-[var(--color-text-main)]">
            Seleccionaste:{" "}
            <strong>{format(selected, "EEEE d 'de' MMMM", { locale: es })}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
