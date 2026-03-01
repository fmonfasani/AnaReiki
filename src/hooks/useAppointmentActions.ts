"use client";

import { useState } from "react";
import {
  createAppointment,
  cancelAppointment,
  rescheduleAppointment,
  adminConfirmAppointment,
} from "@/actions/appointments";

export function useAppointmentActions() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setError(null);
    setIsPending(true);
    try {
      return await fn();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return {
    isPending,
    error,
    setError,
    create: (input: {
      serviceId: string;
      consultantId: string;
      startTime: string;
      notes?: string;
    }) => run(() => createAppointment(input)),
    cancel: (input: { appointmentId: string; reason?: string }) =>
      run(() => cancelAppointment(input)),
    reschedule: (input: { appointmentId: string; newStartTime: string }) =>
      run(() => rescheduleAppointment(input)),
    confirmByAdmin: (input: { appointmentId: string }) =>
      run(() => adminConfirmAppointment(input)),
  };
}
