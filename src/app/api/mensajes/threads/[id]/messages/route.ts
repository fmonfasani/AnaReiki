import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { content } = body;
  if (!content?.trim()) {
    return NextResponse.json({ error: "Falta content" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: thread } = await svc
    .from("message_threads")
    .select("created_by, participant_id, status")
    .eq("id", id)
    .single();

  if (!thread) return NextResponse.json({ error: "Thread no encontrado" }, { status: 404 });
  if (thread.created_by !== user.id && thread.participant_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (thread.status === "closed") {
    return NextResponse.json({ error: "El chat está cerrado. Reabrilo para enviar mensajes." }, { status: 400 });
  }

  const receiverId = thread.created_by === user.id ? thread.participant_id : thread.created_by;

  const { data: message, error: msgError } = await svc
    .from("direct_messages")
    .insert({
      thread_id: id,
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
    })
    .select("id, sender_id, receiver_id, content, read_at, created_at")
    .single();

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 });

  await svc
    .from("message_threads")
    .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ data: message }, { status: 201 });
}
