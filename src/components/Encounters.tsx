"use client";
import React, { useState } from "react";
import Image from "next/image";

const encounters = [
  {
    title: "Yoga en Familia",
    subtitle: "Compartí un momento consciente",
    image: "/images/family_yoga.png",
    description:
      "Encuentros pensados para compartir un espacio de conexión, movimiento y presencia entre grandes y chicos, fortaleciendo el vínculo y el bienestar emocional.",
  },
  {
    title: "Yoga para Niños",
    subtitle: "Movimiento, juego y calma",
    image: "/images/kids_yoga.png",
    description:
      "Clases adaptadas a la infancia que promueven el juego, la conciencia corporal, la respiración y la gestión emocional, respetando los tiempos y necesidades de cada niño.",
  },
  {
    title: "Rito del Útero y Linaje Femenino",
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

export default function Encounters() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="encuentros" className="py-16 md:py-24 bg-background-alt/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-medium text-text-main mb-4">
            Encuentros
          </h2>
          <p className="text-text-light max-w-2xl mx-auto italic mb-6">
            "Espacios grupales diseñados para la conexión comunitaria y el
            crecimiento compartido."
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-text-main font-medium text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">
              check_circle
            </span>
            Modalidad Online / Presencial
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {encounters.map((item, i) => (
            <div
              key={i}
              className="group relative h-[500px] overflow-hidden rounded-[2.5rem] shadow-xl transition-all duration-500 hover:shadow-2xl cursor-pointer"
              onClick={() => setActive(active === i ? null : i)}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Overlay Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-t from-text-main/95 via-text-main/40 to-transparent transition-all duration-500 ${active === i ? "opacity-100" : "opacity-80 group-hover:opacity-90"}`}
              />

              {/* Content Container */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <div
                  className={`transition-all duration-500 ${active === i ? "mb-4" : "mb-0"}`}
                >
                  <p className="text-primary-dark font-bold text-xs uppercase tracking-widest mb-2">
                    {item.subtitle}
                  </p>
                  <h3 className="font-display text-2xl font-bold leading-tight">
                    {item.title}
                  </h3>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-700 ease-in-out ${active === i ? "max-h-60 opacity-100 mb-6" : "max-h-0 opacity-0"}`}
                >
                  <p className="text-sm text-gray-200 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-primary-dark font-bold text-xs uppercase tracking-tighter">
                  <span>{active === i ? "VER MENOS" : "SABER MÁS"}</span>
                  <span
                    className={`material-symbols-outlined text-sm transition-transform duration-500 ${active === i ? "rotate-180" : "group-hover:translate-x-1"}`}
                  >
                    {active === i ? "expand_less" : "arrow_forward"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
