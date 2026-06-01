import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookingWizard from "./BookingWizard";

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
          Reserva tu Sesión
        </h1>
        <p className="text-gray-500">
          Elegí el servicio, la modalidad y el horario que mejor se adapte a ti.
        </p>
      </header>

      <BookingWizard />
    </div>
  );
}
