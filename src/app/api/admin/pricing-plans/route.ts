import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdmin } from "@/lib/auth/roles";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("pricing_plans")
    .select("*, subscription_promotions(*)")
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const svc = createServiceClient();
  const { id, ...updates } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  const { data, error } = await svc
    .from("pricing_plans")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
