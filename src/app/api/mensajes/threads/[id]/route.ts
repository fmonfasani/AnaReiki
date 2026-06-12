import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const svc = createServiceClient();
  const { data: thread } = await svc
    .from("message_threads")
    .select("*")
    .eq("id", id)
    .single();

  if (!thread) return NextResponse.json({ error: "Thread no encontrado" }, { status: 404 });

  if (thread.created_by !== user.id && thread.participant_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data: messages } = await svc
    .from("direct_messages")
    .select("id, sender_id, receiver_id, content, read_at, created_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  const profileIds = new Set<string>([thread.created_by, thread.participant_id]);
  for (const m of messages || []) { profileIds.add(m.sender_id); profileIds.add(m.receiver_id); }

  const { data: profiles } = await svc
    .from("profiles")
    .select("id, full_name, email")
    .in("id", [...profileIds]);
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

  return NextResponse.json({
    data: {
      ...thread,
      created_by_profile: profileMap[thread.created_by] || null,
      participant_profile: profileMap[thread.participant_id] || null,
      messages: (messages || []).map(m => ({
        ...m,
        sender_profile: profileMap[m.sender_id] || null,
      })),
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { status } = body;

  if (!status || !["open", "closed"].includes(status)) {
    return NextResponse.json({ error: "Status inválido. Usar 'open' o 'closed'" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: thread } = await svc
    .from("message_threads")
    .select("created_by, participant_id")
    .eq("id", id)
    .single();

  if (!thread) return NextResponse.json({ error: "Thread no encontrado" }, { status: 404 });
  if (thread.created_by !== user.id && thread.participant_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { error } = await svc
    .from("message_threads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
