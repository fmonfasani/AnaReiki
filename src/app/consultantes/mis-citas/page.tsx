import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MisCitasClient from "@/components/consultantes/MisCitasClient";
import Link from "next/link";

export const metadata = {
    title: "Mis Citas | Ana Reiki",
    description: "Gestiona tus próximas sesiones y mantén el control de tu bienestar.",
};

export default async function MisCitasPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: appointments, error } = await supabase
        .from("appointments")
        .select(`
      *,
      services (id, name, slug, duration_minutes, allowed_modalities),
      availability_slots (id, slot_date, start_time, end_time, modality)
    `)
        .eq("client_id", user.id)
        .order("start_time", { ascending: false });

    if (error) {
        console.error("Error fetching appointments:", error);
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="space-y-2">
                    <Link
                        href="/consultantes"
                        className="text-sm font-bold text-[var(--color-primary-dark)] hover:opacity-80 transition-colors flex items-center gap-1 group"
                    >
                        ← Volver al Inicio
                    </Link>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-display">
                        Mis Citas
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl">
                        Gestioná tus próximas sesiones y revisá tu historial.
                    </p>
                </div>

                <Link
                    href="/consultantes/reservar"
                    className="inline-flex items-center gap-2 bg-[var(--color-terracotta)] text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg group"
                >
                    + Nueva Reserva
                </Link>
            </header>

            <MisCitasClient initialAppointments={appointments || []} />
        </div>
    );
}
