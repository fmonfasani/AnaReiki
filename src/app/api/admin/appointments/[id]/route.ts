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
      .select(`
        *,
        services (id, name, slug, duration_minutes, allowed_modalities),
        client:client_id (id, email, full_name),
        consultant:consultant_id (id, email, full_name)
      `)
      .eq("id", id)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

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

    if (!action || !["confirm", "complete", "cancel", "no-show"].includes(action)) {
      return NextResponse.json(
        { error: "Acción inválida. Use: confirm, complete, cancel, no-show" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const updates: Record<string, string | null> = {};

    switch (action) {
      case "confirm":
        updates.status = "confirmed";
        updates.confirmed_at = now;
        updates.confirmed_by = user.id;
        break;
      case "complete":
        updates.status = "completed";
        break;
      case "cancel":
        updates.status = "cancelled";
        updates.cancelled_at = now;
        updates.cancelled_by = user.id;
        updates.cancelled_reason = reason || null;
        break;
      case "no-show":
        updates.status = "no_show";
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
