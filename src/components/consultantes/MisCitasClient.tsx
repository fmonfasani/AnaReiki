"use client";

import React, { useState } from "react";
import { format, parseISO, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { cancelAppointment } from "@/actions/appointments";
import RescheduleModal from "./RescheduleModal";
import Link from "next/link";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}

interface Appointment {
    id: string;
    start_time: string;
    end_time: string;
    status: "pending_payment" | "pending_confirmation" | "confirmed" | "cancelled" | "completed";
    attendance_result?: "attended" | "no_show" | "rescheduled" | null;
    payment_status?: string;
    price_cents?: number;
    deposit_cents?: number;
    balance_cents?: number;
    notes: string | null;
    services: {
        name: string;
        duration_minutes: number;
    };
}

interface MisCitasClientProps {
    initialAppointments: Appointment[];
}

const statusLabel: Record<string, string> = {
    pending_payment: "Pendiente de pago",
    pending_confirmation: "Esperando confirmación",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    completed: "Completada",
};

const statusColor: Record<string, string> = {
    pending_payment: "bg-amber-100 text-amber-700",
    pending_confirmation: "bg-purple-100 text-purple-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
    completed: "bg-green-100 text-green-700",
};

export default function MisCitasClient({ initialAppointments }: MisCitasClientProps) {
    const [appointments, setAppointments] = useState(initialAppointments);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [reschedulingId, setReschedulingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");

    const upcoming = appointments.filter(
        (a) => !isPast(parseISO(a.start_time)) && a.status !== "cancelled"
    ).sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
    const past = appointments.filter(
        (a) => isPast(parseISO(a.start_time)) || a.status === "cancelled"
    ).sort((a, b) => parseISO(b.start_time).getTime() - parseISO(a.start_time).getTime());

    const visible = filter === "upcoming" ? upcoming : past;

    const handleRetryPayment = async (id: string) => {
        setLoadingId(id);
        try {
            const res = await fetch("/api/appointments/retry-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointmentId: id }),
            });
            const json = await res.json();
            if (json.mp_init_point) {
                window.location.href = json.mp_init_point;
            } else {
                alert("Error: " + (json.error || "No se pudo iniciar el pago"));
            }
        } catch {
            alert("Error de conexión");
        }
        setLoadingId(null);
    };

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

    return (
        <>
        <div className="space-y-6">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setFilter("upcoming")}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                        filter === "upcoming"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Por realizar ({upcoming.length})
                </button>
                <button
                    onClick={() => setFilter("past")}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                        filter === "past"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Realizados ({past.length})
                </button>
            </div>

            {visible.length === 0 ? (
                <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                    {filter === "upcoming" ? (
                        <>
                            <p className="text-gray-500 mb-6">No tenés ninguna cita programada.</p>
                            <Link
                                href="/consultantes/reservar"
                                className="inline-flex items-center gap-2 bg-[var(--color-terracotta)] text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
                            >
                                <span>+</span>
                                Reservar ahora
                            </Link>
                        </>
                    ) : (
                        <p className="text-gray-500">No tenés citas realizadas.</p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map((appt) => {
                        const apt = appt as Appointment & { modality?: string };
                        const fecha = parseISO(appt.start_time);
                        return (
                            <div
                                key={appt.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-[var(--color-primary-dark)] uppercase tracking-widest">
                                            {appt.services?.name || "Sesión"}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            statusColor[appt.status] || "bg-gray-100 text-gray-600"
                                        }`}>
                                            {statusLabel[appt.status] || appt.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-700">
                                        <span className="font-semibold">
                                            {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        <span>{format(fecha, "HH:mm")} hs</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="flex items-center gap-1">
                                            {apt.modality === "online" ? "💻" : "🏠"}
                                            {apt.modality === "online" ? "Online" : "Presencial"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    {appt.status === "pending_payment" && (
                                        <>
                                            <button
                                                onClick={() => handleRetryPayment(appt.id)}
                                                disabled={loadingId === appt.id}
                                                className="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all disabled:opacity-50"
                                            >
                                                {loadingId === appt.id ? "..." : `Pagar ${(appt.deposit_cents && appt.deposit_cents > 0) ? formatPrice(appt.deposit_cents) : (appt.price_cents ? formatPrice(appt.price_cents) : "")}`}
                                            </button>
                                            <button
                                                onClick={() => handleCancel(appt.id)}
                                                disabled={loadingId === appt.id}
                                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all disabled:opacity-50"
                                            >
                                                {loadingId === appt.id ? "..." : "Me arrepentí"}
                                            </button>
                                        </>
                                    )}

                                    {appt.status === "pending_confirmation" && (
                                        <span className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-xl border border-purple-200">
                                            Esperando confirmación del admin
                                        </span>
                                    )}

                                    {appt.status === "confirmed" && (appt.balance_cents || 0) > 0 && (
                                        <span className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                                            Saldo pendiente: {formatPrice(appt.balance_cents!)}
                                        </span>
                                    )}

                                    {filter === "upcoming" && appt.status !== "pending_payment" && appt.status !== "pending_confirmation" && (
                                        <>
                                            <button
                                                onClick={() => handleCancel(appt.id)}
                                                disabled={loadingId === appt.id}
                                                className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all disabled:opacity-50"
                                            >
                                                {loadingId === appt.id ? "..." : "Cancelar"}
                                            </button>
                                            <button
                                                onClick={() => setReschedulingId(appt.id)}
                                                className="px-4 py-2 text-sm font-bold text-[var(--color-terracotta)] hover:bg-orange-50 rounded-xl border border-transparent hover:border-orange-100 transition-all"
                                            >
                                                Reprogramar
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

            {reschedulingId && (
                <RescheduleModal
                    appointmentId={reschedulingId}
                    currentDate={appointments.find(a => a.id === reschedulingId)?.start_time || ""}
                    currentSlotStart={appointments.find(a => a.id === reschedulingId)?.start_time || undefined}
                    onClose={() => setReschedulingId(null)}
                    onSuccess={() => {
                        setReschedulingId(null);
                        setAppointments((prev) =>
                            prev.map((a) =>
                                a.id === reschedulingId ? { ...a, status: "confirmed" as const } : a
                            )
                        );
                    }}
                />
            )}
    </>
    );
}
