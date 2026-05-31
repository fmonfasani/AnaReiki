"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";
import { motion } from "framer-motion";
import MoodTracker from "@/components/MoodTracker";
import MoodChart from "@/components/MoodChart";
import { useRouter } from "next/navigation";

type Reflection = Database["public"]["Tables"]["daily_reflections"]["Row"];
type SessionNote = Database["public"]["Tables"]["session_notes"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

export default function EvolutionPage() {
  const router = useRouter();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"mood" | "timeline" | "insights">("mood");
  const [insights, setInsights] = useState<{ summary: string; trend: string; suggestion: string } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);

      const [reflectionsData, notesData, appointmentsData] = await Promise.all([
        supabase
          .from("daily_reflections")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("session_notes")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_private", false)
          .order("created_at", { ascending: false }),
        supabase
          .from("appointments")
          .select("*")
          .eq("client_id", user.id)
          .order("start_time", { ascending: false })
          .limit(10),
      ]);

      if (reflectionsData.data) setReflections(reflectionsData.data);
      if (notesData.data) setNotes(notesData.data);
      if (appointmentsData.data) setAppointments(appointmentsData.data);
    } catch (err) {
      console.error("Error fetching evolution data:", err);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const allTimelineItems = [
    ...reflections.map((r) => ({
      id: r.id,
      date: r.created_at,
      type: "mood" as const,
      mood_score: r.mood_score,
      intention: r.intention,
    })),
    ...notes.map((n) => ({
      id: n.id,
      date: n.created_at,
      type: "note" as const,
      content: n.content,
    })),
    ...appointments.map((a) => ({
      id: a.id,
      date: a.start_time,
      type: "appointment" as const,
      status: a.status,
    })),
  ].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
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

      {/* Tabs: Mood vs Timeline */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("mood")}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === "mood"
              ? "text-pink-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Ánimo
          {activeTab === "mood" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === "timeline"
              ? "text-pink-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Línea de Tiempo
          {activeTab === "timeline" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("insights");
            if (!insights) {
              setInsightsLoading(true);
              fetch("/api/ai/insights")
                .then((r) => r.json())
                .then((d) => setInsights(d))
                .catch(() => setInsights({ summary: "Error al obtener insights.", trend: "error", suggestion: "" }))
                .finally(() => setInsightsLoading(false));
            }
          }}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === "insights"
              ? "text-pink-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Insights IA
          {activeTab === "insights" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-600 rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === "mood" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            {userId && <MoodTracker userId={userId} />}
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <MoodChart data={reflections} />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 font-display">
                Últimos registros
              </h3>
              <div className="space-y-3">
                {reflections.length > 0 ? (
                  reflections.slice(0, 7).map((ref) => (
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
                              &quot;{ref.intention}&quot;
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

            <div className="space-y-6">
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
                    Aquí aparecerán las notas, recomendaciones y ejercicios que
                    Ana te deje después de cada sesión personalizada.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-pink-200" />

          <div className="space-y-6">
            {allTimelineItems.length > 0 ? (
              allTimelineItems.map((item) => (
                <div key={item.id} className="relative pl-16">
                  <div className="absolute left-4 w-4 h-4 rounded-full bg-white border-2 border-pink-500 mt-1.5 shadow-sm" />

                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      {item.type === "mood" && (
                        <>
                          <span className="text-lg">
                            {getMoodEmoji(item.mood_score!)}
                          </span>
                          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                            Estado de Ánimo
                          </span>
                        </>
                      )}
                      {item.type === "note" && (
                        <>
                          <span className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-xs font-bold">
                            A
                          </span>
                          <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">
                            Nota de Sesión
                          </span>
                        </>
                      )}
                      {item.type === "appointment" && (
                        <>
                          <span className="material-symbols-outlined text-lg text-teal-600">
                            event
                          </span>
                          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                            Cita {item.status}
                          </span>
                        </>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(item.date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>

                    {item.type === "mood" && item.intention && (
                      <p className="text-sm text-gray-600 italic">
                        &quot;{item.intention}&quot;
                      </p>
                    )}
                    {item.type === "note" && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {(item as typeof item & { content: string }).content}
                      </p>
                    )}
                    {item.type === "appointment" && (
                      <p className="text-sm text-gray-500">
                        Sesión de Reiki el{" "}
                        {new Date(item.date).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        hs
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2">
                  timeline
                </span>
                <p>Aún no hay actividad registrada.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "insights" && (
        <div className="space-y-6">
          {insightsLoading ? (
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-12 text-center">
              <div className="flex justify-center gap-2 mb-4">
                <span className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" />
                <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-3 h-3 bg-pink-600 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
              <p className="text-gray-400 text-sm">
                Analizando tu evolución...
              </p>
            </div>
          ) : insights ? (
            <>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🧠</span>
                  <h3 className="text-lg font-bold text-gray-900 font-display">
                    Resumen de tu evolución
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {insights.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📈</span>
                    <h4 className="font-bold text-gray-900">Tendencia</h4>
                  </div>
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                    insights.trend === "mejorando"
                      ? "bg-green-100 text-green-700"
                      : insights.trend === "estable"
                        ? "bg-blue-100 text-blue-700"
                        : insights.trend === "variable"
                          ? "bg-amber-100 text-amber-700"
                          : insights.trend === "decreciente"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-500"
                  }`}>
                    {insights.trend === "mejorando"
                      ? "Mejorando ✨"
                      : insights.trend === "estable"
                        ? "Estable 🌿"
                        : insights.trend === "variable"
                          ? "Variable 🌊"
                          : insights.trend === "decreciente"
                            ? "Requiere atención 💛"
                            : "Sin datos"}
                  </span>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">💡</span>
                    <h4 className="font-bold text-gray-900">Sugerencia</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {insights.suggestion}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-12 text-center">
              <span className="text-4xl block mb-4">🧘</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Registrá tu ánimo para obtener insights
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Necesitamos al menos 3 registros de ánimo para empezar a
                analizar patrones y ofrecerte recomendaciones personalizadas.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
