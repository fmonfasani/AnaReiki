"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { sendMessage, markAsRead } from "@/actions/community";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
};

interface MessagesClientProps {
  sent: Message[];
  received: Message[];
  unreadCount: number;
  userId: string;
}

export default function MessagesClient({ sent, received, unreadCount: initialUnread, userId }: MessagesClientProps) {
  const [tab, setTab] = useState<"inbox" | "sent" | "new">("inbox");
  const [allMessages, setAllMessages] = useState(received);
  const [unread, setUnread] = useState(initialUnread);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "inbox" && allMessages.length > 0) {
      const unreadIds = allMessages.filter((m) => !m.read_at).map((m) => m.id);
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
        setUnread(0);
      }
    }
  }, [tab, allMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await sendMessage({
      subject: subject || "Mensaje para Ana",
      content,
    });
    if (result.error) setError(result.error);
    else {
      setSubject("");
      setContent("");
      setTab("sent");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Mensajes
          </h1>
          <p className="text-lg text-gray-500">
            Comunicate directamente con Ana.
          </p>
        </div>
        <button
          onClick={() => setTab("new")}
          className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-pink-200 transition-all"
        >
          <span className="material-symbols-outlined">edit_note</span>
          Nuevo mensaje
        </button>
      </header>

      <div className="flex gap-2">
        {[
          { key: "inbox", label: "Recibidos", icon: "inbox", count: unread },
          { key: "sent", label: "Enviados", icon: "send" },
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
            {(t as any).count > 0 && (
              <span className="bg-white text-pink-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {(t as any).count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "new" && (
        <form onSubmit={handleSend} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 max-w-2xl">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>
          )}
          <p className="text-sm text-gray-500">
            Tu mensaje será enviado directamente a Ana. Te responderá a la brevedad.
          </p>
          <input
            placeholder="Asunto (opcional)"
            className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            placeholder="Escribí tu mensaje..."
            className="w-full border-gray-200 rounded-lg h-32 focus:ring-pink-500 focus:border-pink-500"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
          >
            {submitting ? "Enviando..." : "Enviar mensaje"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {(tab === "inbox" ? allMessages : sent).length > 0 ? (
          (tab === "inbox" ? allMessages : sent).map((msg) => (
            <div
              key={msg.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${
                !msg.read_at && tab === "inbox"
                  ? "border-pink-200 bg-pink-50/30"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  {msg.subject && (
                    <h3 className="font-bold text-gray-900">{msg.subject}</h3>
                  )}
                  <span className="text-xs text-gray-400">
                    {format(new Date(msg.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                  </span>
                </div>
                {!msg.read_at && tab === "inbox" && (
                  <span className="bg-pink-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Nuevo
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
            <span className="material-symbols-outlined text-4xl block mb-2">
              {tab === "inbox" ? "mail" : "send"}
            </span>
            {tab === "inbox" ? "No tenés mensajes recibidos." : "No enviaste mensajes todavía."}
          </div>
        )}
      </div>
    </div>
  );
}
