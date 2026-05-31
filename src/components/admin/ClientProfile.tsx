"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  role: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  services: { name: string } | null;
}

interface SessionNote {
  id: string;
  content: string;
  is_private: boolean;
  appointment_id: string | null;
  created_at: string;
}

interface Reflection {
  id: string;
  mood_score: number;
  intention: string | null;
  created_at: string;
}

export default function ClientProfile({
  profile,
  appointments,
  notes,
  reflections,
}: {
  profile: Profile;
  appointments: Appointment[];
  notes: SessionNote[];
  reflections: Reflection[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(profile.tags || []);
  const [activeTab, setActiveTab] = useState<
    "overview" | "appointments" | "notes" | "mood"
  >("overview");

  const togglePremium = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: !profile.is_premium })
      .eq("id", profile.id);
    setSaving(false);

    if (!error) {
      setMessage({ type: "success", text: "Estado premium actualizado" });
      router.refresh();
    } else {
      setMessage({ type: "error", text: error.message });
    }
  };

  const addTag = async () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;

    const newTags = [...tags, tag];
    setTags(newTags);
    setTagInput("");

    await supabase.from("profiles").update({ tags: newTags }).eq("id", profile.id);
  };

  const removeTag = async (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    await supabase.from("profiles").update({ tags: newTags }).eq("id", profile.id);
  };

  const completedAppointments = appointments.filter(
    (a) => a.status === "completed",
  ).length;
  const cancelledAppointments = appointments.filter(
    (a) => a.status === "cancelled",
  ).length;
  const avgMood =
    reflections.length > 0
      ? (
          reflections.reduce((s, r) => s + r.mood_score, 0) / reflections.length
        ).toFixed(1)
      : "—";

  const getMoodEmoji = (score: number) =>
    ["", "😫", "😕", "😐", "🙂", "🤩"][score] || "❓";

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`px-4 py-3 rounded-xl text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {profile.full_name?.charAt(0)?.toUpperCase() ||
                profile.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.full_name || "Sin nombre"}
              </h2>
              <p className="text-gray-500">{profile.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Miembro desde{" "}
                {format(new Date(profile.created_at), "MMMM yyyy", {
                  locale: es,
                })}
              </p>
            </div>
          </div>

          <button
            onClick={togglePremium}
            disabled={saving}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              profile.is_premium
                ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                : "bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-700"
            }`}
          >
            {profile.is_premium ? "Premium ✓" : "Activar Premium"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-pink-50 text-pink-700 text-xs rounded-full border border-pink-100"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="+ etiqueta"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="w-24 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
            />
            <button
              onClick={addTag}
              className="px-2 py-1 text-xs bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100"
            >
              +
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            { label: "Citas Completadas", value: completedAppointments },
            { label: "Canceladas", value: cancelledAppointments },
            { label: "Notas de Sesión", value: notes.length },
            { label: "Ánimo Promedio", value: avgMood },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex border-b border-gray-200 gap-6">
        {[
          { key: "overview", label: "Resumen" },
          { key: "appointments", label: "Citas" },
          { key: "notes", label: "Notas" },
          { key: "mood", label: "Ánimo" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() =>
              setActiveTab(tab.key as typeof activeTab)
            }
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.key
                ? "text-pink-600 border-pink-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">
            Datos del Consultante
          </h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">ID</dt>
              <dd className="font-mono text-xs text-gray-900">{profile.id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Rol</dt>
              <dd className="text-gray-900 capitalize">
                {profile.role === "user" ? "consultante" : profile.role || "consultante"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Email verificado</dt>
              <dd className="text-gray-900">—</dd>
            </div>
            <div>
              <dt className="text-gray-500">Última actualización</dt>
              <dd className="text-gray-900">
                {format(new Date(profile.updated_at), "dd/MM/yyyy HH:mm")}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {appointments.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                    Servicio
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {format(new Date(a.start_time), "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {a.services?.name || "Sesión"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                          a.status === "confirmed"
                            ? "bg-green-50 text-green-700"
                            : a.status === "completed"
                              ? "bg-blue-50 text-blue-700"
                              : a.status === "cancelled"
                                ? "bg-gray-100 text-gray-500"
                                : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                      {a.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-gray-400">
              Este consultante no tiene citas registradas.
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-4">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400">
                    {format(new Date(note.created_at), "dd/MM/yyyy HH:mm")}
                  </span>
                  {note.is_private && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      Privada
                    </span>
                  )}
                  {note.appointment_id && (
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      Vinculada a cita
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
              No hay notas de sesión para este consultante.
            </div>
          )}
        </div>
      )}

      {activeTab === "mood" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {reflections.length > 0 ? (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {reflections.slice(0, 14).map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col items-center p-2 bg-gray-50 rounded-xl min-w-[48px]"
                  >
                    <span className="text-xl">{getMoodEmoji(r.mood_score)}</span>
                    <span className="text-[10px] text-gray-400 mt-1">
                      {format(new Date(r.created_at), "d MMM", { locale: es })}
                    </span>
                  </div>
                ))}
              </div>
              {reflections.length > 14 && (
                <p className="text-sm text-gray-400 text-center">
                  +{reflections.length - 14} registros más
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">
              Sin registros de ánimo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
