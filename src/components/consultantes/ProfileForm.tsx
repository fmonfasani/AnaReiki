"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  initialData: {
    full_name: string | null;
    email: string;
  };
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialData.full_name || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Perfil actualizado correctamente" });
      router.refresh();
    }

    setLoading(false);
  };

  const handlePasswordReset = async () => {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(
      initialData.email,
    );

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "Revisá tu email para cambiar la contraseña",
      });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <h3 className="font-bold text-gray-900 font-display text-lg">
          Información Personal
        </h3>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={initialData.email}
            disabled
            className="w-full border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">
            El email no se puede modificar
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-pink-200 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 font-display text-lg">
          Seguridad
        </h3>
        <p className="text-sm text-gray-500">
          Recibí un email para cambiar tu contraseña.
        </p>
        <button
          onClick={handlePasswordReset}
          disabled={loading}
          className="px-6 py-3 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all disabled:opacity-50"
        >
          Enviar email de cambio de contraseña
        </button>
      </div>
    </div>
  );
}
