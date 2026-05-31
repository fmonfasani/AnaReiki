"use client";

import { useState } from "react";
import Link from "next/link";

type NavItem = {
  id: string;
  name: string;
  href: string;
  icon: string;
  locked: boolean;
};

interface SidebarNavProps {
  items: NavItem[];
  planTier: string;
  mobile?: boolean;
}

const PLAN_UPGRADE: Record<string, string> = {
  biblioteca: "Shakti o Ananda",
  clases: "Shakti o Ananda",
  podcast: "Shakti o Ananda",
  mensajes: "Ananda",
  "chat-buda": "Ananda",
  evolucion: "Shakti o Ananda",
};

export default function SidebarNav({ items, planTier, mobile }: SidebarNavProps) {
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent, item: NavItem) => {
    if (!item.locked) return;
    e.preventDefault();
    setLockedMsg(
      `Necesitás el plan ${PLAN_UPGRADE[item.id] || "superior"} para acceder a ${item.name}.`
    );
    setTimeout(() => setLockedMsg(null), 3500);
  };

  if (mobile) {
    const item = items[0];
    if (!item) return null;
    return (
      <Link
        href={item.href}
        onClick={(e) => handleClick(e, item)}
        className={`flex flex-col items-center p-2 transition-colors relative ${
          item.locked ? "text-gray-300" : "text-gray-400 hover:text-pink-600"
        }`}
      >
        <span className="material-symbols-outlined text-2xl mb-0.5">
          {item.locked ? "lock" : item.icon}
        </span>
        <span className="text-[10px] font-medium">{item.name}</span>
      </Link>
    );
  }

  return (
    <>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          onClick={(e) => handleClick(e, item)}
          className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
            item.locked
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-pink-50 hover:text-pink-700"
          }`}
        >
          <span className="material-symbols-outlined mr-3 text-xl group-hover:scale-110 transition-transform">
            {item.locked ? "lock" : item.icon}
          </span>
          <span className="font-medium text-sm flex-1">{item.name}</span>
          {item.locked && (
            <span className="text-xs text-gray-400 font-medium">PRO</span>
          )}
        </Link>
      ))}
      {lockedMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-bounce">
          {lockedMsg}
          <div className="mt-2 text-center">
            <Link
              href="/consultantes/suscripciones"
              className="text-pink-300 underline text-xs font-semibold"
              onClick={() => setLockedMsg(null)}
            >
              Ver planes disponibles
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
