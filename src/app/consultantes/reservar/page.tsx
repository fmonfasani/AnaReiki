"use client";

import React, { useState } from "react";
import BookingWizard from "./BookingWizard";
import SimpleBookingWizard from "./SimpleBookingWizard";

export default function ReservarPage() {
  const [simpleMode, setSimpleMode] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">
            Reserva tu Sesión
          </h1>
          <p className="text-gray-500 mt-1">
            {simpleMode
              ? "Modo simple: elegí día, horario y confirmá."
              : "Elegí el servicio, la modalidad y el horario que mejor se adapte a ti."}
          </p>
        </div>
        <button
          onClick={() => setSimpleMode((p) => !p)}
          className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border-2 ${
            simpleMode
              ? "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              : "bg-[var(--color-primary-dark)] text-white border-[var(--color-primary-dark)]"
          }`}
        >
          <span className="text-lg">👴</span>
          {simpleMode ? "Modo Completo" : "Modo Simple"}
        </button>
      </div>

      {simpleMode ? <SimpleBookingWizard /> : <BookingWizard />}
    </div>
  );
}
