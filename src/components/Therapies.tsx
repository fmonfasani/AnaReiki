"use client";
import React, { useState } from "react";
import Image from "next/image";

import { SERVICES } from "@/data/services";

export default function Therapies() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section id="terapias" className="py-16 md:py-24 bg-[#1b1214]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-display text-4xl md:text-5xl font-medium mb-16 text-white leading-tight">
          Servicios
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          {SERVICES.map((item, i) => (
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
