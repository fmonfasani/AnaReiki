import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function isAdmin(
  user: User | null,
  supabase: SupabaseClient
): Promise<boolean> {
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return data?.role === "admin";
}
