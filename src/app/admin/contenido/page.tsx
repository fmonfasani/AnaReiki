"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CldUploadWidget } from "next-cloudinary";

export default function ContenidoPage() {
  const [activeTab, setActiveTab] = useState<"video" | "podcast">("video");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalId, setExternalId] = useState("");
  const [duration, setDuration] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("content").insert([
      {
        title,
        description,
        type: activeTab,
        external_id: externalId,
        thumbnail: activeTab === "video" ? thumbnailUrl : undefined,
        duration: duration || null,
        is_premium: true,
      },
    ]);

    setLoading(false);

    if (!error) {
      alert("¡Contenido publicado con éxito! 🎉");
      // Reset form
      setTitle("");
      setDescription("");
      setExternalId("");
      setDuration("");
      setThumbnailUrl("");
    } else {
      alert("Error al publicar: " + error.message);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 font-display">
          Centro de Contenido
        </h1>
        <p className="text-gray-500">
          Sube nuevas clases o publica episodios del podcast.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("video")}
          className={`px-6 py-3 font-medium text-sm transition-colors relative
               ${activeTab === "video" ? "text-pink-600" : "text-gray-500 hover:text-gray-700"}
            `}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined">movie</span>
            Nueva Clase
          </span>
          {activeTab === "video" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-600 rounded-t-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("podcast")}
          className={`px-6 py-3 font-medium text-sm transition-colors relative
               ${activeTab === "podcast" ? "text-pink-600" : "text-gray-500 hover:text-gray-700"}
            `}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined">podcasts</span>
            Nuevo Podcast
          </span>
          {activeTab === "podcast" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-600 rounded-t-full"></div>
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload Widget for Video */}
            {activeTab === "video" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Video de la Clase
                </label>
                {externalId ? (
                  <div className="bg-gray-50 p-4 rounded-xl border border-green-200 flex items-center justify-between">
                    <span className="text-green-700 font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined">
                        check_circle
                      </span>
                      Video cargado correctamente
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setExternalId("");
                        setThumbnailUrl("");
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ) : (
                  <CldUploadWidget
                    uploadPreset="ana-reiki-uploads"
                    onSuccess={(result: any) => {
                      setExternalId(result.info.public_id);
                      setThumbnailUrl(result.info.thumbnail_url);
                      setDuration(
                        Math.round(result.info.duration / 60) + " min",
                      );
                    }}
                  >
                    {({ open }: { open: () => void }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-pink-500 hover:text-pink-500 hover:bg-pink-50 transition-all gap-2"
                      >
                        <span className="material-symbols-outlined text-4xl">
                          cloud_upload
                        </span>
                        <span>Click para subir video a Cloudinary</span>
                      </button>
                    )}
                  </CldUploadWidget>
                )}
              </div>
            )}

            {/* Spotify Link for Podcast */}
            {activeTab === "podcast" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link de Spotify
                </label>
                <input
                  type="url"
                  placeholder="https://open.spotify.com/episode/..."
                  className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Copia el enlace de "Compartir" de Spotify.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500 h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !externalId}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-pink-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin material-symbols-outlined">
                  refresh
                </span>
              ) : (
                <span className="material-symbols-outlined">send</span>
              )}
              Publicar Contenido
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
