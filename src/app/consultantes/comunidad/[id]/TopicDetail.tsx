"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  createReply,
  closeTopic,
  pinTopic,
  deleteTopic,
  deleteReply,
  sendMessage,
} from "@/actions/community";
import { useRouter } from "next/navigation";

type Topic = {
  id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  is_closed: boolean;
  reply_count: number;
  author_id: string;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

type Reply = {
  id: string;
  content: string;
  parent_id: string | null;
  author_id: string;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

interface TopicDetailProps {
  topic: Topic;
  replies: Reply[];
  userId: string;
  isAdmin: boolean;
}

const CATEGORY_STYLES: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  general:     { label: "General",     icon: "forum",            bg: "bg-gray-100", text: "text-gray-700" },
  reiki:       { label: "Reiki",       icon: "self_improvement", bg: "bg-purple-100", text: "text-purple-700" },
  meditacion:  { label: "Meditación",  icon: "auto_awesome",     bg: "bg-blue-100", text: "text-blue-700" },
  yoga:        { label: "Yoga",        icon: "sunny",            bg: "bg-amber-100", text: "text-amber-700" },
  experiencias:{ label: "Experiencias",icon: "diversity_3",      bg: "bg-green-100", text: "text-green-700" },
  consultas:   { label: "Consultas",   icon: "help",             bg: "bg-pink-100", text: "text-pink-700" },
};

export default function TopicDetail({ topic, replies, userId, isAdmin }: TopicDetailProps) {
  const router = useRouter();
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privateMsg, setPrivateMsg] = useState(false);
  const [privateContent, setPrivateContent] = useState("");

  const cat = CATEGORY_STYLES[topic.category] || CATEGORY_STYLES.general;

  const canDeleteTopic = topic.author_id === userId || isAdmin;
  const canDeleteReply = (replyAuthorId: string) => replyAuthorId === userId || isAdmin;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await createReply({ topicId: topic.id, content: replyContent });
    if (result.error) setError(result.error);
    else {
      setReplyContent("");
      router.refresh();
    }
    setSubmitting(false);
  };

  const handlePrivateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateContent.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await sendMessage({
      receiverId: topic.author_id,
      subject: `Re: ${topic.title}`,
      content: privateContent,
    });
    if (result.error) setError(result.error);
    else {
      setPrivateContent("");
      setPrivateMsg(false);
    }
    setSubmitting(false);
  };

  const handleClose = async () => {
    if (confirm("¿Cerrar este tema? Ya no se podrán agregar respuestas.")) {
      await closeTopic(topic.id);
      router.refresh();
    }
  };

  const handleDeleteTopic = async () => {
    if (confirm("¿Eliminar este tema permanentemente?")) {
      await deleteTopic(topic.id);
      router.push("/consultantes/comunidad");
    }
  };

  const handlePin = async () => {
    await pinTopic(topic.id, !topic.is_pinned);
    router.refresh();
  };

  const handleDeleteReply = async (replyId: string) => {
    if (confirm("¿Eliminar esta respuesta?")) {
      await deleteReply(replyId);
      router.refresh();
    }
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
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cat.bg} ${cat.text}`}>
            <span className="material-symbols-outlined text-sm">{cat.icon}</span>
            {cat.label}
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
            {isAdmin && (
              <button onClick={handlePin} className="text-xs text-gray-400 hover:text-amber-600 px-2 py-1 rounded-lg hover:bg-amber-50">
                {topic.is_pinned ? "Desfijar" : "Fijar"}
              </button>
            )}
            {isAdmin && !topic.is_closed && (
              <button onClick={handleClose} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50">
                Cerrar
              </button>
            )}
            {canDeleteTopic && (
              <button onClick={handleDeleteTopic} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50">
                Eliminar
              </button>
            )}
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
              {canDeleteReply(reply.author_id) && (
                <button
                  onClick={() => handleDeleteReply(reply.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!topic.is_closed && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>
          )}

          {isAdmin && (
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => { setPrivateMsg(false); setError(null); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!privateMsg ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                Responder público
              </button>
              <button
                type="button"
                onClick={() => { setPrivateMsg(true); setError(null); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${privateMsg ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                Responder en privado
              </button>
            </div>
          )}

          {privateMsg ? (
            <form onSubmit={handlePrivateReply}>
              <h3 className="font-bold text-gray-900 mb-2">
                Mensaje privado para {topic.profiles?.full_name || "el autor"}
              </h3>
              <textarea
                placeholder="Escribí tu mensaje privado..."
                className="w-full border-gray-200 rounded-lg h-28 focus:ring-pink-500 focus:border-pink-500"
                value={privateContent}
                onChange={(e) => setPrivateContent(e.target.value)}
                required
              />
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={submitting || !privateContent.trim()}
                  className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all"
                >
                  {submitting ? "Enviando..." : "Enviar mensaje privado"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReply}>
              <h3 className="font-bold text-gray-900">Responder públicamente</h3>
              <textarea
                placeholder="Escribí tu respuesta..."
                className="w-full border-gray-200 rounded-lg h-28 focus:ring-pink-500 focus:border-pink-500 mt-4"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                required
              />
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all"
                >
                  {submitting ? "Enviando..." : "Publicar respuesta"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
