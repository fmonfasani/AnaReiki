import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role === "admin" || profile?.role === "owner";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!(await checkAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const svc = createServiceClient();
    const { id } = await params;

    const { data: appointment, error } = await svc
      .from("appointments")
      .select("*, services!service_id(id, name, slug)")
      .eq("id", id)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    const { data: profiles } = await svc
      .from("profiles")
      .select("id, email, full_name")
      .in("id", [appointment.client_id, appointment.consultant_id].filter(Boolean));

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    (appointment as Record<string, unknown>).client = profileMap[appointment.client_id] || null;
    (appointment as Record<string, unknown>).consultant = profileMap[appointment.consultant_id] || null;

    return NextResponse.json({ data: appointment });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!(await checkAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const svc = createServiceClient();
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (!action || !["confirm", "cancel"].includes(action)) {
      return NextResponse.json(
        { error: "Acción inválida. Use: confirm, cancel" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const updates: Record<string, string | null> = {};

    switch (action) {
      case "confirm":
        updates.status = "confirmed";
        break;
      case "cancel":
        updates.status = "cancelled";
        updates.cancelled_at = now;
        updates.cancelled_by = user.id;
        updates.cancelled_reason = reason || null;
        break;
    }

    const { error } = await svc
      .from("appointments")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
