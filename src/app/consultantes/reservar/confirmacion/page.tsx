"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type PaymentStatus = "loading" | "success" | "failure" | "pending";

export default function ConfirmacionPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mpStatus = searchParams.get("status");
    const paymentId = searchParams.get("payment_id");

    if (mpStatus === "success" && paymentId) {
      fetch("/api/appointments/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.error) {
            setError(json.error);
            setStatus("failure");
          } else {
            setStatus("success");
          }
        })
        .catch(() => {
          setError("Error al verificar el pago");
          setStatus("failure");
        });
    } else if (mpStatus === "failure") {
      setStatus("failure");
      setError("El pago fue cancelado o rechazado.");
    } else if (mpStatus === "pending") {
      setStatus("pending");
    } else {
      setStatus("failure");
      setError("No se recibió información del pago.");
    }
  }, [searchParams]);

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center space-y-6">
        {status === "loading" && (
          <>
            <div className="text-5xl mb-4 animate-pulse">⏳</div>
            <h2 className="text-2xl font-bold text-[var(--color-text-main)] font-display">
              Verificando pago...
            </h2>
            <p className="text-[var(--color-text-light)]">
              Estamos confirmando tu pago con Mercado Pago.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[var(--color-text-main)] font-display">
              Pago confirmado
            </h2>
            <p className="text-[var(--color-text-light)]">
              Tu turno fue reservado con éxito. Te enviamos los detalles por email.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link
                href="/consultantes/mis-citas"
                className="px-6 py-3 bg-[var(--color-terracotta)] text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity"
              >
                Ir a Mis Citas
              </Link>
              <Link
                href="/consultantes"
                className="px-6 py-3 border-2 border-gray-200 text-[var(--color-text-main)] font-semibold rounded-2xl hover:border-[var(--color-primary)] transition-colors"
              >
                Volver al Inicio
              </Link>
            </div>
          </>
        )}

        {status === "failure" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-[var(--color-text-main)] font-display">
              Pago no completado
            </h2>
            <p className="text-[var(--color-text-light)]">
              {error || "El pago no pudo ser procesado."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link
                href="/consultantes/reservar"
                className="px-6 py-3 bg-[var(--color-terracotta)] text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity"
              >
                Intentar de nuevo
              </Link>
              <Link
                href="/consultantes"
                className="px-6 py-3 border-2 border-gray-200 text-[var(--color-text-main)] font-semibold rounded-2xl hover:border-[var(--color-primary)] transition-colors"
              >
                Volver al Inicio
              </Link>
            </div>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-[var(--color-text-main)] font-display">
              Pago pendiente
            </h2>
            <p className="text-[var(--color-text-light)]">
              Tu pago está siendo procesado. Te notificaremos cuando se confirme.
            </p>
            <Link
              href="/consultantes/mis-citas"
              className="inline-block px-6 py-3 bg-[var(--color-terracotta)] text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity mt-4"
            >
              Ir a Mis Citas
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
