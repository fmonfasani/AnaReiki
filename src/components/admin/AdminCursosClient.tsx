"use client";

import React, { useState, useEffect } from "react";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  tier: string;
  is_active: boolean;
  sort_order: number;
  estimated_hours: number | null;
  course_modules: {
    id: string;
    title: string;
    sort_order: number;
    course_lessons: { id: string; title: string; lesson_type: string }[];
  }[];
};

const TIER_OPTIONS = [
  { value: "prana", label: "Prana (gratis)" },
  { value: "shakti", label: "Shakti ($149/mes)" },
  { value: "ananda", label: "Ananda ($299/mes)" },
];

export default function AdminCursosClient({ initialCourses }: { initialCourses: Course[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState("prana");
  const [estimatedHours, setEstimatedHours] = useState("");

  const [newModuleCourse, setNewModuleCourse] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [newLessonModule, setNewLessonModule] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    lesson_type: "theory" as string,
    content: "",
    video_url: "",
    max_demo_duration: "900",
  });

  const resetForm = () => {
    setTitle(""); setDescription(""); setTier("prana"); setEstimatedHours("");
    setEditingCourse(null); setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      title, description, tier,
      estimated_hours: estimatedHours ? parseInt(estimatedHours) : null,
      sort_order: courses.length,
    };

    if (editingCourse) {
      const res = await fetch(`/api/admin/courses/${editingCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setCourses((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      }
    } else {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const created = await res.json();
        setCourses((prev) => [...prev, { ...created, course_modules: [] }]);
      }
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este curso y todo su contenido?")) return;
    const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    if (res.ok) setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddModule = async (courseId: string) => {
    if (!moduleTitle.trim()) return;
    const res = await fetch(`/api/admin/courses/${courseId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: moduleTitle,
        sort_order: (courses.find((c) => c.id === courseId)?.course_modules.length || 0),
      }),
    });
    if (res.ok) {
      const mod = await res.json();
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, course_modules: [...c.course_modules, { ...mod, course_lessons: [] }] } : c
        )
      );
      setModuleTitle("");
      setNewModuleCourse(null);
    }
  };

  const handleAddLesson = async (courseId: string, moduleId: string) => {
    if (!lessonForm.title.trim()) return;
    const mod = courses.find((c) => c.id === courseId)?.course_modules.find((m) => m.id === moduleId);
    const res = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...lessonForm,
        video_duration: lessonForm.video_url ? null : null,
        sort_order: mod?.course_lessons.length || 0,
      }),
    });
    if (res.ok) {
      const lesson = await res.json();
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                course_modules: c.course_modules.map((m) =>
                  m.id === moduleId ? { ...m, course_lessons: [...m.course_lessons, lesson] } : m
                ),
              }
            : c
        )
      );
      setLessonForm({ title: "", description: "", lesson_type: "theory", content: "", video_url: "", max_demo_duration: "900" });
      setNewLessonModule(null);
    }
  };

  const TYPE_LABELS: Record<string, { icon: string; label: string; color: string }> = {
    theory: { icon: "book", label: "Teórica", color: "bg-blue-100 text-blue-700" },
    practice: { icon: "handshake", label: "Práctica", color: "bg-green-100 text-green-700" },
    quiz: { icon: "quiz", label: "Quiz", color: "bg-purple-100 text-purple-700" },
    mixed: { icon: "merge", label: "Mixta", color: "bg-amber-100 text-amber-700" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cursos</h2>
          <p className="text-sm text-gray-500">{courses.length} cursos creados</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nuevo Curso
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-bold text-gray-900">{editingCourse ? "Editar Curso" : "Nuevo Curso"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Título</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border-gray-200 rounded-lg text-sm mt-1" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full border-gray-200 rounded-lg text-sm mt-1">
                {TIER_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border-gray-200 rounded-lg text-sm mt-1 h-20" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
              {editingCourse ? "Guardar" : "Crear Curso"}
            </button>
            <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${course.tier === "ananda" ? "bg-purple-100 text-purple-700" : course.tier === "shakti" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                  {course.tier.toUpperCase()}
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{course.title}</h3>
                  <p className="text-xs text-gray-400">
                    {course.course_modules.length} módulos · {course.course_modules.reduce((acc, m) => acc + m.course_lessons.length, 0)} clases
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); setEditingCourse(course); setTitle(course.title); setDescription(course.description || ""); setTier(course.tier); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-pink-600 rounded-lg">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
                <span className="material-symbols-outlined text-gray-400 text-sm">
                  {expandedCourse === course.id ? "expand_less" : "expand_more"}
                </span>
              </div>
            </div>

            {expandedCourse === course.id && (
              <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">
                {course.course_modules.map((mod) => (
                  <div key={mod.id} className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-800 text-sm">{mod.title}</h4>
                      <button onClick={() => setNewLessonModule(newLessonModule === mod.id ? null : mod.id)} className="text-xs text-pink-600 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">add</span>Clase
                      </button>
                    </div>
                    {mod.course_lessons.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Sin clases</p>
                    ) : (
                      <div className="space-y-1">
                        {mod.course_lessons.map((lesson) => {
                          const typeInfo = TYPE_LABELS[lesson.lesson_type] || TYPE_LABELS.theory;
                          return (
                            <div key={lesson.id} className="flex items-center gap-2 text-xs text-gray-600 py-1">
                              <span className={`material-symbols-outlined text-xs`}>{typeInfo.icon}</span>
                              <span>{lesson.title}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {newLessonModule === mod.id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                        <input placeholder="Título de la clase" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className="w-full border-gray-200 rounded-lg text-xs" />
                        <select value={lessonForm.lesson_type} onChange={(e) => setLessonForm({ ...lessonForm, lesson_type: e.target.value })} className="w-full border-gray-200 rounded-lg text-xs">
                          <option value="theory">Teórica</option>
                          <option value="practice">Práctica (requiere demo)</option>
                          <option value="quiz">Quiz</option>
                          <option value="mixed">Mixta</option>
                        </select>
                        <textarea placeholder="Descripción" value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} className="w-full border-gray-200 rounded-lg text-xs h-16" />
                        <textarea placeholder="Contenido (markdown)" value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} className="w-full border-gray-200 rounded-lg text-xs h-20" />
                        <input placeholder="URL del video (opcional)" value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} className="w-full border-gray-200 rounded-lg text-xs" />
                        <button onClick={() => handleAddLesson(course.id, mod.id)} className="bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Crear Clase</button>
                      </div>
                    )}
                  </div>
                ))}

                {newModuleCourse === course.id ? (
                  <div className="flex gap-2 items-center">
                    <input placeholder="Nombre del módulo" value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} className="flex-1 border-gray-200 rounded-lg text-sm" />
                    <button onClick={() => handleAddModule(course.id)} className="bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Crear</button>
                    <button onClick={() => { setNewModuleCourse(null); setModuleTitle(""); }} className="text-gray-400 text-xs">Cancelar</button>
                  </div>
                ) : (
                  <button onClick={() => setNewModuleCourse(course.id)} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-gray-400 text-sm hover:border-pink-300 hover:text-pink-500 transition-all">
                    + Agregar Módulo
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {courses.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <span className="material-symbols-outlined text-5xl mb-4 block">school</span>
            No hay cursos creados aún
          </div>
        )}
      </div>
    </div>
  );
}
