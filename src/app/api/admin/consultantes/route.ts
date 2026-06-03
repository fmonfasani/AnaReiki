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

  const serviceClient = createServiceClient();
  const { data: profiles, error } = await serviceClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: profiles });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user, supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { id, is_premium } = body;

  if (!id || typeof is_premium !== "boolean") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("profiles")
    .update({ is_premium })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
