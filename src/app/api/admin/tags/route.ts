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
  const { data: profiles } = await svc.from("profiles").select("tags");

  const tagSet = new Set<string>();
  profiles?.forEach((p) => (p.tags || []).forEach((t: string) => tagSet.add(t)));

  return NextResponse.json({ tags: Array.from(tagSet).sort() });
}
