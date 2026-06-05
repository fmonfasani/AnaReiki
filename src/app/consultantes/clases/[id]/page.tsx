import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import FavoriteButton from "@/components/FavoriteButton";
import PremiumGate from "@/components/PremiumGate";
import CommentsSection from "@/components/CommentsSection";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ClaseDetailPage({
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

  const { data: video, error } = await supabase
    .from("content")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !video) return notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  const userTier = profile?.plan_tier || "prana";

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
          href="/consultantes/clases"
          className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors group"
        >
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
          Volver a todas las clases
        </Link>
        <FavoriteButton contentId={video.id} isFav={!!fav} />
      </nav>

      <div className="max-w-5xl mx-auto space-y-6">
        <PremiumGate requiredTier="ananda" userTier={userTier}>
          <VideoPlayer
            publicId={video.external_id}
            contentId={video.id}
            initialProgress={progress?.progress_seconds || 0}
            duration={video.duration || undefined}
          />
        </PremiumGate>

        <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              📹 Clase Grabada
            </span>
            {video.is_premium && (
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                PREMIUM
              </span>
            )}
            <span className="text-gray-400 text-sm">
              Publicado el{" "}
              {new Date(video.published_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
            {video.title}
          </h1>

          <div className="prose prose-purple max-w-none text-gray-600 leading-relaxed text-lg">
            {video.description}
          </div>

          {progress && progress.completed && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-200 w-fit">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Completado
            </div>
          )}
        </div>
      </div>

      <CommentsSection contentId={video.id} />
    </div>
  );
}
