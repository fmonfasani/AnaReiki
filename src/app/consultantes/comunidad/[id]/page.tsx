import { createClient } from "@/lib/supabase/server";
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

  const { data: topic } = await supabase
    .from("discussion_topics")
    .select("*, profiles:author_id(full_name, avatar_url)")
    .eq("id", id)
    .single();

  if (!topic) return notFound();

  const { data: replies } = await supabase
    .from("discussion_replies")
    .select("*, profiles:author_id(full_name, avatar_url)")
    .eq("topic_id", id)
    .order("created_at", { ascending: true });

  return (
    <TopicDetail
      topic={topic as any}
      replies={(replies || []) as any[]}
      userId={user.id}
    />
  );
}
