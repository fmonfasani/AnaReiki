import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { isAdmin, isOwner } from "@/lib/auth/roles";

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
    if (!(await isAdmin(user, supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const serviceSb = createServiceClient();

    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "day_of_week", "specific_date", "start_time", "end_time",
      "duration_minutes", "modality", "session_type",
      "max_participants", "max_online", "max_presencial",
      "service_id", "is_active",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data: rule, error } = await serviceSb
      .from("availability_rules_v2")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: rule });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!(await isOwner(user, supabase))) {
      return NextResponse.json({ error: "Solo el owner puede eliminar reglas" }, { status: 403 });
    }

    const serviceSb = createServiceClient();

    const { id } = await params;

    const { error } = await serviceSb
      .from("availability_rules_v2")
      .delete()
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
