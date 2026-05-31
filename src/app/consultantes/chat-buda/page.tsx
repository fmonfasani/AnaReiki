"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "¿Cómo puedo manejar mi ansiedad?",
  "¿Qué ejercicio de respiración me recomienda?",
  "No estoy durmiendo bien estos días",
  "¿Cómo puedo conectar con mi energía interior?",
  "Quiero empezar a meditar, ¿por dónde empiezo?",
];

export default function ChatIAPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hola ✨ Soy Ana, tu guía en este camino de sanación. Contame cómo te sentís hoy, qué te trae por acá, o hacé cualquier pregunta que tengas. Estoy acá para acompañarte.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    setShowSuggestions(false);
    const userMsg: Message = { role: "user", content: content.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              data.error || "Lo siento, hubo un error. ¿Podés intentar de nuevo?",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Lo siento, hubo un error de conexión. ¿Podés intentar de nuevo?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto">
      <header className="mb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Chat Buda 🪷
        </h1>
        <p className="text-gray-500">
          Conversá con Ana como si estuvieras en sesión.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-pink-600 text-white rounded-br-md"
                    : "bg-white border border-gray-100 shadow-sm rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" && (
                  <span className="text-[10px] font-bold text-pink-600 uppercase tracking-wider block mb-1">
                    Ana
                  </span>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md p-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-2 h-2 bg-pink-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showSuggestions && messages.length === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-left p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50/50 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="pt-4 border-t border-gray-100 mt-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu mensaje..."
            rows={1}
            disabled={loading}
            className="flex-1 p-3 rounded-xl border border-gray-200 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent disabled:opacity-50"
            style={{ minHeight: 44, maxHeight: 120 }}
            onInput={(e) => {
              const el = e.target as HTMLTextAreaElement;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="p-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
