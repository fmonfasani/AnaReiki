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
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Temas creados por consultantes en el foro de discusión. Podés fijar, cerrar o eliminar temas.
          </p>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-50">
            {topics.length > 0 ? topics.map((topic) => (
              <div key={topic.id} className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${topic.is_closed ? "bg-gray-300" : "bg-green-400"}`} />
                    <span className="font-medium text-gray-900 text-sm truncate">{topic.title}</span>
                    {topic.is_pinned && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">📌 Fijado</span>}
                    {topic.is_closed && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Cerrado</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="text-pink-600 font-medium">Tema</span>
                    <span>por {topic.profiles?.full_name || "Anónimo"}</span>
                    <span className="text-gray-300">|</span>
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
        </div>
      )}

      {tab === "messages" && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Mensajes directos que los consultantes te enviaron. Respondé desde acá.
          </p>
          {unreplied.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-4">
              <span className="font-bold">{unreplied.length}</span> mensajes sin leer de consultantes
            </div>
          )}
          <div className="space-y-3">
            {messages.filter(m => m.sender_id !== adminId).length > 0 ? (
              <>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Recibidos</h3>
                {messages.filter(m => m.sender_id !== adminId).map((msg) => (
                  <div key={msg.id} className="bg-white rounded-2xl border p-5 shadow-sm border-pink-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">Consulta</span>
                        <p className="font-medium text-gray-900 text-sm">
                          {msg.sender?.full_name || msg.sender?.email || "Miembro"}
                        </p>
                        {!msg.read_at && <span className="w-2 h-2 rounded-full bg-pink-500" />}
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: es })}
                      </span>
                    </div>
                    {msg.subject && <p className="text-xs text-gray-500 font-medium mb-1">{msg.subject}</p>}
                    <p className="text-sm text-gray-600">{msg.content}</p>
                    <div className="mt-3">
                      {replyId === msg.id ? (
                        <div className="flex gap-2">
                          <input placeholder="Escribí tu respuesta..." className="flex-1 border-gray-200 rounded-lg text-sm"
                            value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                          <button onClick={() => handleReplyMessage(msg.sender_id)}
                            className="bg-pink-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Enviar</button>
                          <button onClick={() => { setReplyId(null); setReplyText(""); }}
                            className="text-gray-400 text-xs">Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => setReplyId(msg.id)}
                          className="text-xs text-pink-600 font-medium hover:underline">Responder</button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-center py-8 text-gray-400">No hay mensajes de consultantes.</p>
            )}
            {messages.filter(m => m.sender_id === adminId).length > 0 && (
              <>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mt-8">Mis respuestas</h3>
                {messages.filter(m => m.sender_id === adminId).map((msg) => (
                  <div key={msg.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">Respondido</span>
                        <p className="font-medium text-gray-900 text-sm">
                          Para: {msg.receiver?.full_name || "Miembro"}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: es })}
                      </span>
                    </div>
                    {msg.subject && <p className="text-xs text-gray-500 font-medium mb-1">{msg.subject}</p>}
                    <p className="text-sm text-gray-600">{msg.content}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {tab === "comments" && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Comentarios que los consultantes dejan en los contenidos de la biblioteca (videos, podcasts, etc.).
          </p>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-50">
            {comments.length > 0 ? comments.map((comment) => (
              <div key={comment.id} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Comentario</span>
                  <span className="text-xs text-gray-500">
                    {comment.profiles?.full_name || "Anónimo"} en <span className="font-medium text-gray-700">{comment.content?.title || "contenido"}</span>
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {formatDistanceToNow(new Date(comment.created_at), { locale: es, addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 ml-1">{comment.text}</p>
              </div>
            )) : (
              <div className="p-12 text-center text-gray-400">No hay comentarios.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
