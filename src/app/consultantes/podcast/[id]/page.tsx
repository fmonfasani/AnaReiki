import { createClient } from "@/lib/supabase/server";
import PodcastPlayer from "@/components/PodcastPlayer";
import FavoriteButton from "@/components/FavoriteButton";
import PremiumGate from "@/components/PremiumGate";
import CommentsSection from "@/components/CommentsSection";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function PodcastDetailPage({
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

  const { data: episode, error } = await supabase
    .from("content")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !episode) return notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  const isPremium = profile?.is_premium || false;
  const isLocked = episode.is_premium && !isPremium;

  const { data: progress } = await supabase
    .from("content_progress")
    .select("progress_seconds, completed")
    .eq("user_id", user.id)
    .eq("content_id", id)
    .single();

  const { data: fav } = await supabase
    .from("content_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("content_id", id)
    .single();

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <nav className="flex items-center justify-between">
        <Link
          href="/consultantes/podcast"
          className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-pink-600 transition-colors group"
        >
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
          Volver a episodios
        </Link>
        <FavoriteButton
          contentId={episode.id}
          isFav={!!fav}
        />
      </nav>

      <div className="max-w-4xl mx-auto space-y-6">
        <PremiumGate isPremium={!isLocked}>
          <PodcastPlayer
            url={episode.external_id}
            contentId={episode.id}
            duration={episode.duration || undefined}
          />
        </PremiumGate>

        <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              🎙️ Episodio
            </span>
            {episode.is_premium && (
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                PREMIUM
              </span>
            )}
            <span className="text-gray-400 text-sm">
              {new Date(episode.published_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
            {episode.title}
          </h1>

          <div className="prose prose-pink max-w-none text-gray-600 leading-relaxed text-lg">
            {episode.description}
          </div>
        </div>
      </div>

      <CommentsSection contentId={episode.id} />
    </div>
  );
}
