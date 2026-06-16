"use client";

import React, { useState, useEffect } from "react";

type Submission = {
  id: string;
  video_url: string;
  video_duration: number | null;
  title: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  course_lessons: { title: string; lesson_type: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

export default function AdminAprobacionesClient() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const loadSubmissions = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/submissions?status=${filter}`);
    if (res.ok) setSubmissions(await res.json());
    setLoading(false);
  };

  useEffect(() => { loadSubmissions(); }, [filter]);

  const handleReview = async (submissionId: string, action: "approved" | "rejected") => {
    setReviewing(submissionId);
    const res = await fetch("/api/admin/submissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission_id: submissionId, action, feedback: feedback || null }),
    });
    if (res.ok) {
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      setFeedback("");
    }
    setReviewing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === s
                ? s === "pending" ? "bg-amber-500 text-white" : s === "approved" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "pending" ? "⏳ Pendientes" : s === "approved" ? "✅ Aprobadas" : "❌ Rechazadas"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <span className="material-symbols-outlined text-5xl mb-4 block">fact_check</span>
          No hay demos {filter === "pending" ? "pendientes" : filter === "approved" ? "aprobadas" : "rechazadas"}
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-sm">{sub.title || sub.course_lessons?.title || "Demo"}</span>
                    <span className="text-xs text-gray-400">
                      {sub.profiles?.full_name || sub.profiles?.email}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Subido: {new Date(sub.created_at).toLocaleDateString("es-AR")}
                    {sub.video_duration ? ` · ${Math.floor(sub.video_duration / 60)}:${String(sub.video_duration % 60).padStart(2, "0")}` : ""}
                  </p>
                  {sub.notes && <p className="text-xs text-gray-500 mt-1 italic">&quot;{sub.notes}&quot;</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <a href={sub.video_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <span className="material-symbols-outlined text-sm">play_circle</span>
                  </a>
                  {sub.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleReview(sub.id, "approved")}
                        disabled={reviewing === sub.id}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                      </button>
                      <button
                        onClick={() => { setReviewing(sub.id); }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
              {reviewing === sub.id && (
                <div className="mt-3 flex gap-2 items-end">
                  <input
                    placeholder="Feedback (opcional)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="flex-1 border-gray-200 rounded-lg text-xs"
                  />
                  <button onClick={() => handleReview(sub.id, "rejected")} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Rechazar</button>
                  <button onClick={() => handleReview(sub.id, "approved")} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Aprobar</button>
                  <button onClick={() => { setReviewing(null); setFeedback(""); }} className="text-gray-400 text-xs">Cancelar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
