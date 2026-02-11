"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";
import { motion } from "framer-motion";
import MoodTracker from "@/components/MoodTracker";

type Reflection = Database["public"]["Tables"]["daily_reflections"]["Row"];
type SessionNote = Database["public"]["Tables"]["session_notes"]["Row"];

export default function EvolutionPage() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Parallel fetching
    const [reflectionsData, notesData] = await Promise.all([
      supabase
        .from("daily_reflections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(7),
      supabase
        .from("session_notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_private", false)
        .order("created_at", { ascending: false }),
    ]);

    if (reflectionsData.data) setReflections(reflectionsData.data);
    if (notesData.data) setNotes(notesData.data);
    setLoading(false);
  };

  const getMoodEmoji = (score: number) => {
    switch (score) {
      case 1:
        return "😫";
      case 2:
        return "😕";
      case 3:
        return "😐";
      case 4:
        return "🙂";
      case 5:
        return "🤩";
      default:
        return "❓";
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-400">
        Cargando tu evolución...
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
          Mi Evolución 🌿
        </h1>
        <p className="text-lg text-gray-500">
          Un registro de tu camino interior y tu bienestar emocional.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Tracker & Historial */}
        <div className="lg:col-span-1 space-y-8">
          {userId && <MoodTracker userId={userId} />}

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 font-display">
              Últimos 7 días
            </h3>
            <div className="space-y-3">
              {reflections.length > 0 ? (
                reflections.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getMoodEmoji(ref.mood_score)}
                      </span>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                          {new Date(ref.created_at).toLocaleDateString(
                            "es-ES",
                            { weekday: "short", day: "numeric" },
                          )}
                        </p>
                        {ref.intention && (
                          <p className="text-sm text-gray-600 truncate max-w-[150px] italic">
                            "{ref.intention}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  Aún no hay registros.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Notas de Sesión */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-2xl font-bold text-gray-900 font-display">
            Notas de tus Sesiones
          </h3>

          {notes.length > 0 ? (
            <div className="grid gap-6">
              {notes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-2xl border border-pink-100 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-bl-full -mr-10 -mt-10 opacity-50 z-0"></div>

                  <div className="relative z-10">
                    <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 text-xs font-bold rounded-full mb-3">
                      Sesión del{" "}
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    <div className="prose prose-pink prose-sm max-w-none text-gray-600">
                      <p>{note.content}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                        {/* Placeholder for teacher avatar */}
                        <div className="w-full h-full bg-pink-600 flex items-center justify-center text-white text-[10px] font-bold">
                          A
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-900">
                        Ana Murat
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
                🪶
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Tu bitácora está vacía por ahora
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Aquí aparecerán las notas, recomendaciones y ejercicios que Ana
                te deje después de cada sesión personalizada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
