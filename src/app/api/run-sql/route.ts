import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const svc = createServiceClient();

  const { data: profile, error: findError } = await svc
    .from("profiles")
    .select("id, email, plan_tier, is_premium")
    .ilike("email", `%${email}%`)
    .single();

  if (findError) {
    return NextResponse.json({ error: `Usuario no encontrado: ${findError.message}` }, { status: 404 });
  }

  if (profile.plan_tier === "prana" && !profile.is_premium) {
    return NextResponse.json({ message: "Ya está en prana", profile });
  }

  const { error: updateError } = await svc
    .from("profiles")
    .update({ plan_tier: "prana", is_premium: false })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, profile: { ...profile, plan_tier: "prana", is_premium: false } });
}
