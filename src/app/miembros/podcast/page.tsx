import { createClient } from "@/lib/supabase/server";
import PodcastPlayer from "@/components/PodcastPlayer";

export default async function PodcastPage() {
  const supabase = await createClient();

  // Fetch only podcasts from the content table
  const { data: episodes, error } = await supabase
    .from("content")
    .select("*")
    .eq("type", "podcast")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching podcasts:", error);
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Podcast Exclusivo
        </h1>
        <p className="text-lg text-gray-500">
          Escucha los últimos episodios y reflexiones profundas.
        </p>
      </header>

      {episodes && episodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {episodes.map((episode) => (
            <div
              key={episode.id}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-pink-600 uppercase tracking-widest">
                  <span>🎙️ Episodio</span>
                  <span className="text-gray-300">•</span>
                  <span>
                    {new Date(episode.published_at).toLocaleDateString(
                      "es-ES",
                      { month: "short", day: "numeric" },
                    )}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                  {episode.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {episode.description}
                </p>
              </div>

              <div className="mt-auto pt-4">
                <PodcastPlayer url={episode.external_id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-16 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-4xl shadow-inner">
            📻
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Aún no hay episodios
          </h3>
          <p className="text-gray-400 max-w-sm mb-8">
            Estamos grabando nuevas reflexiones para ti. ¡Vuelve pronto para el
            primer episodio!
          </p>
          <a
            href="/miembros"
            className="inline-flex items-center text-pink-600 font-bold hover:underline"
          >
            ← Volver al Dashboard
          </a>
        </div>
      )}

      {/* Spotify Direct Link Card */}
      {episodes && episodes.length > 0 && (
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="text-center md:text-left space-y-2">
            <h3 className="text-2xl font-bold italic">
              ¿Prefieres escucharlo en Spotify?
            </h3>
            <p className="text-gray-400">
              Sigue nuestro canal para recibir notificaciones de nuevos
              episodios.
            </p>
          </div>
          <a
            href="#" // Here would go the main show URL
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black px-8 py-4 rounded-full font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg flex items-center"
          >
            <span className="mr-3 text-2xl">🎧</span> Seguir en Spotify
          </a>
        </section>
      )}
    </div>
  );
}
