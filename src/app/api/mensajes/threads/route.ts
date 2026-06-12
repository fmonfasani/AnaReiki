import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const svc = createServiceClient();
  const { data: threads } = await svc
    .from("message_threads")
    .select("*")
    .or(`created_by.eq.${user.id},participant_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (!threads?.length) return NextResponse.json({ data: [] });

  const userIds = new Set<string>();
  for (const t of threads) { userIds.add(t.created_by); userIds.add(t.participant_id); }
  const { data: profiles } = await svc
    .from("profiles")
    .select("id, full_name, email")
    .in("id", [...userIds]);
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

  const threadIds = threads.map(t => t.id);
  const { data: allMessages } = await svc
    .from("direct_messages")
    .select("id, thread_id, sender_id, receiver_id, content, read_at, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false });

  const msgMap: Record<string, typeof allMessages> = {};
  for (const m of allMessages || []) {
    if (!m.thread_id) continue;
    if (!msgMap[m.thread_id]) msgMap[m.thread_id] = [];
    msgMap[m.thread_id]!.push(m);
  }

  const enriched = threads.map(t => {
    const msgs = msgMap[t.id] || [];
    const unread = msgs.filter(m => m.receiver_id === user.id && !m.read_at).length;
    const lastMsg = msgs.length > 0 ? [...msgs].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0] : null;
    return {
      ...t,
      created_by_profile: profileMap[t.created_by] || null,
      participant_profile: profileMap[t.participant_id] || null,
      unread_count: unread,
      last_message: lastMsg,
    };
  });

  return NextResponse.json({ data: enriched });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { title, content } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Faltan campos: title, content" }, { status: 400 });
  }

  let participantId = body.participant_id;

  if (!participantId) {
    const svc = createServiceClient();
    const { data: admin } = await svc
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();
    if (!admin) return NextResponse.json({ error: "No se encontró administrador" }, { status: 500 });
    participantId = admin.id;
  }

  const svc = createServiceClient();
  const { data: thread, error: threadError } = await svc
    .from("message_threads")
    .insert({ title: title.trim(), created_by: user.id, participant_id: participantId })
    .select()
    .single();

  if (threadError) {
    return NextResponse.json({ error: threadError.message }, { status: 500 });
  }

  const { error: msgError } = await svc.from("direct_messages").insert({
    thread_id: thread.id,
    sender_id: user.id,
    receiver_id: participantId,
    content: content.trim(),
  });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({ data: thread }, { status: 201 });
}
