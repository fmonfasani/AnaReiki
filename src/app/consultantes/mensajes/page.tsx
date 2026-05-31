import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MessagesClient from "./MessagesClient";

export default async function MensajesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sent } = await supabase
    .from("direct_messages")
    .select("*")
    .eq("sender_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: received } = await supabase
    .from("direct_messages")
    .select("*")
    .eq("receiver_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = received?.filter((m) => !m.read_at).length || 0;

  return (
    <MessagesClient
      sent={(sent || []) as any[]}
      received={(received || []) as any[]}
      unreadCount={unreadCount}
      userId={user.id}
    />
  );
}
