"use client";

import React, { useState } from "react";

export default function EmailMarketingForm() {
  const [segment, setSegment] = useState("all");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    sent?: number;
    failed?: number;
    total?: number;
    error?: string;
    warning?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/email-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment, subject, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data.error || "Error al enviar" });
      } else {
        setResult(data);
        if (data.success) {
          setSubject("");
          setContent("");
        }
      }
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : "Error de red",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Segmento
        </label>
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
        >
          <option value="all">Todos los consultantes</option>
          <option value="premium">Solo Premium</option>
          <option value="free">Solo Gratuitos</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Asunto
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
          placeholder="Ej: Nueva meditación disponible ✨"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contenido
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500 h-48"
          placeholder="Escribí el contenido del email... (texto plano, los saltos de línea se mantienen)"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          El saludo y footer se agregan automáticamente.
        </p>
      </div>

      {result && (
        <div
          className={`p-4 rounded-xl text-sm ${
            result.error
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
            {result.error
              ? `Error: ${result.error}`
              : `✅ Procesado: ${result.sent} enviados, ${result.failed || 0} fallaron (${result.total} total)`
            }
            {(result as any).warning && (
              <p className="text-amber-700 mt-2">⚠️ {(result as any).warning}</p>
            )}
        </div>
      )}

      <button
        type="submit"
        disabled={sending || !subject || !content}
        className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-pink-200"
      >
        {sending
          ? "Enviando..."
          : `Enviar a ${segment === "all" ? "todos" : segment === "premium" ? "Premium" : "Gratuitos"}`}
      </button>
    </form>
  );
}
