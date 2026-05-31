import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BibliotecaClient from "./BibliotecaClient";

export default async function BibliotecaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: content } = await supabase
    .from("content")
    .select("*, content_categories!left(name, slug)")
    .order("published_at", { ascending: false });

  const { data: progress } = await supabase
    .from("content_progress")
    .select("*")
    .eq("user_id", user.id);

  const { data: favorites } = await supabase
    .from("content_favorites")
    .select("content_id")
    .eq("user_id", user.id);

  const { data: categories } = await supabase
    .from("content_categories")
    .select("*")
    .order("sort_order");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium, plan_tier")
    .eq("id", user.id)
    .single();

  const favoriteIds = new Set(favorites?.map((f) => f.content_id) || []);
  const progressMap = new Map(
    progress?.map((p) => [p.content_id, p]) || [],
  );

  return (
    <BibliotecaClient
      content={content || []}
      categories={categories || []}
      favoriteIds={favoriteIds}
      progressMap={progressMap}
      isPremium={profile?.is_premium || false}
      planTier={profile?.plan_tier || "prana"}
    />
  );
}
