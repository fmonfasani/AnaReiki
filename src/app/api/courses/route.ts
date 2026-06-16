import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

// GET: List published courses for the user's tier
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const svc = createServiceClient();

  const { data: profile } = await svc
    .from("profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  const tierOrder = { prana: 0, shakti: 1, ananda: 2 };
  const userTier = (profile?.plan_tier || "prana") as keyof typeof tierOrder;
  const maxTier = tierOrder[userTier] ?? 0;

  const { data, error } = await svc
    .from("courses")
    .select("*, course_modules(count)")
    .eq("is_active", true)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const accessible = (data || []).filter((c) => {
    const courseTier = tierOrder[c.tier as keyof typeof tierOrder] ?? 0;
    return courseTier <= maxTier;
  });

  return NextResponse.json(accessible);
}
