import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MisCitasClient from "@/components/miembros/MisCitasClient";
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

    // Fetch all appointments for this user with service details
    const { data: appointments, error } = await supabase
        .from("appointments")
        .select(`
      *,
      services (
        name,
        duration_minutes
      )
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
                        href="/miembros"
                        className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1 group"
                    >
                        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">
                            arrow_back
                        </span>
                        Volver al Inicio
                    </Link>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-display">
                        Mis Citas 📅
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl">
                        Gestiona tus próximas sesiones o descarga el historial de tus procesos
                        de sanación.
                    </p>
                </div>

                <Link
                    href="/miembros/reservar"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl transition-all shadow-lg shadow-purple-100 group"
                >
                    <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">
                        add_circle
                    </span>
                    Nueva Reserva
                </Link>
            </header>

            <MisCitasClient initialAppointments={appointments || []} />
        </div>
    );
}
