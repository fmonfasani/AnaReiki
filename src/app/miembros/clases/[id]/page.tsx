import { createClient } from "@/lib/supabase/server";
import VideoPlayer from "@/components/VideoPlayer";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ClaseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { id } = params;

  const { data: video, error } = await supabase
    .from("content")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !video) {
    return notFound();
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <nav>
        <Link
          href="/miembros/clases"
          className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors group"
        >
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">
            ←
          </span>{" "}
          Volver a todas las clases
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto space-y-6">
        <VideoPlayer publicId={video.external_id} />

        <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              📹 Clase Grabada
            </span>
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
        </div>
      </div>
    </div>
  );
}
