import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import AdminCommunity from "./AdminCommunity";

export default async function AdminComunidadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, supabase))) redirect("/login");

  const svc = createServiceClient();

  const { data: rawTopics } = await svc
    .from("discussion_topics")
    .select("*")
    .order("last_activity_at", { ascending: false });

  const { data: rawComments } = await svc
    .from("content_comments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: rawThreads } = await svc
    .from("message_threads")
    .select("*")
    .order("last_message_at", { ascending: false });

  const authorIds = new Set<string>();
  const contentIds = new Set<string>();
  for (const t of rawTopics || []) if (t.author_id) authorIds.add(t.author_id);
  for (const c of rawComments || []) { if (c.user_id) authorIds.add(c.user_id); if (c.content_id) contentIds.add(c.content_id); }
  for (const t of rawThreads || []) { authorIds.add(t.created_by); authorIds.add(t.participant_id); }

  const topics = rawTopics || [];
  const comments = rawComments || [];
  const threads = rawThreads || [];

  if (authorIds.size > 0) {
    const { data: profiles } = await svc
      .from("profiles")
      .select("id, email, full_name")
      .in("id", [...authorIds]);
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    for (const t of topics) (t as Record<string, unknown>).profiles = profileMap[t.author_id] || null;
    for (const c of comments) (c as Record<string, unknown>).profiles = profileMap[c.user_id] || null;
    for (const t of threads) {
      (t as Record<string, unknown>).created_by_profile = profileMap[t.created_by] || null;
      (t as Record<string, unknown>).participant_profile = profileMap[t.participant_id] || null;
    }
  }

  if (contentIds.size > 0) {
    const { data: contents } = await svc
      .from("content")
      .select("id, title")
      .in("id", [...contentIds]);
    const contentMap = Object.fromEntries((contents || []).map(p => [p.id, p]));
    for (const c of comments) (c as Record<string, unknown>).content = contentMap[c.content_id] || null;
  }

  const unreadMessages = threads.filter(t => {
    // threads where admin is participant and has unread messages
    return t.participant_id === user.id || t.created_by === user.id;
  }).length;

  return (
    <AdminCommunity
      topics={topics as any[]}
      comments={comments as any[]}
      threads={threads as any[]}
      adminId={user.id}
    />
  );
}
