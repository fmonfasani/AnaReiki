"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const MOODS = [
  { score: 1, emoji: "😫", label: "Difícil" },
  { score: 2, emoji: "😕", label: "Bajo" },
  { score: 3, emoji: "😐", label: "Neutral" },
  { score: 4, emoji: "🙂", label: "Bien" },
  { score: 5, emoji: "🤩", label: "Excelente" },
];

export default function MoodTracker({ userId }: { userId: string }) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [intention, setIntention] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Check if already submitted today
  useEffect(() => {
    checkTodayEntry();
  }, []);

  const checkTodayEntry = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("daily_reflections")
      .select("mood_score")
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00`)
      .maybeSingle();

    if (data) {
      setHasSubmitted(true);
      setSelectedMood(data.mood_score);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMood) return;
    setLoading(true);

    const { error } = await supabase.from("daily_reflections").insert([
      {
        user_id: userId,
        mood_score: selectedMood,
        intention: intention || null,
      },
    ]);

    setLoading(false);
    if (!error) setHasSubmitted(true);
  };

  if (hasSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border border-pink-100 shadow-sm text-center"
      >
        <div className="text-4xl mb-2">✨</div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          ¡Registro completado!
        </h3>
        <p className="text-gray-500 text-sm">
          Gracias por tomarte un momento para conectar contigo hoy.
        </p>
        {selectedMood && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium text-pink-700 shadow-sm border border-pink-50">
            Tu estado hoy:{" "}
            <span className="text-xl">
              {MOODS.find((m) => m.score === selectedMood)?.emoji}
            </span>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-1 font-display">
        ¿Cómo te sientes hoy?
      </h3>
      <p className="text-gray-500 text-sm mb-6">
        Registra tu energía para ver tu evolución.
      </p>

      <div className="flex justify-between mb-8">
        {MOODS.map((mood) => (
          <button
            key={mood.score}
            onClick={() => setSelectedMood(mood.score)}
            className={`flex flex-col items-center gap-2 transition-all duration-300 group
               ${selectedMood === mood.score ? "scale-110" : "opacity-60 hover:opacity-100 hover:scale-105"}
            `}
          >
            <span
              className={`text-3xl filter drop-shadow-sm transition-transform duration-300 
               ${selectedMood === mood.score ? "animate-bounce-short" : ""}
            `}
            >
              {mood.emoji}
            </span>
            <span
              className={`text-xs font-medium 
               ${selectedMood === mood.score ? "text-pink-600" : "text-gray-400"}
            `}
            >
              {mood.label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedMood && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intención para hoy (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Hoy elijo la paz..."
                className="w-full border-gray-200 rounded-xl focus:ring-pink-500 focus:border-pink-500 text-sm"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-pink-200 flex items-center justify-center gap-2"
            >
              {loading ? "Guardando..." : "Registrar"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
