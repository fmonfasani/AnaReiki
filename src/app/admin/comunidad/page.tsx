import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import AdminCommunity from "./AdminCommunity";

export default async function AdminComunidadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user, supabase))) redirect("/login");

  const svc = createServiceClient();

  const { data: rawTopics } = await svc
    .from("discussion_topics")
    .select("*")
    .order("last_activity_at", { ascending: false });

  const { data: rawMessages } = await svc
    .from("direct_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: rawComments } = await svc
    .from("content_comments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const authorIds = new Set<string>();
  const contentIds = new Set<string>();
  for (const t of rawTopics || []) if (t.author_id) authorIds.add(t.author_id);
  for (const m of rawMessages || []) { if (m.sender_id) authorIds.add(m.sender_id); if (m.receiver_id) authorIds.add(m.receiver_id); }
  for (const c of rawComments || []) { if (c.user_id) authorIds.add(c.user_id); if (c.content_id) contentIds.add(c.content_id); }

  const topics = rawTopics || [];
  const messages = rawMessages || [];
  const comments = rawComments || [];

  if (authorIds.size > 0) {
    const { data: profiles } = await svc
      .from("profiles")
      .select("id, email, full_name")
      .in("id", [...authorIds]);
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    for (const t of topics) (t as Record<string, unknown>).profiles = profileMap[t.author_id] || null;
    for (const m of messages) {
      (m as Record<string, unknown>).sender = profileMap[m.sender_id] || null;
      (m as Record<string, unknown>).receiver = profileMap[m.receiver_id] || null;
    }
    for (const c of comments) (c as Record<string, unknown>).profiles = profileMap[c.user_id] || null;
  }

  if (contentIds.size > 0) {
    const { data: contents } = await svc
      .from("content")
      .select("id, title")
      .in("id", [...contentIds]);
    const contentMap = Object.fromEntries((contents || []).map(p => [p.id, p]));
    for (const c of comments) (c as Record<string, unknown>).content = contentMap[c.content_id] || null;
  }

  const unreadMessages = messages?.filter((m) => !m.read_at && m.receiver_id === user.id).length || 0;

  return (
    <AdminCommunity
      topics={topics as any[]}
      messages={messages as any[]}
      comments={comments as any[]}
      unreadMessages={unreadMessages}
      adminId={user.id}
    />
  );
}
