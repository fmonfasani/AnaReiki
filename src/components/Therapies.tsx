"use client";
import React, { useState } from "react";
import Image from "next/image";

const therapies = [
  {
    title: "Lectura de Registros Akáshicos",
    subtitle: "Accedé a la guía de tu alma",
    image: "/images/akashic.png",
    description:
      "Los Registros Akáshicos son una herramienta de acceso a la información del alma. A través de su apertura, se obtiene guía, claridad y comprensión sobre situaciones de la vida presente, vínculos, bloqueos emocionales y procesos personales, facilitando la toma de conciencia y la sanación.",
  },
  {
    title: "Sesión Biodecodificación",
    subtitle: "Comprendé el origen emocional",
    image: "/images/bioenergy.png",
    description:
      "La Biodecodificación acompaña a reconocer el origen emocional de síntomas físicos, enfermedades o conflictos recurrentes. Mediante la observación consciente, se genera comprensión y transformación, favoreciendo el equilibrio entre cuerpo, mente y emoción.",
  },
  {
    title: "Sesión Reiki",
    subtitle: "Armonizá cuerpo, mente y energía",
    image: "/images/hero.png",
    description:
      "El Reiki es una terapia energética que canaliza energía vital universal para armonizar cuerpo, mente y espíritu. Durante la sesión se promueve la relajación profunda, la liberación de tensiones y el restablecimiento del bienestar integral.",
  },
  {
    title: "Armonización de chakras con péndulo",
    subtitle: "Equilibrá tu energía vital",
    image: "/images/pendulum.png",
    description:
      "La armonización de chakras con péndulo trabaja sobre los centros energéticos del cuerpo, detectando y liberando bloqueos. Este proceso ayuda a restaurar el flujo natural de la energía, aportando equilibrio, claridad y vitalidad.",
  },
  {
    title: "Ejercicios de Tapping",
    subtitle: "Liberá emociones y tensiones",
    image: "/images/tapping.png",
    description:
      "El Tapping o EFT (Emotional Freedom Techniques) es una técnica de liberación emocional que combina estimulación suave de puntos energéticos con enfoque consciente en emociones, pensamientos o situaciones que generan malestar. Ayuda a reducir el estrés, la ansiedad y bloqueos emocionales.",
  },
  {
    title: "Consultas por encuentros",
    subtitle: "Espacios de consulta personalizada",
    image: "/images/consultation.png",
    description:
      "Espacios individuales diseñados para profundizar en temas específicos a través de un abordaje holístico, brindando herramientas concretas para el proceso personal.",
  },
  {
    title: "Clases de yoga para niños",
    subtitle: "Movimiento, juego y calma",
    image: "/images/kids_yoga.png",
    description:
      "Clases adaptadas a la infancia que promueven el juego, la conciencia corporal, la respiración y la gestión emocional, respetando los tiempos y necesidades de cada niño.",
  },
  {
    title: "Rito y sanación de útero y linaje femenino",
    subtitle: "Honrá tu linaje femenino",
    image: "/images/womb_healing.png",
    description:
      "Ceremonias de encuentro y sanación que invitan a honrar el cuerpo, la energía femenina y el linaje ancestral, generando espacios de contención, liberación y transformación.",
  },
  {
    title: "Celebraciones Holísticas",
    subtitle: "Celebrar con presencia",
    image: "/images/holistic_celebration.png",
    description:
      "Propuestas de encuentros conscientes para celebrar momentos importantes de la vida desde una mirada integral, espiritual y amorosa (cumpleaños, bautismos, bendición del camino por el niño/a por nacer).",
  },
];

export default function Therapies() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section id="terapias" className="py-16 md:py-24 bg-[#1b1214]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-display text-4xl md:text-5xl font-medium mb-16 text-white leading-tight">
          Servicios
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          {therapies.map((item, i) => (
            <div
              key={i}
              className="group bg-white/5 rounded-[2rem] overflow-hidden shadow-lg border border-white/10 transition-all hover:-translate-y-2 active:scale-[0.98] cursor-pointer flex flex-col h-full hover:bg-white/10"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="aspect-square relative overflow-hidden shrink-0">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="p-8 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-2xl font-bold mb-2 text-white">
                    {item.title}
                  </h3>
                  <p className="text-primary-dark font-bold text-xs uppercase tracking-widest mb-4">
                    {item.subtitle}
                  </p>
                  <div
                    className={`overflow-hidden transition-all duration-500 ${expanded === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <p className="text-white/80 text-sm leading-relaxed text-left">
                      {item.description}
                    </p>
                  </div>
                </div>
                <button className="mt-6 flex items-center gap-1 text-primary-dark font-bold text-xs uppercase tracking-tighter mx-auto hover:text-white transition-colors">
                  {expanded === i ? "Ver menos" : "Saber más"}
                  <span
                    className={`material-symbols-outlined text-sm transition-transform ${expanded === i ? "rotate-180" : ""}`}
                  >
                    expand_more
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
