"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Slot } from "@/types/appointments";

type Service = { id: string; name: string; duration_minutes: number };

type Props = {
  service: Service;
  modality: string;
  date: Date;
  slot: Slot;
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

export default function BookingConfirm({
  service,
  modality,
  date,
  slot,
  onConfirm,
  loading,
  error,
}: Props) {
  const [notes, setNotes] = useState("");

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
            {service.duration_minutes} minutos
          </span>
        </div>

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

      <div className="flex justify-center">
        <button
          onClick={() => onConfirm(notes || undefined)}
          disabled={loading}
          className="px-8 py-3 bg-[var(--color-terracotta)] text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Reservando..." : "Confirmar Reserva"}
        </button>
      </div>
    </div>
  );
}
