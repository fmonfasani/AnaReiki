export default function PodcastPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Podcast Exclusivo</h1>
        <p className="text-gray-500">
          Escucha los episodios exclusivos para miembros desde Spotify.
        </p>
      </header>

      <div className="bg-white rounded-3xl p-12 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">🎙️</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Próximamente...
        </h3>
        <p className="text-gray-400 max-w-sm">
          Muy pronto podrás escuchar todos nuestros episodios directamente desde
          aquí.
        </p>
      </div>
    </div>
  );
}
