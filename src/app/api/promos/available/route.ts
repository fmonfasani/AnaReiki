import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("service_id");
    const tier = searchParams.get("tier");

    if (!serviceId) {
      return NextResponse.json({ error: "service_id es requerido" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userTier = tier || "prana";

    const { data: promos, error } = await supabase
      .rpc("get_available_promos", {
        p_service_id: serviceId,
        p_tier: userTier,
      });

    if (error) {
      console.error("get_available_promos error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: promos || [] });
  } catch (err) {
    console.error("GET /api/promos/available error", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
