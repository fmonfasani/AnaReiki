"use client";

import React, { useState } from "react";
import { format, parseISO, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cancelAppointment } from "@/actions/appointments";
import Link from "next/link";

interface Appointment {
    id: string;
    start_time: string;
    end_time: string;
    status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
    notes: string | null;
    services: {
        name: string;
        duration_minutes: number;
    };
}

interface MisCitasClientProps {
    initialAppointments: Appointment[];
}

export default function MisCitasClient({ initialAppointments }: MisCitasClientProps) {
    const [appointments, setAppointments] = useState(initialAppointments);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleCancel = async (id: string) => {
        if (!confirm("¿Estás segura de que deseas cancelar esta cita?")) return;

        setLoadingId(id);
        const result = await cancelAppointment({ appointmentId: id });
        setLoadingId(null);

        if (result.success) {
            setAppointments((prev) =>
                prev.map((a) => (a.id === id ? { ...a, status: "cancelled" as const } : a))
            );
        } else {
            alert("Error al cancelar: " + result.error);
        }
    };

    const upcoming = appointments.filter(
        (a) => !isPast(parseISO(a.start_time)) && a.status !== "cancelled"
    );
    const past = appointments.filter(
        (a) => isPast(parseISO(a.start_time)) || a.status === "cancelled"
    );

    return (
        <div className="space-y-10">
            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 font-display">
                    <span className="material-symbols-outlined text-purple-600">schedule</span>
                    Próximas Sesiones
                </h2>

                {upcoming.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {upcoming.map((appt) => (
                                <motion.div
                                    key={appt.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">
                                                {appt.services?.name || "Sesión"}
                                            </span>
                                            <h3 className="text-lg font-bold text-gray-900 capitalize">
                                                {format(parseISO(appt.start_time), "EEEE d 'de' MMMM", { locale: es })}
                                            </h3>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${appt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {appt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-gray-500 text-sm mb-6">
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm text-gray-400">schedule</span>
                                            {format(parseISO(appt.start_time), "HH:mm")} hs
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm text-gray-400">hourglass_top</span>
                                            {appt.services?.duration_minutes} min
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleCancel(appt.id)}
                                            disabled={loadingId === appt.id}
                                            className="flex-1 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all disabled:opacity-50"
                                        >
                                            {loadingId === appt.id ? "Cancelando..." : "Cancelar Cita"}
                                        </button>
                                        {/* Placeholder for reschedule if implemented later */}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 mb-6">No tienes ninguna cita programada.</p>
                        <Link
                            href="/miembros/reservar"
                            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                            Reservar ahora
                        </Link>
                    </div>
                )}
            </section>

            {past.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 font-display opacity-60">
                        <span className="material-symbols-outlined">history</span>
                        Historial y Canceladas
                    </h2>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Servicio</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {past.slice(0, 5).map((appt) => (
                                        <tr key={appt.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900">
                                                    {format(parseISO(appt.start_time), "dd/MM/yyyy")}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {format(parseISO(appt.start_time), "HH:mm")} hs
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {appt.services?.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${appt.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                        appt.status === 'cancelled' ? 'bg-gray-100 text-gray-500 border border-gray-200' :
                                                            'bg-red-50 text-red-600 border border-red-100'
                                                    }`}>
                                                    {appt.status === 'completed' ? 'Completada' :
                                                        appt.status === 'cancelled' ? 'Cancelada' : 'No asistió'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
