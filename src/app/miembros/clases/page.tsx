import { createClient } from "@/lib/supabase/server";
import VideoPlayer from "@/components/VideoPlayer";
import Link from "next/link";

export default async function ClasesPage() {
  const supabase = await createClient();

  // Fetch only videos from the content table
  const { data: videos, error } = await supabase
    .from("content")
    .select("*")
    .eq("type", "video")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching videos:", error);
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Clases Grabadas
        </h1>
        <p className="text-lg text-gray-500">
          Biblioteca exclusiva de lecciones y meditaciones.
        </p>
      </header>

      {videos && videos.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {videos.map((video) => (
            <Link
              key={video.id}
              href={`/miembros/clases/${video.id}`}
              className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
            >
              {/* Thumbnail / Video Preview Area */}
              <div className="relative aspect-video bg-gray-900">
                {/* We use a simple image for thumbnail if stored, otherwise showing a play icon */}
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50">
                    <span className="text-5xl group-hover:scale-125 transition-transform duration-300">
                      ▶️
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    Ver clase
                  </span>
                </div>
              </div>

              {/* Info Area */}
              <div className="p-6">
                <div className="flex items-center space-x-2 text-xs font-bold text-purple-600 uppercase tracking-widest mb-2">
                  <span>📹 Clase</span>
                  {video.duration && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{Math.floor(video.duration / 60)} min</span>
                    </>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                  {video.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {video.description}
                </p>
              </div>

              {/* Video Player Modal/Section would go here, or we redirect to a detail page */}
              {/* For simplicity, let's add a sub-page or conditional rendering later. 
                  Currently, we can use a basic implementation where clicking might show the video. */}
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-16 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-4xl">
            🌑
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No hay clases aún
          </h3>
          <p className="text-gray-400 max-w-sm mb-8">
            Estamos preparando el contenido para que puedas disfrutarlo muy
            pronto. ¡Vuelve más tarde!
          </p>
          <a
            href="/miembros"
            className="text-purple-600 font-bold hover:underline"
          >
            ← Volver al Dashboard
          </a>
        </div>
      )}
    </div>
  );
}
