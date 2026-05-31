"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  success?: true;
  error?: string;
};

export async function createRecurringTemplate(input: {
  consultantId: string;
  serviceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  frequency: "weekly" | "biweekly";
  endDate?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const { error } = await supabase.from("recurring_templates").insert({
    client_id: user.id,
    consultant_id: input.consultantId,
    service_id: input.serviceId,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    frequency: input.frequency,
    end_date: input.endDate || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/consultantes/reservar");
  revalidatePath("/consultantes/mis-citas");
  return { success: true };
}

export async function cancelRecurringTemplate(templateId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const { error } = await supabase
    .from("recurring_templates")
    .update({ is_active: false })
    .eq("id", templateId)
    .eq("client_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/consultantes/mis-citas");
  return { success: true };
}

export async function getMyRecurringTemplates() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("recurring_templates")
    .select("*, services(name)")
    .eq("client_id", user.id)
    .eq("is_active", true);

  return data || [];
}
