"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isAdminFromAppMetadata } from "@/lib/auth/roles";

export async function saveAvailability(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminFromAppMetadata(user)) {
    return { error: "No autorizado" };
  }

  const availabilityData = JSON.parse(formData.get("availability") as string);
  const sessionDuration = parseInt(formData.get("sessionDuration") as string);
  const bufferTime = parseInt(formData.get("bufferTime") as string) || 0;

  // 1. Update Profile with Session Duration & Buffer Time
  // We'll store it in metadata for now to avoid schema changes if not strictly necessary,
  // but ideally it should be a column. Let's try to update metadata.
  const { error: profileError } = await supabase.auth.updateUser({
    data: {
      session_duration: sessionDuration,
      buffer_time: bufferTime,
    },
  });

  if (profileError) {
    console.error("Error updating session settings:", profileError);
    return { error: "Error al guardar configuración de sesión" };
  }

  // 2. Clear existing RECURRING availability for this user in NEW table
  const { error: deleteError } = await supabase
    .from("availability_rules")
    .delete()
    .eq("consultant_id", user.id);

  if (deleteError) {
    console.error("Error deleting old availability rules:", deleteError);
    return {
      error: `Error al limpiar disponibilidad anterior: ${deleteError.message}`,
    };
  }

  // 3. Insert new availability into NEW table
  if (availabilityData.length > 0) {
    const rows = availabilityData.map((slot: any) => ({
      consultant_id: user.id,
      day_of_week: slot.id,
      start_time: slot.startTime,
      end_time: slot.endTime,
      is_active: true,
      service_id: null, // Default to all services
    }));

    const { error: insertError } = await supabase
      .from("availability_rules")
      .insert(rows);

    if (insertError) {
      console.error("Error inserting availability rules:", insertError);
      return {
        error: `Error al guardar nuevos horarios: ${insertError.message}`,
      };
    }
  }

  // 4. Legacy sync (Optional, keeping for safety during transition)
  await supabase
    .from("availability")
    .delete()
    .eq("consultant_id", user.id)
    .is("specific_date", null);

  const legacyRows = availabilityData.map((slot: any) => ({
    consultant_id: user.id,
    day_of_week: slot.id,
    start_time: slot.startTime,
    end_time: slot.endTime,
    is_available: true,
  }));
  await supabase.from("availability").insert(legacyRows);

  revalidatePath("/admin/agenda");
  return { success: true };
}

export async function getAppointments(startDate: Date, endDate: Date) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminFromAppMetadata(user)) return [];

  const { data, error } = await supabase
    .from("appointments")
    .select("*, profiles:client_id(full_name, email)")
    .eq("consultant_id", user.id)
    .gte("start_time", startDate.toISOString())
    .lte("end_time", endDate.toISOString());

  if (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }

  return data;
}

export async function saveSpecificSlot(
  date: Date,
  startTime: string,
  endTime: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminFromAppMetadata(user)) {
    return { error: "No autorizado" };
  }

  const { error } = await supabase.from("availability_exceptions").insert({
    consultant_id: user.id,
    exception_date: date.toISOString().split("T")[0],
    start_time: startTime,
    end_time: endTime,
    is_available: true,
    service_id: null,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/agenda");
  return { success: true };
}

export async function deleteSpecificSlot(slotId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminFromAppMetadata(user)) {
    return { error: "No autorizado" };
  }
  const { error } = await supabase
    .from("availability_exceptions")
    .delete()
    .eq("id", slotId);

  if (error) return { error: error.message };
  revalidatePath("/admin/agenda");
  return { success: true };
}

export async function blockDate(dateString: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminFromAppMetadata(user)) {
    return { error: "No autorizado" };
  }

  // Insert a "Blocked" exception for this date
  const { error } = await supabase.from("availability_exceptions").insert({
    consultant_id: user.id,
    exception_date: dateString,
    start_time: "00:00",
    end_time: "23:59",
    is_available: false,
    service_id: null,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/agenda");
  return { success: true };
}

export async function unblockDate(dateString: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminFromAppMetadata(user)) {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("availability_exceptions")
    .delete()
    .eq("consultant_id", user.id)
    .eq("exception_date", dateString);

  if (error) return { error: error.message };
  revalidatePath("/admin/agenda");
  return { success: true };
}
