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
type SessionHistory = {
  id: string;
  user_id: string;
  appointment_id?: string | null;
  title: string;
  content?: string | null;
  mood_before?: number | null;
  mood_after?: number | null;
  tags?: string[] | null;
  is_private?: boolean;
  created_at: string;
  updated_at?: string;
};

const MOOD_EMOJIS = ["😫", "😕", "😐", "🙂", "🤩"];

export default function EvolutionPage() {
  const router = useRouter();
  const supabase = createClient();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"mood" | "timeline" | "insights" | "journal">("mood");
  const [insights, setInsights] = useState<{ summary: string; trend: string; suggestion: string } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [journalForm, setJournalForm] = useState({ title: "", content: "", mood_before: 3, mood_after: 3, is_private: true });
  const [journalSaving, setJournalSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setUserId(user.id);

      const [reflectionsData, notesData, appointmentsData, historyData] = await Promise.all([
        supabase.from("daily_reflections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
        supabase.from("session_notes").select("*").eq("user_id", user.id).eq("is_private", false).order("created_at", { ascending: false }),
        supabase.from("appointments").select("*").eq("client_id", user.id).order("start_time", { ascending: false }).limit(10),
        fetch("/api/session-history").then((r) => r.json()),
      ]);

      if (reflectionsData.data) setReflections(reflectionsData.data);
      if (notesData.data) setNotes(notesData.data);
      if (appointmentsData.data) setAppointments(appointmentsData.data);
      if (historyData.data) setSessionHistory(historyData.data);
    } catch (err) {
      console.error("Error fetching evolution data:", err);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleJournalSubmit = async () => {
    if (!journalForm.title.trim()) return;
    setJournalSaving(true);
    try {
      await fetch("/api/session-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(journalForm),
      });
      setJournalForm({ title: "", content: "", mood_before: 3, mood_after: 3, is_private: true });
      const res = await fetch("/api/session-history");
      const json = await res.json();
      if (json.data) setSessionHistory(json.data);
    } finally {
      setJournalSaving(false);
    }
  };

  const getMoodEmoji = (score: number) => MOOD_EMOJIS[score - 1] || "❓";

  const allTimelineItems = [
    ...reflections.map((r) => ({ id: r.id, date: r.created_at, type: "mood" as const, mood_score: r.mood_score, intention: r.intention })),
    ...notes.map((n) => ({ id: n.id, date: n.created_at, type: "note" as const, content: n.content })),
    ...appointments.map((a) => ({ id: a.id, date: a.start_time, type: "appointment" as const, status: a.status })),
    ...sessionHistory.map((s) => ({ id: s.id, date: s.created_at, type: "journal" as const, title: s.title, content: s.content, mood_after: s.mood_after })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando tu evolución...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Mi Evolución 🌿</h1>
        <p className="text-lg text-gray-500">Un registro de tu camino interior y tu bienestar emocional.</p>
      </header>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        {([
          { key: "mood", label: "Ánimo" },
          { key: "timeline", label: "Línea de Tiempo" },
          { key: "insights", label: "Insights IA" },
          { key: "journal", label: "Bitácora" },
        ] as const).map((tab) => (
          <button key={tab.key} onClick={() => {
            setActiveTab(tab.key);
            if (tab.key === "insights" && !insights) {
              setInsightsLoading(true);
              fetch("/api/ai/insights").then((r) => r.json()).then((d) => setInsights(d)).catch(() => setInsights({ summary: "Error al obtener insights.", trend: "error", suggestion: "" })).finally(() => setInsightsLoading(false));
            }
          }} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === tab.key ? "text-pink-600" : "text-gray-500 hover:text-gray-700"}`}>
            {tab.label}
            {activeTab === tab.key && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-600 rounded-t-full" />}
          </button>
        ))}
      </div>

      {activeTab === "mood" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            {userId && <MoodTracker userId={userId} />}
          </div>
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <MoodChart data={reflections} />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 font-display">Últimos registros</h3>
              <div className="space-y-3">
                {reflections.length > 0 ? reflections.slice(0, 7).map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getMoodEmoji(ref.mood_score)}</span>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                          {new Date(ref.created_at).toLocaleDateString("es-ES", { weekday: "short", day: "numeric" })}
                        </p>
                        {ref.intention && <p className="text-sm text-gray-600 truncate max-w-[150px] italic">&ldquo;{ref.intention}&rdquo;</p>}
                      </div>
                    </div>
                  </div>
                )) : <p className="text-sm text-gray-400 text-center py-4">Aún no hay registros.</p>}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 font-display mb-6">Notas de tus Sesiones</h3>
              {notes.length > 0 ? (
                <div className="grid gap-6">
                  {notes.map((note, index) => (
                    <motion.div key={note.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white p-6 rounded-2xl border border-pink-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-bl-full -mr-10 -mt-10 opacity-50 z-0"></div>
                      <div className="relative z-10">
                        <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 text-xs font-bold rounded-full mb-3">Sesión del {new Date(note.created_at).toLocaleDateString()}</span>
                        <div className="prose prose-pink prose-sm max-w-none text-gray-600"><p>{note.content}</p></div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                            <div className="w-full h-full bg-pink-600 flex items-center justify-center text-white text-[10px] font-bold">A</div>
                          </div>
                          <span className="text-xs font-bold text-gray-900">Ana Murat</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">🪶</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Tu bitácora está vacía por ahora</h3>
                  <p className="text-gray-500 max-w-md mx-auto">Aquí aparecerán las notas, recomendaciones y ejercicios que Ana te deje después de cada sesión personalizada.</p>
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
            {allTimelineItems.length > 0 ? allTimelineItems.map((item) => (
              <div key={item.id} className="relative pl-16">
                <div className="absolute left-4 w-4 h-4 rounded-full bg-white border-2 border-pink-500 mt-1.5 shadow-sm" />
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    {item.type === "mood" && <><span className="text-lg">{getMoodEmoji(item.mood_score!)}</span><span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Estado de Ánimo</span></>}
                    {item.type === "note" && <><span className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-xs font-bold">A</span><span className="text-xs font-bold text-pink-600 uppercase tracking-wider">Nota de Sesión</span></>}
                    {item.type === "appointment" && <><span className="material-symbols-outlined text-lg text-teal-600">event</span><span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Cita {item.status}</span></>}
                    {item.type === "journal" && <><span className="text-lg">📝</span><span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Bitácora</span></>}
                    <span className="text-xs text-gray-400 ml-auto">{new Date(item.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                  </div>
                  {item.type === "mood" && item.intention && <p className="text-sm text-gray-600 italic">&ldquo;{item.intention}&rdquo;</p>}
                  {item.type === "note" && <p className="text-sm text-gray-600 line-clamp-3">{(item as typeof item & { content: string }).content}</p>}
                  {item.type === "appointment" && <p className="text-sm text-gray-500">Sesión de Reiki el {new Date(item.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} hs</p>}
                  {item.type === "journal" && <><p className="text-sm font-medium text-gray-800">{(item as typeof item & { title: string }).title}</p><p className="text-sm text-gray-600 line-clamp-2">{(item as typeof item & { content?: string }).content}</p></>}
                </div>
              </div>
            )) : (
              <div className="text-center py-16 text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2">timeline</span>
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
              <p className="text-gray-400 text-sm">Analizando tu evolución...</p>
            </div>
          ) : insights ? (
            <>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🧠</span>
                  <h3 className="text-lg font-bold text-gray-900 font-display">Resumen de tu evolución</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{insights.summary}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3"><span className="text-xl">📈</span><h4 className="font-bold text-gray-900">Tendencia</h4></div>
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${insights.trend === "mejorando" ? "bg-green-100 text-green-700" : insights.trend === "estable" ? "bg-blue-100 text-blue-700" : insights.trend === "variable" ? "bg-amber-100 text-amber-700" : insights.trend === "decreciente" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                    {insights.trend === "mejorando" ? "Mejorando ✨" : insights.trend === "estable" ? "Estable 🌿" : insights.trend === "variable" ? "Variable 🌊" : insights.trend === "decreciente" ? "Requiere atención 💛" : "Sin datos"}
                  </span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3"><span className="text-xl">💡</span><h4 className="font-bold text-gray-900">Sugerencia</h4></div>
                  <p className="text-gray-700 text-sm leading-relaxed">{insights.suggestion}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-12 text-center">
              <span className="text-4xl block mb-4">🧘</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Registrá tu ánimo para obtener insights</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">Necesitamos al menos 3 registros de ánimo para empezar a analizar patrones y ofrecerte recomendaciones personalizadas.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "journal" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-8">
              <h3 className="font-bold text-gray-900 mb-4 font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">edit_note</span>
                Nueva Entrada
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input value={journalForm.title} onChange={(e) => setJournalForm({ ...journalForm, title: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 text-sm" placeholder="¿Qué trabajaste hoy?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea value={journalForm.content} onChange={(e) => setJournalForm({ ...journalForm, content: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 text-sm resize-none" rows={4} placeholder="Escribí cómo te sentiste, qué aprendiste..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Antes</label>
                    <div className="flex gap-1">
                      {MOOD_EMOJIS.map((emoji, i) => (
                        <button key={i} onClick={() => setJournalForm({ ...journalForm, mood_before: i + 1 })} className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center ${journalForm.mood_before === i + 1 ? "bg-pink-100 ring-2 ring-pink-400" : "bg-gray-50 hover:bg-gray-100"}`}>{emoji}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Después</label>
                    <div className="flex gap-1">
                      {MOOD_EMOJIS.map((emoji, i) => (
                        <button key={i} onClick={() => setJournalForm({ ...journalForm, mood_after: i + 1 })} className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center ${journalForm.mood_after === i + 1 ? "bg-green-100 ring-2 ring-green-400" : "bg-gray-50 hover:bg-gray-100"}`}>{emoji}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={journalForm.is_private} onChange={(e) => setJournalForm({ ...journalForm, is_private: e.target.checked })} className="rounded" />
                  Solo visible para mí
                </label>
                <button onClick={handleJournalSubmit} disabled={journalSaving || !journalForm.title.trim()} className="w-full py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50">
                  {journalSaving ? "Guardando..." : "Guardar Entrada"}
                </button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">menu_book</span>
              Mi Bitácora
            </h3>
            {sessionHistory.length > 0 ? sessionHistory.map((entry, index) => (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{entry.mood_after ? getMoodEmoji(entry.mood_after) : "📝"}</span>
                    <div>
                      <h4 className="font-bold text-gray-900">{entry.title}</h4>
                      <p className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                  </div>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {entry.tags.map((t, i) => <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-medium">{t}</span>)}
                    </div>
                  )}
                </div>
                {entry.content && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{entry.content}</p>}
                {entry.mood_before && entry.mood_after && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                    <span>Antes: {getMoodEmoji(entry.mood_before)}</span>
                    <span>→</span>
                    <span>Después: {getMoodEmoji(entry.mood_after)}</span>
                  </div>
                )}
              </motion.div>
            )) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">📝</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Tu bitácora personal</h3>
                <p className="text-gray-500 max-w-md mx-auto">Registrá tus pensamientos, aprendizajes y emociones después de cada sesión o práctica.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
