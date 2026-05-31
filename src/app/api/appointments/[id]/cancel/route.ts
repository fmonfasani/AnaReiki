import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    const { id } = await params;
    const body = await request.json();

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, client_id, slot_id, status")
      .eq("id", id)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if (appointment.client_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json({ error: "El turno ya está cancelado" }, { status: 409 });
    }

    const { error: cancelError } = await supabase
      .rpc("cancel_appointment", {
        p_appointment_id: id,
        p_reason: body.reason || null,
        p_cancelled_by: user.id,
      });

    if (cancelError) {
      return NextResponse.json({ error: cancelError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
