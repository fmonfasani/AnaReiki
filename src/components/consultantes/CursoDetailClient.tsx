"use client";

import React, { useState, useEffect } from "react";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  lesson_type: string;
  video_url: string | null;
  video_duration: number | null;
  content: string | null;
  sort_order: number;
  is_required: boolean;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  course_lessons: Lesson[];
};

type Progress = {
  lesson_id: string;
  status: string;
  video_watch_time: number | null;
  quiz_score: number | null;
  feedback: string | null;
};

type Submission = {
  lesson_id: string;
  video_url: string;
  status: string;
};

type CourseData = {
  course: {
    id: string;
    title: string;
    description: string | null;
    tier: string;
    course_modules: Module[];
  };
  progress: Progress[];
  submissions: Submission[];
};

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  locked: { icon: "lock", color: "text-gray-300", label: "Bloqueado" },
  available: { icon: "play_circle", color: "text-pink-500", label: "Disponible" },
  viewed: { icon: "visibility", color: "text-blue-500", label: "Visto" },
  submitted: { icon: "pending", color: "text-amber-500", label: "En revisión" },
  approved: { icon: "check_circle", color: "text-green-500", label: "Aprobado" },
  rejected: { icon: "replay", color: "text-red-500", label: "Rechazado" },
};

export default function CursoDetailClient({ data }: { data: CourseData }) {
  const { course, progress: initialProgress, submissions: initialSubmissions } = data;
  const [progress, setProgress] = useState(initialProgress);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showSubmit, setShowSubmit] = useState<string | null>(null);
  const [demoUrl, setDemoUrl] = useState("");
  const [demoNotes, setDemoNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getProgress = (lessonId: string): Progress | undefined =>
    progress.find((p) => p.lesson_id === lessonId);

  const getSubmission = (lessonId: string): Submission | undefined =>
    submissions.find((s) => s.lesson_id === lessonId);

  const totalLessons = course.course_modules.reduce((acc, m) => acc + m.course_lessons.length, 0);
  const completedLessons = progress.filter((p) => p.status === "approved").length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const handleSubmit = async (lessonId: string) => {
    if (!demoUrl.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/courses/${course.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_id: lessonId, video_url: demoUrl, notes: demoNotes }),
    });
    if (res.ok) {
      const sub = await res.json();
      setSubmissions((prev) => [...prev, sub]);
      setProgress((prev) =>
        prev.map((p) => (p.lesson_id === lessonId ? { ...p, status: "submitted" } : p))
      );
      setShowSubmit(null);
      setDemoUrl("");
      setDemoNotes("");
    }
    setSubmitting(false);
  };

  const markViewed = async (lessonId: string) => {
    setProgress((prev) =>
      prev.map((p) =>
        p.lesson_id === lessonId && p.status === "available"
          ? { ...p, status: "viewed" }
          : p
      )
    );
  };

  return (
    <div className="flex gap-6 min-h-[80vh]">
      {/* Sidebar: syllabus */}
      <div className="w-80 shrink-0 bg-white rounded-2xl border border-gray-200 p-4 overflow-y-auto max-h-[80vh] sticky top-4">
        <h2 className="font-bold text-gray-900 mb-1">{course.title}</h2>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div className="bg-pink-500 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-xs text-gray-500 font-medium">{progressPercent}%</span>
        </div>

        <div className="space-y-4">
          {course.course_modules.map((mod) => (
            <div key={mod.id}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{mod.title}</h3>
              <div className="space-y-1">
                {mod.course_lessons.map((lesson) => {
                  const prog = getProgress(lessonId(lesson.id));
                  const status = prog?.status || "locked";
                  const config = STATUS_CONFIG[status] || STATUS_CONFIG.locked;
                  const isActive = activeLesson?.id === lesson.id;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => { if (status !== "locked") setActiveLesson(lesson); }}
                      disabled={status === "locked"}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                        isActive ? "bg-pink-50 border border-pink-200" : "hover:bg-gray-50"
                      } ${status === "locked" ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className={`material-symbols-outlined text-sm ${config.color}`}>{config.icon}</span>
                      <span className="flex-1 truncate">{lesson.title}</span>
                      <span className={`text-[10px] ${config.color}`}>{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main: lesson content */}
      <div className="flex-1 min-w-0">
        {activeLesson ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{activeLesson.title}</h2>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                activeLesson.lesson_type === "practice" ? "bg-green-100 text-green-700"
                : activeLesson.lesson_type === "quiz" ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
              }`}>
                {activeLesson.lesson_type === "practice" ? "Práctica" : activeLesson.lesson_type === "quiz" ? "Quiz" : "Teórica"}
              </span>
            </div>

            {activeLesson.description && (
              <p className="text-sm text-gray-500">{activeLesson.description}</p>
            )}

            {activeLesson.video_url && (
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <video
                  src={activeLesson.video_url}
                  controls
                  className="w-full h-full object-contain"
                  onEnded={() => markViewed(activeLesson.id)}
                />
              </div>
            )}

            {activeLesson.content && (
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{activeLesson.content}</div>
            )}

            {activeLesson.lesson_type === "practice" && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Tu Demo</h3>
                {getSubmission(activeLesson.id) ? (
                  <div className={`p-3 rounded-xl text-sm ${
                    getSubmission(activeLesson.id)?.status === "approved" ? "bg-green-50 text-green-700"
                    : getSubmission(activeLesson.id)?.status === "rejected" ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                  }`}>
                    {getSubmission(activeLesson.id)?.status === "approved" ? "✅ Demo aprobada"
                      : getSubmission(activeLesson.id)?.status === "rejected" ? "❌ Demo rechazada — subí una nueva"
                      : "⏳ Demo en revisión..."}
                  </div>
                ) : showSubmit === activeLesson.id ? (
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                    <input
                      placeholder="URL del video demo (subilo en /admin/contenido primero)"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      className="w-full border-gray-200 rounded-lg text-sm"
                    />
                    <textarea
                      placeholder="Notas (opcional)"
                      value={demoNotes}
                      onChange={(e) => setDemoNotes(e.target.value)}
                      className="w-full border-gray-200 rounded-lg text-sm h-16"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleSubmit(activeLesson.id)} disabled={submitting || !demoUrl} className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                        {submitting ? "Enviando..." : "Enviar Demo"}
                      </button>
                      <button onClick={() => setShowSubmit(null)} className="text-gray-400 text-sm">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowSubmit(activeLesson.id)} className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Subir Demo
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl mb-4 block">play_lesson</span>
              <p className="text-lg font-medium">Elegí una clase del syllabus</p>
              <p className="text-sm mt-1">Seleccioná una clase para ver su contenido</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function lessonId(id: string) { return id; }
