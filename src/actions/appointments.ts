"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type ActionResult<T = unknown> = {
  success?: true;
  data?: T;
  error?: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function toIsoOrNull(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function revalidateAppointmentsViews() {
  revalidatePath("/consultantes");
  revalidatePath("/consultantes/reservar");
  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
}

export async function createAppointment(input: {
  serviceId: string;
  consultantId: string;
  startTime: string;
  notes?: string;
}): Promise<ActionResult> {
  if (!isUuid(input.serviceId) || !isUuid(input.consultantId)) {
    return { error: "Invalid identifiers" };
  }

  const startIso = toIsoOrNull(input.startTime);
  if (!startIso) {
    return { error: "Invalid start time" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data, error } = await supabase.rpc("create_appointment", {
    p_service_id: input.serviceId,
    p_consultant_id: input.consultantId,
    p_start_time: startIso,
    p_notes: input.notes?.trim() || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateAppointmentsViews();
  return { success: true, data };
}

export async function cancelAppointment(input: {
  appointmentId: string;
  reason?: string;
}): Promise<ActionResult> {
  if (!isUuid(input.appointmentId)) {
    return { error: "Invalid appointment id" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data, error } = await supabase.rpc("cancel_appointment", {
    p_appointment_id: input.appointmentId,
    p_reason: input.reason?.trim() || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateAppointmentsViews();
  return { success: true, data };
}

export async function rescheduleAppointment(input: {
  appointmentId: string;
  newStartTime: string;
}): Promise<ActionResult> {
  if (!isUuid(input.appointmentId)) {
    return { error: "Invalid appointment id" };
  }

  const newStartIso = toIsoOrNull(input.newStartTime);
  if (!newStartIso) {
    return { error: "Invalid start time" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const svc = createServiceClient();

  const { data: appointment, error: fetchError } = await svc
    .from("appointments")
    .select("id, client_id, service_id, start_time, status")
    .eq("id", input.appointmentId)
    .single();

  if (fetchError || !appointment) {
    return { error: "Turno no encontrado" };
  }

  if (appointment.client_id !== user.id) {
    return { error: "No autorizado" };
  }

  if (appointment.status === "cancelled") {
    return { error: "No se puede reprogramar un turno cancelado" };
  }

  if (new Date(appointment.start_time) <= new Date()) {
    return { error: "No se puede reprogramar un turno pasado" };
  }

  const { data: service } = await svc
    .from("services")
    .select("duration_minutes")
    .eq("id", appointment.service_id)
    .single();

  if (!service) {
    return { error: "Servicio no encontrado" };
  }

  const newEndTime = new Date(new Date(newStartIso).getTime() + service.duration_minutes * 60000).toISOString();

  const { error: updateError } = await svc
    .from("appointments")
    .update({
      slot_id: null,
      start_time: newStartIso,
      end_time: newEndTime,
    })
    .eq("id", input.appointmentId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidateAppointmentsViews();
  return { success: true };
}

export async function adminConfirmAppointment(input: {
  appointmentId: string;
}): Promise<ActionResult> {
  if (!isUuid(input.appointmentId)) {
    return { error: "Invalid appointment id" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data, error } = await supabase.rpc("admin_confirm_appointment", {
    p_appointment_id: input.appointmentId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateAppointmentsViews();
  return { success: true, data };
}
export async function adminManageAppointment(input: {
  appointmentId: string;
  status?: string;
  notes?: string;
  newStartTime?: string;
}): Promise<ActionResult> {
  if (!isUuid(input.appointmentId)) {
    return { error: "Invalid appointment id" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data, error } = await supabase.rpc("admin_manage_appointment", {
    p_appointment_id: input.appointmentId,
    p_status: input.status || null,
    p_notes: input.notes?.trim() || null,
    p_new_start_time: input.newStartTime ? toIsoOrNull(input.newStartTime) : null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateAppointmentsViews();
  return { success: true, data };
}
