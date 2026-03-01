"use client";

import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { adminConfirmAppointment, cancelAppointment } from "@/actions/appointments";

interface PendingAppointmentsProps {
    appointments: any[];
}

export default function PendingAppointments({ appointments: initialAppointments }: PendingAppointmentsProps) {
    const [appointments, setAppointments] = useState(initialAppointments);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const pending = appointments.filter(a => a.status === 'pending');

    const handleConfirm = async (id: string) => {
        setLoadingId(id);
        const result = await adminConfirmAppointment({ appointmentId: id });
        setLoadingId(null);

        if (result.success) {
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
        } else {
            alert("Error al confirmar: " + result.error);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("¿Rechazar esta solicitud de cita?")) return;

        setLoadingId(id);
        const result = await cancelAppointment({ appointmentId: id, reason: "Rechazada por el administrador" });
        setLoadingId(null);

        if (result.success) {
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
        } else {
            alert("Error al rechazar: " + result.error);
        }
    };

    if (pending.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-16 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 text-2xl">
                    ✨
                </div>
                <h3 className="text-xl font-bold text-gray-900">¡Agenda al día!</h3>
                <p className="text-gray-500 max-w-xs">No tienes solicitudes pendientes de confirmación.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
                {pending.map((appt) => (
                    <motion.div
                        key={appt.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-pink-200 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-lg shadow-inner">
                                {appt.profiles?.full_name?.[0] || 'U'}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">
                                    {appt.profiles?.full_name || 'Usuario desconocido'}
                                </h4>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                                        {format(parseISO(appt.start_time), "PPP", { locale: es })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        {format(parseISO(appt.start_time), "HH:mm")} hs
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleConfirm(appt.id)}
                                disabled={loadingId === appt.id}
                                className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-green-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loadingId === appt.id ? (
                                    <span className="animate-spin material-symbols-outlined text-sm">refresh</span>
                                ) : (
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                )}
                                Confirmar
                            </button>

                            <button
                                onClick={() => handleReject(appt.id)}
                                disabled={loadingId === appt.id}
                                className="flex-1 md:flex-none text-gray-400 hover:text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all"
                                title="Rechazar"
                            >
                                <span className="material-symbols-outlined">cancel</span>
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
