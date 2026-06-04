import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect, notFound } from "next/navigation";
import TopicDetail from "./TopicDetail";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const svc = createServiceClient();

  const { data: topic } = await svc
    .from("discussion_topics")
    .select("*")
    .eq("id", id)
    .single();

  if (!topic) return notFound();

  const { data: replies } = await svc
    .from("discussion_replies")
    .select("*")
    .eq("topic_id", id)
    .order("created_at", { ascending: true });

  const authorIds = new Set<string>();
  if (topic.author_id) authorIds.add(topic.author_id);
  for (const r of replies || []) {
    if (r.author_id) authorIds.add(r.author_id);
  }
  if (authorIds.size > 0) {
    const { data: profiles } = await svc
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", [...authorIds]);
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    (topic as Record<string, unknown>).profiles = profileMap[topic.author_id] || null;
    for (const r of replies || []) {
      (r as Record<string, unknown>).profiles = profileMap[r.author_id] || null;
    }
  }

  return (
    <TopicDetail
      topic={topic as any}
      replies={(replies || []) as any[]}
      userId={user.id}
    />
  );
}
