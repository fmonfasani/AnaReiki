"use client";

import React, { useState } from "react";
import Link from "next/link";

const TIER_ORDER = ["prana", "shakti", "ananda"];

const PRACTICE_CARDS = [
  { id: "clases", href: "/consultantes/clases", emoji: "🧘‍♀️", bg: "bg-purple-100", text: "text-purple-600", title: "Clases de Yoga", desc: "Retoma tu última clase o explora nuevas secuencias.", tier: "ananda" as const },
  { id: "podcast", href: "/consultantes/podcast", emoji: "🎧", bg: "bg-pink-100", text: "text-pink-600", title: "Meditaciones", desc: "Escucha nuevos episodios y meditaciones guiadas.", tier: "shakti" as const },
  { id: "chat-buda", href: "/consultantes/chat-buda", emoji: "🪷", bg: "bg-amber-100", text: "text-amber-600", title: "Chat Buda", desc: "Conversá con Ana sobre tu proceso y emociones.", tier: "ananda" as const },
  { id: "evolucion", href: "/consultantes/evolucion", emoji: "🌿", bg: "bg-teal-100", text: "text-teal-600", title: "Mi Evolución", desc: "Revisa tu progreso y notas personales.", tier: "shakti" as const },
];

type Props = {
  planTier: string;
};

export default function PracticeCardsSection({ planTier }: Props) {
  const [showCards, setShowCards] = useState(false);
  const userLevel = TIER_ORDER.indexOf(planTier);
  const isLocked = (cardTier: string) => userLevel < TIER_ORDER.indexOf(cardTier);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-xl font-display">Continúa tu práctica</h3>
        <button
          onClick={() => setShowCards(!showCards)}
          className="md:hidden flex items-center gap-1 text-sm text-pink-600 font-medium hover:text-pink-700"
        >
          <span className="material-symbols-outlined text-lg">{showCards ? "expand_less" : "expand_more"}</span>
          {showCards ? "Ocultar" : "Ver práctica"}
        </button>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 ${showCards ? "" : "hidden md:grid"}`}>
        {PRACTICE_CARDS.map((card) => {
          const locked = isLocked(card.tier);
          const inner = (
            <div className={`group bg-white p-4 rounded-2xl shadow-sm border transition-all ${locked ? "border-gray-200 opacity-80" : "border-gray-100 hover:shadow-md hover:-translate-y-1"}`}>
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center ${card.text} text-xl mb-3 ${locked ? "" : "group-hover:scale-110 transition-transform"}`}>
                {card.emoji}
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm">{card.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">{card.desc}</p>
              {locked && (
                <div className="mt-2 flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 px-2 py-1 rounded-full w-fit shadow-sm hover:shadow-md transition-all">
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                  Suscribir
                </div>
              )}
            </div>
          );
          return locked ? (
            <Link key={card.id} href="/consultantes/suscripciones" className="block cursor-pointer">
              {inner}
            </Link>
          ) : (
            <Link key={card.id} href={card.href} className="block">
              {inner}
            </Link>
          );
        })}
      </div>
    </>
  );
}
