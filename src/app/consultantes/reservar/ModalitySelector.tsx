"use client";

import React from "react";

type Props = {
  allowedModalities: string[];
  selected: string | null;
  onSelect: (modality: string) => void;
};

export default function ModalitySelector({ allowedModalities, selected, onSelect }: Props) {
  const modalityOptions = [
    {
      value: "online",
      label: "Online",
      description: "Zoom / Google Meet",
      icon: "💻",
    },
    {
      value: "presencial",
      label: "Presencial",
      description: "En el lugar",
      icon: "🏠",
    },
  ];

  const available = modalityOptions.filter((m) =>
    allowedModalities.includes(m.value),
  );

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-text-main)] font-display">
          ¿Cómo preferís tomar la sesión?
        </h2>
        <p className="text-[var(--color-text-light)] mt-1">
          Elegí la modalidad que más te convenga
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
        {available.map((modality) => (
          <button
            key={modality.value}
            onClick={() => onSelect(modality.value)}
            className={`flex flex-col items-center p-8 rounded-2xl border-2 transition-all duration-200 ${
              selected === modality.value
                ? "border-[var(--color-primary-dark)] bg-[var(--color-primary)]/20 shadow-md scale-[1.02]"
                : "border-gray-100 bg-white hover:border-[var(--color-primary)] hover:shadow-sm"
            }`}
          >
            <span className="text-4xl mb-3">{modality.icon}</span>
            <h3 className="font-semibold text-[var(--color-text-main)]">
              {modality.label}
            </h3>
            <p className="text-xs text-[var(--color-text-light)] mt-1">
              {modality.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
