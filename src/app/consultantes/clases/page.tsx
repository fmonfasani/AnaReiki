import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function ClasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: videos, error } = await supabase
    .from("content")
    .select("*")
    .eq("type", "video")
    .order("published_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  const isPremium = profile?.is_premium || false;

  if (error) console.error("Error fetching videos:", error);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Clases Grabadas
          </h1>
          <p className="text-lg text-gray-500">
            Biblioteca exclusiva de lecciones y meditaciones.
          </p>
        </div>
        <Link
          href="/consultantes/biblioteca"
          className="text-sm font-medium text-pink-600 hover:text-pink-700 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">library_books</span>
          Biblioteca
        </Link>
      </header>

      {videos && videos.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {videos.map((video) => (
            <Link
              key={video.id}
              href={`/consultantes/clases/${video.id}`}
              className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
            >
              <div className="relative aspect-video bg-gray-900">
                {video.thumbnail_url ? (
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50">
                    <span className="text-5xl group-hover:scale-125 transition-transform">▶️</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    Ver clase
                  </span>
                </div>
                {video.is_premium && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    PREMIUM
                  </div>
                )}
              </div>
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
                {video.is_premium && !isPremium && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full w-fit border border-amber-200">
                    <span className="material-symbols-outlined text-xs">lock</span>
                    Contenido Premium
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-16 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-4xl">
            🌑
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay clases aún</h3>
          <p className="text-gray-400 max-w-sm mb-8">
            Estamos preparando el contenido para que puedas disfrutarlo muy pronto.
          </p>
          <a href="/consultantes" className="text-purple-600 font-bold hover:underline">
            ← Volver al Dashboard
          </a>
        </div>
      )}
    </div>
  );
}
