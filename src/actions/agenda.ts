"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveAvailability(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  // 2. Clear existing RECURRING availability for this user (preserve specific dates)
  const { error: deleteError } = await supabase
    .from("availability")
    .delete()
    .eq("consultant_id", user.id)
    .is("specific_date", null);

  if (deleteError) {
    console.error("Error deleting old availability:", deleteError);
    return {
      error: `Error al limpiar disponibilidad anterior: ${deleteError.message}`,
    };
  }

  // 3. Insert new availability
  if (availabilityData.length > 0) {
    const rows = availabilityData.map((slot: any) => ({
      consultant_id: user.id,
      day_of_week: slot.id,
      start_time: slot.startTime,
      end_time: slot.endTime,
      is_available: true,
    }));

    const { error: insertError } = await supabase
      .from("availability")
      .insert(rows);

    if (insertError) {
      console.error("Error inserting availability:", insertError);
      return {
        error: `Error al guardar nuevos horarios: ${insertError.message}`,
      };
    }
  }

  revalidatePath("/admin/agenda");
  return { success: true };
}

export async function getAppointments(startDate: Date, endDate: Date) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

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

  if (!user) return { error: "No autorizado" };

  const { error } = await supabase.from("availability").insert({
    consultant_id: user.id,
    day_of_week: date.getDay(),
    start_time: startTime,
    end_time: endTime,
    specific_date: date.toISOString().split("T")[0],
    is_available: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/agenda");
  return { success: true };
}

export async function deleteSpecificSlot(slotId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("availability")
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

  if (!user) return { error: "No autorizado" };

  // Insert a "Blocked" rule for this date
  const { error } = await supabase.from("availability").insert({
    consultant_id: user.id,
    specific_date: dateString,
    start_time: "00:00",
    end_time: "23:59",
    is_available: false,
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

  if (!user) return { error: "No autorizado" };

  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("consultant_id", user.id)
    .eq("specific_date", dateString);

  if (error) return { error: error.message };
  revalidatePath("/admin/agenda");
  return { success: true };
}
