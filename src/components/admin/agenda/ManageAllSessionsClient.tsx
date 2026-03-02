"use client";

import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { adminManageAppointment } from "@/actions/appointments";

interface ManageAllSessionsClientProps {
    initialAppointments: any[];
}

export default function ManageAllSessionsClient({ initialAppointments }: ManageAllSessionsClientProps) {
    const [appointments, setAppointments] = useState(initialAppointments);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("all");

    const filtered = appointments.filter(a => {
        if (activeFilter === "all") return true;
        return a.status === activeFilter;
    });

    const handleUpdateStatus = async (id: string, status: string) => {
        setLoadingId(id);
        const result = await adminManageAppointment({ appointmentId: id, status });
        setLoadingId(null);

        if (result.success) {
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        } else {
            alert("Error: " + result.error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 p-1 bg-gray-100/50 rounded-2xl w-fit border border-gray-100">
                {[
                    { id: "all", label: "Todos", icon: "list" },
                    { id: "pending", label: "Pendientes", icon: "pending" },
                    { id: "confirmed", label: "Confirmados", icon: "check_circle" },
                    { id: "cancelled", label: "Cancelados", icon: "cancel" },
                    { id: "completed", label: "Completados", icon: "task_alt" }
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setActiveFilter(f.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeFilter === f.id
                                ? "bg-white text-pink-700 shadow-sm border border-pink-100"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Sessions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filtered.map((appt) => (
                        <motion.div
                            key={appt.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                        >
                            {/* Client Info Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm">
                                    {appt.profiles?.full_name?.[0] || 'U'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 truncate max-w-[150px]">
                                        {appt.profiles?.full_name || 'Desconocido'}
                                    </h4>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                        {appt.services?.name}
                                    </p>
                                </div>
                            </div>

                            {/* Time Details */}
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="material-symbols-outlined text-gray-400">calendar_today</span>
                                    {format(parseISO(appt.start_time), "PPP", { locale: es })}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="material-symbols-outlined text-gray-400">schedule</span>
                                    {format(parseISO(appt.start_time), "HH:mm")} hs
                                </div>
                            </div>

                            {/* Status & Actions Box */}
                            <div className="pt-4 border-t border-gray-50 flex flex-col gap-3">
                                <div className="flex justify-between items-center px-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${appt.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100' :
                                            appt.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                'bg-gray-50 text-gray-500 border-gray-200'
                                        }`}>
                                        {appt.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                                        disabled={loadingId === appt.id || appt.status === 'confirmed'}
                                        className="flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-xl transition-all disabled:opacity-30"
                                    >
                                        Confirmar
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(appt.id, 'completed')}
                                        disabled={loadingId === appt.id || appt.status === 'completed'}
                                        className="flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl transition-all disabled:opacity-30"
                                    >
                                        Marcar Completado
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                                        disabled={loadingId === appt.id || appt.status === 'cancelled'}
                                        className="flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold bg-red-50 text-red-700 hover:bg-red-600 hover:text-white rounded-xl transition-all disabled:opacity-30"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(appt.id, 'no_show')}
                                        disabled={loadingId === appt.id || appt.status === 'no_show'}
                                        className="flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold bg-gray-50 text-gray-700 hover:bg-gray-800 hover:text-white rounded-xl transition-all disabled:opacity-30"
                                    >
                                        No asistió
                                    </button>
                                </div>
                            </div>

                            {loadingId === appt.id && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all">
                                    <span className="material-symbols-outlined animate-spin text-pink-600">refresh</span>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filtered.length === 0 && (
                <div className="py-24 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-200 mb-2">event_busy</span>
                    <p className="text-gray-400 font-medium italic">No hay registros para este filtro.</p>
                </div>
            )}
        </div>
    );
}
