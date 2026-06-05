"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toggleFavorite } from "@/actions/library";
import PremiumGate from "@/components/PremiumGate";

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
  content_categories?: { name: string; slug: string } | null;
};

type ProgressInfo = {
  progress_seconds: number;
  completed: boolean;
  last_watched_at: string;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
};

interface BibliotecaClientProps {
  content: ContentItem[];
  categories: Category[];
  favoriteIds: Set<string>;
  progressMap: Map<string, ProgressInfo>;
  isPremium: boolean;
  planTier: string;
}

export default function BibliotecaClient({
  content,
  categories,
  favoriteIds,
  progressMap,
  isPremium,
  planTier,
}: BibliotecaClientProps) {
  const isShakti = planTier === "shakti";
  const [activeTab, setActiveTab] = useState<"all" | "continue" | "favorites">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "video" | "podcast">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [favorites, setFavorites] = useState(favoriteIds);
  const [aiRecs, setAiRecs] = useState<{ id: string; reason: string; title?: string; description?: string | null; type?: string }[]>([]);
  const [aiRecsLoading, setAiRecsLoading] = useState(false);

  const visibleContent = isShakti
    ? content.filter((c) => c.type !== "video")
    : content;

  const continueWatching = visibleContent.filter((c) => {
    const p = progressMap.get(c.id);
    return p && !p.completed && p.progress_seconds > 0;
  });

  const favContent = visibleContent.filter((c) => favorites.has(c.id));

  const progressPercent = (contentId: string) => {
    const p = progressMap.get(contentId);
    if (!p || !p.progress_seconds) return 0;
    const item = content.find((c) => c.id === contentId);
    if (!item?.duration || item.duration === 0) return 0;
    return Math.min(100, Math.round((p.progress_seconds / (item.duration * 60)) * 100));
  };

  useEffect(() => {
    setAiRecsLoading(true);
    fetch("/api/ai/recommendations")
      .then((r) => r.json())
      .then((data) => {
        if (data.recommendations) {
          setAiRecs(data.recommendations);
        }
      })
      .catch(() => {})
      .finally(() => setAiRecsLoading(false));
  }, []);

  const handleToggleFav = async (contentId: string) => {
    const isFav = favorites.has(contentId);
    await toggleFavorite(contentId, isFav);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(contentId);
      else next.add(contentId);
      return next;
    });
  };

  const filteredContent = visibleContent.filter((c) => {
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (categoryFilter && c.content_categories?.slug !== categoryFilter) return false;
    if (activeTab === "continue" && !continueWatching.includes(c)) return false;

    return true;
  });

  const tabContent = activeTab === "favorites" ? favContent : filteredContent;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Biblioteca Digital
        </h1>
        <p className="text-lg text-gray-500">
          Todo el contenido disponible para vos.
        </p>
      </header>

      {aiRecsLoading ? (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.1s]" />
            <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="text-sm text-purple-600 font-medium ml-2">Recomendando contenido para vos...</span>
          </div>
        </div>
      ) : aiRecs.length > 0 ? (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600">auto_awesome</span>
            Recomendado para vos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiRecs.map((rec) => {
              const item = content.find((c) => c.id === rec.id);
              if (!item) return null;
              return (
                <ContentCard
                  key={rec.id}
                  item={item}
                  isFav={favorites.has(item.id)}
                  onToggleFav={handleToggleFav}
                  progress={progressPercent(item.id)}
                  planTier={planTier}
                  reason={rec.reason}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Todo", icon: "library_books" },
          { key: "continue", label: "Seguir viendo", icon: "play_circle" },
          { key: "favorites", label: "Favoritos", icon: "favorite" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === tab.key
                ? "bg-pink-600 text-white shadow-md shadow-pink-200"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setTypeFilter("all"); setCategoryFilter(null); }}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            typeFilter === "all" && !categoryFilter
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Todos
        </button>
        {!isShakti && (
          <button
            onClick={() => { setTypeFilter("video"); setCategoryFilter(null); }}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              typeFilter === "video" && !categoryFilter
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Videos
          </button>
        )}
        <button
          onClick={() => { setTypeFilter("podcast"); setCategoryFilter(null); }}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            typeFilter === "podcast" && !categoryFilter
              ? "bg-pink-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Podcasts
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setTypeFilter("all"); setCategoryFilter(cat.slug); }}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              categoryFilter === cat.slug
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.icon && <span className="material-symbols-outlined text-xs">{cat.icon}</span>}
            {cat.name}
          </button>
        ))}
      </div>

      {continueWatching.length > 0 && activeTab !== "favorites" && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-pink-600">play_circle</span>
            Continuar viendo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {continueWatching.slice(0, 3).map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                isFav={favorites.has(item.id)}
                onToggleFav={handleToggleFav}
                progress={progressPercent(item.id)}
                planTier={planTier}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tabContent.length > 0 ? (
            tabContent.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                isFav={favorites.has(item.id)}
                onToggleFav={handleToggleFav}
                progress={progressPercent(item.id)}
                planTier={planTier}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
              <span className="material-symbols-outlined text-4xl block mb-2">video_library</span>
              No hay contenido en esta sección.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ContentCard({
  item,
  isFav,
  onToggleFav,
  progress,
  planTier,
  reason,
}: {
  item: ContentItem;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  progress: number;
  planTier: string;
  reason?: string;
}) {
  const href = item.type === "video"
    ? `/consultantes/clases/${item.id}`
    : `/consultantes/podcast/${item.id}`;

  const card = (
    <Link
      href={href}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
    >
      <div className="relative aspect-video bg-gray-900">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            <span className="text-4xl group-hover:scale-125 transition-transform">
              {item.type === "video" ? "▶️" : "🎙️"}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
            {item.type === "video" ? "Ver" : "Escuchar"}
          </span>
        </div>
        {progress > 0 && progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800/50">
            <div
              className="h-full bg-pink-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {item.is_premium && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            PREMIUM
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-xs font-bold text-pink-600 uppercase tracking-widest mb-1">
          {item.type === "video" ? "📹 Clase" : "🎙️ Podcast"}
          {item.content_categories?.name && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500">{item.content_categories.name}</span>
            </>
          )}
        </div>
        <h3 className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors mb-1">
          {item.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 flex-1">
          {item.description}
        </p>
        {reason && (
          <p className="text-xs text-purple-600 font-medium mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            {reason}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            {item.duration ? `${Math.floor(item.duration / 60)} min` : ""}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFav(item.id);
            }}
            className={`text-sm transition-colors ${
              isFav ? "text-pink-500" : "text-gray-300 hover:text-pink-400"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {isFav ? "favorite" : "favorite_border"}
            </span>
          </button>
        </div>
      </div>
    </Link>
  );

  if (item.is_premium) {
    return <PremiumGate requiredTier="ananda" userTier={planTier}>{card}</PremiumGate>;
  }

  return card;
}
