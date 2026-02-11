import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
            ¡Hola, {user?.user_metadata?.full_name?.split(" ")[0] || "Miembro"}!
            ✨
          </h1>
          <p className="text-purple-100 text-lg md:text-xl max-w-xl leading-relaxed">
            Te damos la bienvenida a tu espacio de crecimiento y sanación. Aquí
            encontrarás todas tus clases y episodios exclusivos.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      </section>

      {/* Quick Actions / Featured */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clases Card */}
        <Link
          href="/miembros/clases"
          className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-6xl group-hover:scale-110 transition-transform duration-500 opacity-20">
            📚
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Clases Grabadas
            </h3>
            <p className="text-gray-500 mb-6">
              Accede a todas las lecciones y talleres grabados para verlos a tu
              ritmo.
            </p>
            <span className="inline-flex items-center text-purple-600 font-bold group-hover:translate-x-2 transition-transform">
              Ir a las clases <span className="ml-2">→</span>
            </span>
          </div>
        </Link>

        {/* Podcast Card */}
        <Link
          href="/miembros/podcast"
          className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-6xl group-hover:scale-110 transition-transform duration-500 opacity-20">
            🎙️
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Podcast Exclusivo
            </h3>
            <p className="text-gray-500 mb-6">
              Escucha los episodios más recientes y profundiza en cada tema
              desde Spotify.
            </p>
            <span className="inline-flex items-center text-pink-600 font-bold group-hover:translate-x-2 transition-transform">
              Escuchar ahora <span className="ml-2">→</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Latest Content Placeholder Section */}
      <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="mr-3">🚀</span> Recientemente Agregado
        </h2>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-gray-400 max-w-sm">
            Pronto aparecerán aquí tus últimas clases y episodios del podcast
            para un acceso más rápido.
          </p>
        </div>
      </section>
    </div>
  );
}
