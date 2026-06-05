"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { createTopic } from "@/actions/community";

type Topic = {
  id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  is_closed: boolean;
  reply_count: number;
  last_activity_at: string;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

interface CommunityForumProps {
  topics: Topic[];
  userId: string;
}

const CATEGORIES = [
  { value: "general",     label: "General",     icon: "forum",            color: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
  { value: "reiki",       label: "Reiki",       icon: "self_improvement", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
  { value: "meditacion",  label: "Meditación",  icon: "auto_awesome",     color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  { value: "yoga",        label: "Yoga",        icon: "sunny",            color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
  { value: "experiencias",label: "Experiencias", icon: "diversity_3",     color: "bg-green-100 text-green-700 hover:bg-green-200" },
  { value: "consultas",   label: "Consultas",   icon: "help",             color: "bg-pink-100 text-pink-700 hover:bg-pink-200" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
);

const CATEGORY_ICONS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.icon]),
);

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.color]),
);

export default function CommunityForum({ topics, userId }: CommunityForumProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = activeCategory === "all"
    ? topics
    : topics.filter((t) => t.category === activeCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await createTopic({ title, content, category });
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      setTitle("");
      setContent("");
      setCategory("general");
      setShowNewTopic(false);
      setSubmitting(false);
      router.refresh();
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Comunidad
          </h1>
          <p className="text-lg text-gray-500">
            Compartí experiencias, hacé consultas y conectá con otras personas.
          </p>
        </div>
        <button
          onClick={() => setShowNewTopic(!showNewTopic)}
          className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-pink-200 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
          Nuevo tema
        </button>
      </header>

      {showNewTopic && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>
          )}
          <input
            placeholder="Título del tema"
            className="w-full border-gray-200 rounded-lg text-lg font-bold focus:ring-pink-500 focus:border-pink-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Contá tu experiencia, duda o reflexión..."
            className="w-full border-gray-200 rounded-lg h-32 focus:ring-pink-500 focus:border-pink-500"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <div className="flex items-center gap-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border-gray-200 rounded-lg text-sm focus:ring-pink-500 focus:border-pink-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all"
            >
              {submitting ? "Publicando..." : "Publicar tema"}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeCategory === "all"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          Todos
        </button>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? `${cat.color} shadow-md border border-transparent`
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{cat.icon}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((topic) => (
            <Link
              key={topic.id}
              href={`/consultantes/comunidad/${topic.id}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      CATEGORY_COLORS[topic.category] || "bg-gray-100 text-gray-700"
                    }`}>
                      <span className="material-symbols-outlined text-xs">{CATEGORY_ICONS[topic.category] || "forum"}</span>
                      {CATEGORY_LABELS[topic.category] || topic.category}
                    </span>
                    {topic.is_pinned && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                        📌 Fijado
                      </span>
                    )}
                    {topic.is_closed && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Cerrado
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{topic.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                    {topic.content}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span>
                      por {topic.profiles?.full_name || "Anónimo"}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(topic.last_activity_at), { locale: es, addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <span className="text-2xl font-bold text-gray-900">{topic.reply_count}</span>
                  <p className="text-xs text-gray-400">respuestas</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
            <span className="material-symbols-outlined text-4xl block mb-2">forum</span>
            No hay temas en esta categoría todavía. ¡Creá el primero!
          </div>
        )}
      </div>
    </div>
  );
}
