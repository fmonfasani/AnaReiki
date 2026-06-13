import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdmin } from "@/lib/auth/roles";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const svc = createServiceClient();
  const { data: promotions, error } = await svc
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Traer service_ids vinculados
  const promoIds = promotions.map((p: { id: string }) => p.id);
  const { data: sessions } = await svc
    .from("promotion_sessions")
    .select("promotion_id, service_id")
    .in("promotion_id", promoIds.length > 0 ? promoIds : ["00000000-0000-0000-0000-000000000000"]);

  const serviceMap: Record<string, string[]> = {};
  (sessions || []).forEach((s: { promotion_id: string; service_id: string }) => {
    if (!serviceMap[s.promotion_id]) serviceMap[s.promotion_id] = [];
    if (s.service_id && !serviceMap[s.promotion_id].includes(s.service_id)) {
      serviceMap[s.promotion_id].push(s.service_id);
    }
  });

  const data = promotions.map((p: { id: string }) => ({
    ...p,
    service_ids: serviceMap[p.id] || [],
  }));

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { service_ids, modality, discount_factor, deposit_type, deposit_value, ...promoFields } = await request.json();
  const svc = createServiceClient();

  const { data: promo, error } = await svc.from("promotions").insert({
    ...promoFields,
    modality: modality || null,
    discount_factor: discount_factor ?? 1.00,
    deposit_type: deposit_type || 'none',
    deposit_value: deposit_value ?? 0,
    created_by: user.id,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Vincular servicios y actualizar service_ids en promotions
  if (service_ids && Array.isArray(service_ids) && service_ids.length > 0) {
    const sessions = service_ids.map((sid: string) => ({
      promotion_id: promo.id,
      service_id: sid,
      session_type: "individual",
      modality: "both",
      session_count: 1,
      duration_minutes: 60,
    }));
    await svc.from("promotion_sessions").insert(sessions);
  }

  // Sincronizar service_ids en la propia tabla promotions
  await svc.from("promotions").update({ service_ids: service_ids || [] }).eq("id", promo.id);

  return NextResponse.json({ data: { ...promo, service_ids: service_ids || [] } });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { id, service_ids, modality, discount_factor, deposit_type, deposit_value, ...updates } = body;

  // Tratar campos nuevos explícitamente
  if (body.hasOwnProperty('modality')) updates.modality = modality || null;
  if (body.hasOwnProperty('discount_factor')) updates.discount_factor = discount_factor ?? 1.00;
  if (body.hasOwnProperty('deposit_type')) updates.deposit_type = deposit_type || 'none';
  if (body.hasOwnProperty('deposit_value')) updates.deposit_value = deposit_value ?? 0;
  const svc = createServiceClient();

  if (Object.keys(updates).length > 0) {
    const { error } = await svc.from("promotions").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Actualizar vinculación de servicios
  if (service_ids !== undefined) {
    await svc.from("promotion_sessions").delete().eq("promotion_id", id);
    if (Array.isArray(service_ids) && service_ids.length > 0) {
      const sessions = service_ids.map((sid: string) => ({
        promotion_id: id,
        service_id: sid,
        session_type: "individual",
        modality: "both",
        session_count: 1,
        duration_minutes: 60,
      }));
      await svc.from("promotion_sessions").insert(sessions);
    }
    // Sincronizar service_ids en la propia tabla promotions
    await svc.from("promotions").update({ service_ids: service_ids || [] }).eq("id", id);
  }

  return NextResponse.json({ success: true });
}
