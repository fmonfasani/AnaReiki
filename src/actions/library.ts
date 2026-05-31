"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success?: true; error?: string };

export async function saveProgress(
  contentId: string,
  progressSeconds: number,
  durationSeconds?: number,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { error } = await supabase.rpc("save_content_progress", {
    p_user_id: user.id,
    p_content_id: contentId,
    p_progress_seconds: progressSeconds,
    p_duration_seconds: durationSeconds || null,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function toggleFavorite(
  contentId: string,
  isFav: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  if (isFav) {
    const { error } = await supabase
      .from("content_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("content_id", contentId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("content_favorites")
      .insert({ user_id: user.id, content_id: contentId });
    if (error) return { error: error.message };
  }

  revalidatePath("/consultantes/biblioteca");
  revalidatePath("/consultantes/clases");
  return { success: true };
}

export async function getLibraryData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { content: [], favorites: [], continueWatching: [] };

  const { data: content } = await supabase
    .from("content")
    .select("*, content_categories!left(name, slug), content_progress!left(progress_seconds, completed, last_watched_at), content_favorites!left(id)")
    .eq("content_progress.user_id", user.id)
    .eq("content_favorites.user_id", user.id)
    .order("published_at", { ascending: false });

  const { data: favorites } = await supabase
    .from("content_favorites")
    .select("*, content!inner(*, content_categories!left(name, slug))")
    .eq("user_id", user.id);

  const { data: progress } = await supabase
    .from("content_progress")
    .select("*, content!inner(*, content_categories!left(name, slug))")
    .eq("user_id", user.id)
    .eq("completed", false)
    .order("last_watched_at", { ascending: false });

  return {
    content: content || [],
    favorites: favorites?.map((f) => f.content) || [],
    continueWatching: progress?.map((p) => ({
      ...p.content,
      progress_seconds: p.progress_seconds,
      completed: p.completed,
      last_watched_at: p.last_watched_at,
    })) || [],
  };
}

export async function updateContent(
  id: string,
  data: {
    title?: string;
    description?: string;
    is_premium?: boolean;
    category_id?: string | null;
  },
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { error } = await supabase
    .from("content")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/contenido");
  return { success: true };
}

export async function deleteContent(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { error } = await supabase.from("content").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/contenido");
  return { success: true };
}
