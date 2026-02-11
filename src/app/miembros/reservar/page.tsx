"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BookingCalendar from "@/components/BookingCalendar";

export default function ReservarPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  if (!userId)
    return <div className="p-8 text-center text-gray-400">Cargando...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Reserva tu Sesión 📅
        </h1>
        <p className="text-gray-500">
          Elige el horario que mejor se adapte a ti para nuestra próxima sesión
          de Reiki o Yoga.
        </p>
      </header>

      <BookingCalendar userId={userId} />

      <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100 flex items-start gap-4">
        <span className="material-symbols-outlined text-pink-600 text-3xl">
          info
        </span>
        <div>
          <h4 className="font-bold text-gray-900 mb-1">
            Información Importante
          </h4>
          <p className="text-sm text-gray-600">
            Todas las sesiones duran 60 minutos. Te recomendamos conectarte 5
            minutos antes para preparar tu espacio. Si necesitas cancelar, por
            favor hazlo con 24hs de anticipación desde tu panel de usuario.
          </p>
        </div>
      </div>
    </div>
  );
}
