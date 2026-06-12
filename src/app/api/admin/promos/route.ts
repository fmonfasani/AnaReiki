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

  const { service_ids, ...promoFields } = await request.json();
  const svc = createServiceClient();

  const { data: promo, error } = await svc.from("promotions").insert({
    ...promoFields,
    created_by: user.id,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Vincular servicios
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

  return NextResponse.json({ data: { ...promo, service_ids: service_ids || [] } });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id, service_ids, ...updates } = await request.json();
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
  }

  return NextResponse.json({ success: true });
}
