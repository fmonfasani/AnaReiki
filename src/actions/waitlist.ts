"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = unknown> = {
  success?: true;
  data?: T;
  error?: string;
};

export async function joinWaitlist(input: {
  consultantId: string;
  serviceId: string;
  preferredDate: string;
  preferredStartTime: string;
  preferredEndTime: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const { data, error } = await supabase.from("waitlist").insert({
    client_id: user.id,
    consultant_id: input.consultantId,
    service_id: input.serviceId,
    preferred_date: input.preferredDate,
    preferred_start_time: input.preferredStartTime,
    preferred_end_time: input.preferredEndTime,
  }).select().single();

  if (error) return { error: error.message };
  revalidatePath("/consultantes/reservar");
  return { success: true, data };
}

export async function cancelWaitlist(waitlistId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const { error } = await supabase
    .from("waitlist")
    .update({ status: "cancelled" })
    .eq("id", waitlistId)
    .eq("client_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/consultantes/reservar");
  return { success: true };
}

export async function getMyWaitlist() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("waitlist")
    .select("*")
    .eq("client_id", user.id)
    .eq("status", "waiting")
    .order("created_at", { ascending: false });

  return data || [];
}
