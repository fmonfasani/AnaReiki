import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookingCalendar from "@/components/BookingCalendar";

export default async function ReservarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

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

      <BookingCalendar />

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
