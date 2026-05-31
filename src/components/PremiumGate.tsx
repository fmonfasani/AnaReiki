"use client";

import Link from "next/link";

interface PremiumGateProps {
  isPremium: boolean;
  children: React.ReactNode;
}

export default function PremiumGate({ isPremium, children }: PremiumGateProps) {
  if (isPremium) return <>{children}</>;

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl">
        <div className="bg-white/95 backdrop-blur p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4 border border-gray-100">
          <span className="text-5xl block mb-4">🔒</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Contenido Premium
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Este contenido es exclusivo para consultantes premium. Actualizá tu
            plan para acceder.
          </p>
          <Link
            href="/consultantes/perfil"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <span className="material-symbols-outlined">diamond</span>
            Volverse Premium
          </Link>
        </div>
      </div>
    </div>
  );
}
