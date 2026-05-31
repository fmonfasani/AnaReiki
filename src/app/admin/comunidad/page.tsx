import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import AdminCommunity from "./AdminCommunity";

export default async function AdminComunidadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user, supabase))) redirect("/login");

  const { data: topics } = await supabase
    .from("discussion_topics")
    .select("*, profiles:author_id(full_name, email)")
    .order("last_activity_at", { ascending: false });

  const { data: messages } = await supabase
    .from("direct_messages")
    .select("*, sender:sender_id(full_name, email), receiver:receiver_id(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: comments } = await supabase
    .from("content_comments")
    .select("*, profiles:user_id(full_name, email), content!inner(title)")
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadMessages = messages?.filter((m) => !m.read_at && m.receiver_id === user.id).length || 0;

  return (
    <AdminCommunity
      topics={(topics || []) as any[]}
      messages={(messages || []) as any[]}
      comments={(comments || []) as any[]}
      unreadMessages={unreadMessages}
      adminId={user.id}
    />
  );
}
