import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import CursosClient from "@/components/consultantes/CursosClient";

export default async function CursosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();

  const { data: profile } = await svc
    .from("profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  const tierOrder = { prana: 0, shakti: 1, ananda: 2 };
  const userTier = (profile?.plan_tier || "prana") as keyof typeof tierOrder;
  const maxTier = tierOrder[userTier] ?? 0;

  const { data: courses } = await svc
    .from("courses")
    .select("*, course_modules(count)")
    .eq("is_active", true)
    .order("sort_order");

  const accessible = (courses || []).filter((c) => {
    const courseTier = tierOrder[c.tier as keyof typeof tierOrder] ?? 0;
    return courseTier <= maxTier;
  });

  return <CursosClient courses={accessible} />;
}
