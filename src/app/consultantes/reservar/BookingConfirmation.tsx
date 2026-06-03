"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Props = {
  service: { name: string; duration_minutes: number };
  modality: string;
  date: Date;
  slot: { slot_start: string; slot_end: string };
  appointmentId: string;
};

const startLabel = (s: { slot_start: string }) => {
  const d = new Date(s.slot_start);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const endLabel = (s: { slot_end: string }) => {
  const d = new Date(s.slot_end);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function BookingConfirmation({
  service,
  modality,
  date,
  slot,
  appointmentId,
}: Props) {
  const shortId = `#RE-${format(date, "yyyyMMdd")}-${appointmentId.slice(0, 4).toUpperCase()}`;

  return (
    <div className="text-center space-y-6">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] font-display">
        Reserva confirmada
      </h2>
      <p className="text-[var(--color-text-light)]">
        Te enviamos los detalles a tu email.
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3 max-w-sm mx-auto shadow-sm text-left">
        <div className="flex justify-between">
          <span className="text-sm text-[var(--color-text-light)]">Servicio</span>
          <span className="font-medium text-[var(--color-text-main)]">{service.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[var(--color-text-light)]">Modalidad</span>
          <span className="font-medium text-[var(--color-text-main)] capitalize">
            {modality === "online" ? "Online" : "Presencial"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[var(--color-text-light)]">Fecha</span>
          <span className="font-medium text-[var(--color-text-main)]">
            {format(date, "d/M/yyyy")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[var(--color-text-light)]">Horario</span>
          <span className="font-medium text-[var(--color-text-main)]">
            {startLabel(slot)} - {endLabel(slot)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[var(--color-text-light)]">Código</span>
          <span className="font-mono text-sm text-[var(--color-terracotta)]">{shortId}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/consultantes/mis-citas"
          className="px-6 py-3 bg-[var(--color-terracotta)] text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity text-center"
        >
          Ir a Mis Citas
        </Link>
        <Link
          href="/consultantes"
          className="px-6 py-3 border-2 border-gray-200 text-[var(--color-text-main)] font-semibold rounded-2xl hover:border-[var(--color-primary)] transition-colors text-center"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
