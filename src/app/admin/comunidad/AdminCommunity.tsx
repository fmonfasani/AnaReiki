"use client";

import React, { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { sendMessage } from "@/actions/community";

type Topic = {
  id: string;
  title: string;
  category: string;
  is_pinned: boolean;
  is_closed: boolean;
  reply_count: number;
  last_activity_at: string;
  created_at: string;
  profiles?: { full_name: string | null; email?: string | null } | null;
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
  sender?: { full_name: string | null; email?: string | null } | null;
  receiver?: { full_name: string | null; email?: string | null } | null;
};

type Comment = {
  id: string;
  text: string;
  created_at: string;
  content?: { title: string } | null;
  profiles?: { full_name: string | null; email?: string | null } | null;
};

interface AdminCommunityProps {
  topics: Topic[];
  messages: Message[];
  comments: Comment[];
  unreadMessages: number;
  adminId: string;
}

export default function AdminCommunity({
  topics,
  messages,
  comments,
  unreadMessages,
  adminId,
}: AdminCommunityProps) {
  const [tab, setTab] = useState<"topics" | "messages" | "comments">("topics");
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const unreplied = messages.filter(
    (m) => !m.read_at && m.sender_id !== adminId,
  );

  const handleReplyMessage = async (senderId: string) => {
    if (!replyText.trim()) return;
    await sendMessage({
      receiverId: senderId,
      subject: "Respuesta",
      content: replyText,
    });
    setReplyText("");
    setReplyId(null);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Comunidad
        </h1>
        <p className="text-gray-500">
          Moderá discusiones, respondé mensajes y gestioná comentarios.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "topics", label: "Foro", icon: "forum", count: topics.length },
          { key: "messages", label: "Mensajes", icon: "chat", count: unreadMessages },
          { key: "comments", label: "Comentarios", icon: "comment", count: comments.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
              tab === t.key
                ? "bg-pink-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.key
                  ? "bg-white text-pink-600"
                  : "bg-pink-100 text-pink-600"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "topics" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-50">
          {topics.length > 0 ? topics.map((topic) => (
            <div key={topic.id} className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${topic.is_closed ? "bg-gray-300" : "bg-green-400"}`} />
                  <span className="font-medium text-gray-900 text-sm truncate">{topic.title}</span>
                  {topic.is_pinned && <span className="text-xs text-amber-600">📌</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{topic.profiles?.full_name || "Anónimo"}</span>
                  <span>{topic.category}</span>
                  <span>{topic.reply_count} respuestas</span>
                  <span>{formatDistanceToNow(new Date(topic.last_activity_at), { locale: es, addSuffix: true })}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-gray-400">No hay temas en el foro.</div>
          )}
        </div>
      )}

      {tab === "messages" && (
        <div className="space-y-3">
          {unreplied.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <span className="font-bold">{unreplied.length}</span> mensajes sin leer
            </div>
          )}
          {messages.length > 0 ? messages.map((msg) => (
            <div
              key={msg.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm ${
                !msg.read_at && msg.sender_id !== adminId
                  ? "border-pink-200 bg-pink-50/30"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {msg.sender_id === adminId
                      ? `Para: ${msg.receiver?.full_name || "Miembro"}`
                      : `De: ${msg.sender?.full_name || msg.sender?.email || "Miembro"}`}
                  </p>
                  {msg.subject && (
                    <p className="text-xs text-gray-500">{msg.subject}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: es })}
                </span>
              </div>
              <p className="text-sm text-gray-600">{msg.content}</p>
              {msg.sender_id !== adminId && (
                <div className="mt-3">
                  {replyId === msg.id ? (
                    <div className="flex gap-2">
                      <input
                        placeholder="Escribí tu respuesta..."
                        className="flex-1 border-gray-200 rounded-lg text-sm"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <button
                        onClick={() => handleReplyMessage(msg.sender_id)}
                        className="bg-pink-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
                      >
                        Enviar
                      </button>
                      <button
                        onClick={() => { setReplyId(null); setReplyText(""); }}
                        className="text-gray-400 text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyId(msg.id)}
                      className="text-xs text-pink-600 font-medium hover:underline"
                    >
                      Responder
                    </button>
                  )}
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-16 text-gray-400">No hay mensajes.</div>
          )}
        </div>
      )}

      {tab === "comments" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-50">
          {comments.length > 0 ? comments.map((comment) => (
            <div key={comment.id} className="p-4">
              <p className="text-sm text-gray-700">{comment.text}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>{comment.profiles?.full_name || "Anónimo"}</span>
                <span>en {comment.content?.title || "contenido"}</span>
                <span>{formatDistanceToNow(new Date(comment.created_at), { locale: es, addSuffix: true })}</span>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-gray-400">No hay comentarios.</div>
          )}
        </div>
      )}
    </div>
  );
}
