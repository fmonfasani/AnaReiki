"use client";

import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface PendingAppointmentsProps {
    appointments: any[];
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}

export default function PendingAppointments({ appointments: initialAppointments }: PendingAppointmentsProps) {
    const [appointments, setAppointments] = useState(initialAppointments);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<string | null>(null);

    const pendingConfirmation = appointments.filter(a => a.status === 'pending_confirmation');

    const handleApprove = async (id: string) => {
        setLoadingId(id);
        try {
            const res = await fetch("/api/appointments/approve", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointment_id: id }),
            });
            const json = await res.json();
            if (res.ok) {
                setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
            } else {
                alert("Error: " + (json.error || "desconocido"));
            }
        } catch {
            alert("Error de conexión");
        } finally {
            setLoadingId(null);
        }
    };

    const handleRejectWithAction = async (id: string, action: "reschedule" | "refund") => {
        setLoadingId(id);
        setRejectModal(null);
        try {
            const res = await fetch("/api/appointments/reject", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointment_id: id, action }),
            });
            const json = await res.json();
            if (res.ok) {
                setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled', rejection_action: action } : a));
            } else {
                alert("Error: " + (json.error || "desconocido"));
            }
        } catch {
            alert("Error de conexión");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-8">
            {pendingConfirmation.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-pink-600">how_to_reg</span>
                        Pendientes de confirmación
                        <span className="bg-pink-600 text-white text-xs px-2 py-0.5 rounded-full">{pendingConfirmation.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                            {pendingConfirmation.map((appt) => (
                                <motion.div key={appt.id} layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-amber-300 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-lg shadow-inner">
                                            {appt.profiles?.full_name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">
                                                {appt.profiles?.full_name || 'Usuario desconocido'}
                                            </h4>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span>{appt.services?.name || 'Servicio'}</span>
                                                <span>•</span>
                                                <span>{format(parseISO(appt.start_time), "PPP", { locale: es })}</span>
                                                <span>•</span>
                                                <span>{format(parseISO(appt.start_time), "HH:mm")} hs</span>
                                            </div>
                                            {(appt.deposit_cents || appt.balance_cents) ? (
                                                <div className="flex gap-2 mt-1 text-xs text-gray-400">
                                                    {appt.deposit_cents ? <span>Seña pagada: {formatPrice(appt.deposit_cents)}</span> : null}
                                                    {appt.balance_cents ? <span>• Saldo restante: {formatPrice(appt.balance_cents)}</span> : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleApprove(appt.id)} disabled={loadingId === appt.id}
                                            className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-green-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                            {loadingId === appt.id ? (
                                                <span className="animate-spin material-symbols-outlined text-sm">refresh</span>
                                            ) : <span className="material-symbols-outlined text-sm">check_circle</span>}
                                            Aprobar
                                        </button>
                                        <button onClick={() => setRejectModal(appt.id)} disabled={loadingId === appt.id}
                                            className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-sm">cancel</span>
                                            Rechazar
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {rejectModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Rechazar reserva</h3>
                        <p className="text-sm text-gray-500 mb-4">¿Qué opción le ofrecemos al consultante?</p>
                        <div className="space-y-3">
                            <button onClick={() => handleRejectWithAction(rejectModal, "reschedule")} disabled={loadingId === rejectModal}
                                className="w-full p-3 rounded-xl border border-blue-200 hover:bg-blue-50 text-left transition-colors disabled:opacity-50">
                                <span className="font-semibold text-blue-700">🔄 Sugerir reprogramar</span>
                                <p className="text-xs text-gray-500 mt-1">El consultante elige nueva fecha, sin cambios económicos.</p>
                            </button>
                            <button onClick={() => handleRejectWithAction(rejectModal, "refund")} disabled={loadingId === rejectModal}
                                className="w-full p-3 rounded-xl border border-red-200 hover:bg-red-50 text-left transition-colors disabled:opacity-50">
                                <span className="font-semibold text-red-700">💸 Devolver dinero</span>
                                <p className="text-xs text-gray-500 mt-1">Cancelar turno y devolver el depósito (fuera del sistema).</p>
                            </button>
                        </div>
                        <button onClick={() => setRejectModal(null)} className="w-full mt-4 p-2 text-sm text-gray-400 hover:text-gray-600">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {pendingConfirmation.length === 0 && (
                <div className="bg-white rounded-3xl p-16 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 text-2xl">✨</div>
                    <h3 className="text-xl font-bold text-gray-900">¡Agenda al día!</h3>
                    <p className="text-gray-500 max-w-xs">No tienes solicitudes pendientes de confirmación.</p>
                </div>
            )}
        </div>
    );
}
