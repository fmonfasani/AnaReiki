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
    .from("subscription_promotions")
    .select("*, pricing_plans(name, tier_slug)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const svc = createServiceClient();
  const body = await req.json();

  const { data, error } = await svc
    .from("subscription_promotions")
    .insert({
      plan_id: body.plan_id,
      title: body.title,
      description: body.description,
      discount_percent: body.discount_percent,
      promo_code: body.promo_code || null,
      max_uses: body.max_uses || null,
      valid_from: body.valid_from || new Date().toISOString(),
      valid_until: body.valid_until || null,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const svc = createServiceClient();
  const { id, ...updates } = await req.json();

  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const { data, error } = await svc
    .from("subscription_promotions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const svc = createServiceClient();
  const { error } = await svc.from("subscription_promotions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
