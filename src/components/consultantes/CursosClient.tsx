"use client";

import React, { useState } from "react";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  tier: string;
  estimated_hours: number | null;
  course_modules: { count: number }[];
};

const TIER_COLORS: Record<string, string> = {
  prana: "bg-gray-100 text-gray-600",
  shakti: "bg-blue-100 text-blue-700",
  ananda: "bg-purple-100 text-purple-700",
};

export default function CursosClient({ courses }: { courses: Course[] }) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Mis Cursos</h1>
          <p className="text-gray-500">Aprendé a tu ritmo con clases prácticas guiadas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <a
            key={course.id}
            href={`/consultantes/cursos/${course.id}`}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
          >
            <div className="h-40 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-5xl text-pink-300 group-hover:text-pink-400 transition-colors">school</span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_COLORS[course.tier] || "bg-gray-100 text-gray-600"}`}>
                  {course.tier.toUpperCase()}
                </span>
                {course.estimated_hours && (
                  <span className="text-[10px] text-gray-400">~{course.estimated_hours}h</span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors">{course.title}</h3>
              {course.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
              )}
              <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                <span className="material-symbols-outlined text-xs">view_module</span>
                {course.course_modules.length} módulos
              </div>
            </div>
          </a>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <span className="material-symbols-outlined text-6xl mb-4 block">school</span>
          <p className="text-lg font-medium">Próximamente tendrás cursos disponibles</p>
          <p className="text-sm mt-1">Seguí en contacto para cuando lancemos las primeras clases.</p>
        </div>
      )}
    </div>
  );
}
