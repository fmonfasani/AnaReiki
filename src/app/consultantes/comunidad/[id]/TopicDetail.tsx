"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { createReply, closeTopic, pinTopic, deleteTopic, deleteReply } from "@/actions/community";
import { useRouter } from "next/navigation";

type Topic = {
  id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  is_closed: boolean;
  reply_count: number;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

type Reply = {
  id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

interface TopicDetailProps {
  topic: Topic;
  replies: Reply[];
  userId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "General", reiki: "Reiki", meditacion: "Meditación",
  yoga: "Yoga", experiencias: "Experiencias", consultas: "Consultas",
};

const CATEGORY_ICONS: Record<string, string> = {
  general: "forum", reiki: "self_improvement", meditacion: "auto_awesome",
  yoga: "sunny", experiencias: "diversity_3", consultas: "help",
};

export default function TopicDetail({ topic, replies, userId }: TopicDetailProps) {
  const router = useRouter();
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthor = topic.profiles && userId === topic.profiles.full_name;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await createReply({ topicId: topic.id, content: replyContent });
    if (result.error) setError(result.error);
    else setReplyContent("");
    setSubmitting(false);
  };

  const handleClose = async () => {
    if (confirm("¿Cerrar este tema? Ya no se podrán agregar respuestas.")) {
      await closeTopic(topic.id);
    }
  };

  const handleDelete = async () => {
    if (confirm("¿Eliminar este tema permanentemente?")) {
      await deleteTopic(topic.id);
      router.push("/consultantes/comunidad");
    }
  };

  const handlePin = async () => {
    await pinTopic(topic.id, !topic.is_pinned);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <nav>
        <Link
          href="/consultantes/comunidad"
          className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-pink-600 transition-colors group"
        >
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
          Volver al foro
        </Link>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-sm text-gray-400">
            {CATEGORY_ICONS[topic.category] || "forum"}
          </span>
          <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">
            {CATEGORY_LABELS[topic.category] || topic.category}
          </span>
          {topic.is_pinned && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">📌 Fijado</span>
          )}
          {topic.is_closed && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Cerrado</span>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">{topic.title}</h1>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{topic.content}</p>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">
              {(topic.profiles?.full_name || "A")[0]}
            </div>
            <div>
              <p className="font-medium text-gray-700">{topic.profiles?.full_name || "Anónimo"}</p>
              <p className="text-xs">
                {format(new Date(topic.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {topic.is_closed && (
              <button onClick={handlePin} className="text-xs text-gray-400 hover:text-amber-600 px-2 py-1 rounded-lg hover:bg-amber-50">
                {topic.is_pinned ? "Desfijar" : "Fijar"}
              </button>
            )}
            <button onClick={handleDelete} className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50">
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 font-display">
        Respuestas ({replies.length})
      </h2>

      <div className="space-y-4">
        {replies.map((reply) => (
          <div key={reply.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="font-medium text-gray-600">
                  {reply.profiles?.full_name || "Anónimo"}
                </span>
                <span>
                  {formatDistanceToNow(new Date(reply.created_at), { locale: es, addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!topic.is_closed && (
        <form onSubmit={handleReply} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>
          )}
          <h3 className="font-bold text-gray-900">Responder</h3>
          <textarea
            placeholder="Escribí tu respuesta..."
            className="w-full border-gray-200 rounded-lg h-28 focus:ring-pink-500 focus:border-pink-500"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            required
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !replyContent.trim()}
              className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all"
            >
              {submitting ? "Enviando..." : "Publicar respuesta"}
            </button>
            {!topic.is_closed && (
              <button type="button" onClick={handleClose} className="text-sm text-gray-400 hover:text-gray-600 px-4">
                Cerrar tema
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
