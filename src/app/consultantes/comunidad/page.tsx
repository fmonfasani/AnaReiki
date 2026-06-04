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

  const { data: topics } = await svc
    .from("discussion_topics")
    .select("*, profiles:author_id(full_name, avatar_url)")
    .order("is_pinned", { ascending: false })
    .order("last_activity_at", { ascending: false });

  return (
    <CommunityForum
      topics={(topics || []) as any[]}
      userId={user.id}
    />
  );
}
