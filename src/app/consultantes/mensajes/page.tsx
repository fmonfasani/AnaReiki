import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import MessagesClient from "./MessagesClient";

export default async function MensajesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const { data: threads } = await svc
    .from("message_threads")
    .select("*")
    .or(`created_by.eq.${user.id},participant_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  const userIds = new Set<string>();
  for (const t of threads || []) { userIds.add(t.created_by); userIds.add(t.participant_id); }

  let profileMap: Record<string, { id: string; full_name: string | null; email: string | null }> = {};
  if (userIds.size > 0) {
    const { data: profiles } = await svc
      .from("profiles")
      .select("id, full_name, email")
      .in("id", [...userIds]);
    profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  }

  const threadIds = (threads || []).map(t => t.id);
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

  const enriched = (threads || []).map(t => {
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

  return <MessagesClient initialThreads={enriched as any} userId={user.id} />;
}
