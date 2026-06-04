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

export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    let query = svc
      .from("appointments")
      .select(`*, services!service_id(id, name, slug)`)
      .order("start_time", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }
    if (date) {
      query = query.gte("start_time", `${date}T00:00:00`)
        .lte("start_time", `${date}T23:59:59`);
    }

    const { data: appointments, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ids = new Set<string>();
    for (const a of appointments || []) {
      if (a.client_id) ids.add(a.client_id);
      if (a.consultant_id) ids.add(a.consultant_id);
    }
    const enriched = appointments || [];
    if (ids.size > 0) {
      const { data: profiles } = await svc
        .from("profiles")
        .select("id, email, full_name")
        .in("id", [...ids]);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      for (const a of enriched) {
        (a as Record<string, unknown>).client = profileMap[a.client_id] || null;
        (a as Record<string, unknown>).consultant = profileMap[a.consultant_id] || null;
      }
    }

    return NextResponse.json({ data: enriched });
  } catch (err) {
    console.error("GET /api/admin/appointments error", err instanceof Error ? { message: err.message, stack: err.stack } : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
