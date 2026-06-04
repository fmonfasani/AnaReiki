import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import CommunityForum from "./CommunityForum";

export default async function ComunidadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();

  const { data: raw } = await svc
    .from("discussion_topics")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("last_activity_at", { ascending: false });

  const ids = new Set<string>();
  for (const t of raw || []) {
    if (t.author_id) ids.add(t.author_id);
  }
  const topics = raw || [];
  if (ids.size > 0) {
    const { data: profiles } = await svc
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", [...ids]);
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    for (const t of topics) {
      (t as Record<string, unknown>).profiles = profileMap[t.author_id] || null;
    }
  }

  return (
    <CommunityForum
      topics={topics as any[]}
      userId={user.id}
    />
  );
}
