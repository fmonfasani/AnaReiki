"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ContentItem = {
  id: string;
  title: string;
  description: string | null;
  type: "video" | "podcast";
  external_id: string;
  thumbnail_url: string | null;
  duration: number | null;
  is_premium: boolean;
  published_at: string;
  category_id?: string | null;
  content_categories?: { name: string; slug: string } | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

interface AdminContentManagerProps {
  initialContent: ContentItem[];
  categories: Category[];
}

type Tab = "upload" | "manage";

export default function AdminContentManager({
  initialContent,
  categories,
}: AdminContentManagerProps) {
  const [tab, setTab] = useState<Tab>("upload");
  const [content, setContent] = useState(initialContent);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setTab("upload")}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            tab === "upload" ? "text-pink-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined">add_circle</span>
            Subir nuevo
          </span>
          {tab === "upload" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setTab("manage")}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            tab === "manage" ? "text-pink-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined">list_alt</span>
            Gestionar contenido ({content.length})
          </span>
          {tab === "manage" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-600 rounded-t-full" />
          )}
        </button>
      </div>

      {tab === "upload" ? (
        <UploadForm categories={categories} onCreated={(item) => setContent((prev) => [item, ...prev])} />
      ) : (
        <ContentList
          content={content}
          categories={categories}
          editingId={editingId}
          onEdit={setEditingId}
          onUpdate={(id, updates) =>
            setContent((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
          }
          onDelete={(id) => setContent((prev) => prev.filter((c) => c.id !== id))}
        />
      )}
    </div>
  );
}

function UploadForm({
  categories,
  onCreated,
}: {
  categories: Category[];
  onCreated: (item: ContentItem) => void;
}) {
  const [activeTab, setActiveTab] = useState<"video" | "podcast">("video");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalId, setExternalId] = useState("");
  const [duration, setDuration] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isPremium, setIsPremium] = useState(true);
  const [categoryId, setCategoryId] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setExternalId("");
    setDuration("");
    setThumbnailUrl("");
    setCategoryId("");
    setIsPremium(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type: activeTab,
          external_id: externalId,
          thumbnail_url: activeTab === "video" ? thumbnailUrl : undefined,
          duration: duration ? parseInt(duration) : null,
          is_premium: isPremium,
          category_id: categoryId || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }

      const { data } = await res.json();
      onCreated(data);
      alert("¡Contenido publicado con éxito!");
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-8 max-w-2xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("video")}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === "video" ? "text-pink-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">movie</span>
              Nueva Clase
            </span>
            {activeTab === "video" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("podcast")}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === "podcast" ? "text-pink-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">podcasts</span>
              Nuevo Podcast
            </span>
            {activeTab === "podcast" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-600 rounded-t-full" />
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === "video" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Video</label>
              {externalId ? (
                <div className="bg-gray-50 p-4 rounded-xl border border-green-200 flex items-center justify-between">
                  <span className="text-green-700 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined">check_circle</span>
                    Video cargado
                  </span>
                  <button
                    type="button"
                    onClick={() => { setExternalId(""); setThumbnailUrl(""); }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ) : (
                <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-pink-500 hover:text-pink-500 hover:bg-pink-50 transition-all gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                  {uploadingFile ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                      Subiendo...
                    </span>
                  ) : (
                    <span>Click para subir video</span>
                  )}
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    className="hidden"
                    disabled={uploadingFile}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingFile(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("type", "videos");
                        const res = await fetch("/api/upload", {
                          method: "POST",
                          body: formData,
                        });
                        const data = await res.json();
                        if (data.url) {
                          setExternalId(data.url);
                        }
                      } catch (err) {
                        console.error("Upload error:", err);
                      } finally {
                        setUploadingFile(false);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          )}

          {activeTab === "podcast" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link de Spotify</label>
              <input
                type="url"
                placeholder="https://open.spotify.com/episode/..."
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500 h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
              <input
                type="number"
                className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Contenido Premium</span>
              <p className="text-xs text-gray-400">Solo visible para consultantes con plan premium</p>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading || !externalId}
            className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-pink-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin material-symbols-outlined">refresh</span>
            ) : (
              <span className="material-symbols-outlined">send</span>
            )}
            Publicar Contenido
          </button>
        </form>
      </div>
    </div>
  );
}

function ContentList({
  content,
  categories,
  editingId,
  onEdit,
  onUpdate,
  onDelete,
}: {
  content: ContentItem[];
  categories: Category[];
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<ContentItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<"all" | "video" | "podcast">("all");

  const filtered = typeFilter === "all" ? content : content.filter((c) => c.type === typeFilter);

  const handleTogglePremium = async (item: ContentItem) => {
    const newVal = !item.is_premium;
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, is_premium: newVal }),
    });
    if (res.ok) onUpdate(item.id, { is_premium: newVal });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este contenido definitivamente?")) return;
    const res = await fetch(`/api/content?id=${id}`, { method: "DELETE" });
    if (res.ok) onDelete(id);
  };

  const handleSaveEdit = async (item: ContentItem) => {
    const title = (document.getElementById(`edit-title-${item.id}`) as HTMLInputElement)?.value;
    const description = (document.getElementById(`edit-desc-${item.id}`) as HTMLTextAreaElement)?.value;
    const categoryId = (document.getElementById(`edit-cat-${item.id}`) as HTMLSelectElement)?.value;

    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, title, description, category_id: categoryId || null }),
    });
    if (res.ok) {
      onUpdate(item.id, { title, description, category_id: categoryId || null });
      onEdit(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        {["all", "video", "podcast"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t as typeof typeFilter)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              typeFilter === t
                ? "bg-pink-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "all" ? "Todos" : t === "video" ? "📹 Clases" : "🎙️ Podcasts"}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} items</span>
      </div>

      <div className="divide-y divide-gray-50">
        {filtered.map((item) => (
          <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors">
            {editingId === item.id ? (
              <div className="space-y-3">
                <input
                  id={`edit-title-${item.id}`}
                  defaultValue={item.title}
                  className="w-full border-gray-200 rounded-lg text-sm focus:ring-pink-500 focus:border-pink-500"
                />
                <textarea
                  id={`edit-desc-${item.id}`}
                  defaultValue={item.description || ""}
                  className="w-full border-gray-200 rounded-lg text-sm h-20 focus:ring-pink-500 focus:border-pink-500"
                />
                <select
                  id={`edit-cat-${item.id}`}
                  defaultValue={item.category_id || ""}
                  className="w-full border-gray-200 rounded-lg text-sm focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(item)}
                    className="bg-pink-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-pink-700"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => onEdit(null)}
                    className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">{item.type === "video" ? "📹" : "🎙️"}</span>
                    <span className="font-medium text-gray-900 text-sm truncate">{item.title}</span>
                    {item.content_categories?.name && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {item.content_categories.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{item.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-gray-400">
                      {format(new Date(item.published_at), "dd/MM/yyyy", { locale: es })}
                    </span>
                    {item.duration && (
                      <span className="text-[10px] text-gray-400">{Math.floor(item.duration / 60)} min</span>
                    )}
                    <button
                      onClick={() => handleTogglePremium(item)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        item.is_premium
                          ? "bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.is_premium ? "🔒 Premium" : "🔓 Libre"}
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onEdit(item.id)}
                    className="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            No hay contenido publicado aún.
          </div>
        )}
      </div>
    </div>
  );
}
