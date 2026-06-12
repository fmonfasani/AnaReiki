"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Profile = { id: string; full_name: string | null; email: string | null };

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
  unread_count: number;
  last_message: { content: string; sender_id: string; created_at: string } | null;
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_profile: Profile | null;
};

interface MessagesClientProps {
  initialThreads: Thread[];
  userId: string;
}

export default function MessagesClient({ initialThreads, userId }: MessagesClientProps) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(t => t.id === activeThreadId) || null;
  const isParticipant = (t: Thread) => t.created_by !== userId;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeThreadId) return;
    fetch(`/api/mensajes/threads/${activeThreadId}`)
      .then(r => r.json())
      .then(json => {
        if (json.data) {
          setMessages(json.data.messages || []);
          setThreads(prev => prev.map(t =>
            t.id === activeThreadId ? { ...t, unread_count: 0 } : t
          ));
        }
      });
  }, [activeThreadId]);

  const openThread = (id: string) => {
    setActiveThreadId(id);
    setShowNewForm(false);
  };

  const handleSend = async () => {
    if (!newMsg.trim() || !activeThreadId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/mensajes/threads/${activeThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMsg }),
      });
      const json = await res.json();
      if (json.data) {
        setMessages(prev => [...prev, json.data]);
        setNewMsg("");
        setThreads(prev => prev.map(t =>
          t.id === activeThreadId ? { ...t, last_message_at: new Date().toISOString(), last_message: json.data } : t
        ));
      } else {
        setError(json.error);
      }
    } catch {
      setError("Error al enviar mensaje");
    }
    setSending(false);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/mensajes/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      const json = await res.json();
      if (json.data) {
        setNewTitle("");
        setNewContent("");
        setShowNewForm(false);
        setActiveThreadId(json.data.id);
        setMessages([]);
        fetchThreads();
      } else {
        setError(json.error);
      }
    } catch {
      setError("Error al crear chat");
    }
    setSending(false);
  };

  const toggleThreadStatus = async (threadId: string, newStatus: "open" | "closed") => {
    await fetch(`/api/mensajes/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setThreads(prev => prev.map(t =>
      t.id === threadId ? { ...t, status: newStatus } : t
    ));
  };

  const fetchThreads = async () => {
    const res = await fetch("/api/mensajes/threads");
    const json = await res.json();
    if (json.data) setThreads(json.data);
  };

  const otherProfile = (t: Thread) => isParticipant(t) ? t.created_by_profile : t.participant_profile;
  const otherName = (t: Thread) => {
    const p = otherProfile(t);
    return p?.full_name || p?.email || "Usuario";
  };

  const unreadTotal = threads.reduce((s, t) => s + t.unread_count, 0);

  return (
    <div className="flex flex-col md:flex-row gap-0 md:gap-4 h-[calc(100vh-8rem)]">
      {/* Sidebar: thread list */}
      <div className="w-full md:w-80 shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Chats</h2>
            <p className="text-xs text-gray-400">{threads.length} conversaciones</p>
          </div>
          <button
            onClick={() => { setShowNewForm(!showNewForm); setActiveThreadId(null); }}
            className="bg-pink-600 hover:bg-pink-700 text-white p-2 rounded-xl text-sm transition-all"
          >
            <span className="material-symbols-outlined text-lg">edit_note</span>
          </button>
        </div>

        {showNewForm && (
          <form onSubmit={handleCreateThread} className="p-4 border-b border-gray-100 space-y-2 bg-pink-50/50">
            {error && <p className="text-xs text-red-600">{error}</p>}
            <input
              placeholder="Título / tema"
              className="w-full border-gray-200 rounded-lg text-sm focus:ring-pink-500"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Escribí tu mensaje..."
              className="w-full border-gray-200 rounded-lg text-sm h-20 resize-none focus:ring-pink-500"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              required
            />
            <button type="submit" disabled={sending}
              className="w-full bg-pink-600 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50">
              {sending ? "Creando..." : "Iniciar chat"}
            </button>
          </form>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <span className="material-symbols-outlined text-3xl block mb-2">chat</span>
              No tenés conversaciones
            </div>
          ) : threads.map(t => (
            <button
              key={t.id}
              onClick={() => openThread(t.id)}
              className={`w-full text-left p-4 transition-all hover:bg-gray-50 ${
                activeThreadId === t.id ? "bg-pink-50 border-l-4 border-l-pink-600" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 truncate">{t.title}</span>
                    {t.status === "closed" && (
                      <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Cerrado</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{otherName(t)}</p>
                  {t.last_message && (
                    <p className="text-xs text-gray-400 truncate mt-1">{t.last_message.content}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <span className="text-[10px] text-gray-400">
                    {t.last_message_at ? format(new Date(t.last_message_at), "dd/MM", { locale: es }) : ""}
                  </span>
                  {t.unread_count > 0 && (
                    <span className="bg-pink-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                      {t.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        {activeThread ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">{activeThread.title}</h3>
                <p className="text-xs text-gray-500">
                  Chat con {otherName(activeThread)}
                  {activeThread.status === "closed" && " · Cerrado"}
                </p>
              </div>
              <button
                onClick={() => toggleThreadStatus(activeThread.id, activeThread.status === "open" ? "closed" : "open")}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
                  activeThread.status === "open"
                    ? "border-gray-200 text-gray-500 hover:bg-gray-50"
                    : "border-green-200 text-green-700 hover:bg-green-50"
                }`}
              >
                {activeThread.status === "open" ? "Cerrar chat" : "Reabrir chat"}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Sin mensajes todavía. Escribí algo para empezar.
                </div>
              ) : messages.map(m => {
                const isMine = m.sender_id === userId;
                return (
                  <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? "bg-pink-600 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      <div className={`text-[10px] mt-1 flex items-center gap-1 ${
                        isMine ? "text-pink-200" : "text-gray-400"
                      }`}>
                        {format(new Date(m.created_at), "HH:mm", { locale: es })}
                        {isMine && (
                          <span className="material-symbols-outlined text-[10px]">
                            {m.read_at ? "done_all" : "done"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 shrink-0">
              {activeThread.status === "closed" ? (
                <p className="text-sm text-gray-400 text-center">
                  Este chat está cerrado.{' '}
                  <button onClick={() => toggleThreadStatus(activeThread.id, "open")}
                    className="text-pink-600 hover:underline font-medium">Reabrirlo</button>
                </p>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Escribí un mensaje..."
                    className="flex-1 border-gray-200 rounded-xl text-sm focus:ring-pink-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMsg.trim()}
                    className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white p-2.5 rounded-xl transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl block mb-3">chat</span>
              <p className="text-sm">Seleccioná un chat o iniciá uno nuevo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
