import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!(await isOwner(user, supabase))) return NextResponse.json({ error: "Solo el owner" }, { status: 403 });

    const { appointment_id } = await request.json();
    if (!appointment_id) return NextResponse.json({ error: "Falta appointment_id" }, { status: 400 });

    const svc = createServiceClient();
    const { error } = await svc.from("appointments").update({
      refund_processed: true,
      payment_status: "refunded",
      updated_at: new Date().toISOString(),
    }).eq("id", appointment_id).eq("approval_status", "rejected");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
