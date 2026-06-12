"use client";

import React, { useState, useEffect, useRef } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Profile = { id: string; full_name: string | null; email: string | null };

type Topic = {
  id: string;
  title: string;
  category: string;
  is_pinned: boolean;
  is_closed: boolean;
  reply_count: number;
  last_activity_at: string;
  created_at: string;
  profiles?: Profile | null;
};

type Thread = {
  id: string;
  title: string;
  created_by: string;
  participant_id: string;
  status: "open" | "closed";
  last_message_at: string;
  created_at: string;
  created_by_profile: Profile | null;
  participant_profile: Profile | null;
};

type Comment = {
  id: string;
  text: string;
  created_at: string;
  content?: { title: string } | null;
  profiles?: Profile | null;
};

type ChatMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_profile?: Profile | null;
};

interface AdminCommunityProps {
  topics: Topic[];
  threads: Thread[];
  comments: Comment[];
  adminId: string;
}

export default function AdminCommunity({
  topics,
  threads,
  comments,
  adminId,
}: AdminCommunityProps) {
  const [tab, setTab] = useState<"topics" | "messages" | "comments">("topics");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const unreadCount = threads.filter(t => t.status === "open").length;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeThreadId) return;
    fetch(`/api/mensajes/threads/${activeThreadId}`)
      .then(r => r.json())
      .then(json => {
        if (json.data) setMessages(json.data.messages || []);
      });
  }, [activeThreadId]);

  const handleSend = async () => {
    if (!replyText.trim() || !activeThreadId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/mensajes/threads/${activeThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText }),
      });
      const json = await res.json();
      if (json.data) {
        setMessages(prev => [...prev, json.data]);
        setReplyText("");
      }
    } catch {}
    setSending(false);
  };

  const toggleStatus = async (threadId: string) => {
    const t = threads.find(x => x.id === threadId);
    if (!t) return;
    const newStatus = t.status === "open" ? "closed" : "open";
    await fetch(`/api/mensajes/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    window.location.reload();
  };

  const otherProfile = (t: Thread) =>
    t.created_by === adminId ? t.participant_profile : t.created_by_profile;

  const otherName = (t: Thread) => {
    const p = otherProfile(t);
    return p?.full_name || p?.email || "Usuario";
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
          { key: "messages", label: "Mensajes", icon: "chat", count: unreadCount },
          { key: "comments", label: "Comentarios", icon: "comment", count: comments.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key as typeof tab); setActiveThreadId(null); }}
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
            Temas creados por consultantes en el foro de discusión.
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
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-16rem)]">
          {/* Thread list */}
          <div className="w-full md:w-72 shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Conversaciones</h3>
              <p className="text-xs text-gray-400">{threads.length} chats</p>
            </div>
            {threads.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No hay conversaciones</div>
            ) : threads.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`w-full text-left p-3 transition-all hover:bg-gray-50 ${
                  activeThreadId === t.id ? "bg-pink-50 border-l-4 border-l-pink-600" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-700 shrink-0">
                    {otherName(t).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                    <p className="text-xs text-gray-500 truncate">{otherName(t)}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    t.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {t.status === "open" ? "Abierto" : "Cerrado"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Chat */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            {activeThreadId ? (() => {
              const t = threads.find(x => x.id === activeThreadId);
              if (!t) return null;
              return (
                <>
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                      <h4 className="font-bold text-gray-900">{t.title}</h4>
                      <p className="text-xs text-gray-500">
                        {otherName(t)} · {t.status === "open" ? "Abierto" : "Cerrado"}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleStatus(t.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium border ${
                        t.status === "open"
                          ? "border-gray-200 text-gray-500 hover:bg-gray-50"
                          : "border-green-200 text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {t.status === "open" ? "Cerrar" : "Reabrir"}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 text-sm">Cargando mensajes...</div>
                    ) : messages.map(m => {
                      const isMine = m.sender_id === adminId;
                      return (
                        <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isMine
                              ? "bg-pink-600 text-white rounded-br-md"
                              : "bg-gray-100 text-gray-800 rounded-bl-md"
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                            <div className={`text-[10px] mt-1 ${isMine ? "text-pink-200" : "text-gray-400"}`}>
                              {format(new Date(m.created_at), "HH:mm", { locale: es })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-100 shrink-0">
                    {t.status === "closed" ? (
                      <p className="text-sm text-gray-400 text-center">Chat cerrado.</p>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                          placeholder="Escribí tu respuesta..."
                          className="flex-1 border-gray-200 rounded-xl text-sm focus:ring-pink-500"
                        />
                        <button
                          onClick={handleSend}
                          disabled={sending || !replyText.trim()}
                          className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white p-2.5 rounded-xl transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">send</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              );
            })() : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <span className="material-symbols-outlined text-5xl block mb-3">chat</span>
                  <p className="text-sm">Seleccioná una conversación para ver los mensajes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "comments" && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Comentarios que los consultantes dejan en los contenidos de la biblioteca.
          </p>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-50">
            {comments.length > 0 ? comments.map((comment) => (
              <div key={comment.id} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Comentario</span>
                  <span className="text-xs text-gray-500">
                    {comment.profiles?.full_name || "Anónimo"} en{" "}
                    <span className="font-medium text-gray-700">{comment.content?.title || "contenido"}</span>
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
