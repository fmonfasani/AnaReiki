"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function ConsultantesPage() {
  const [consultantes, setConsultantes] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchConsultantes();
  }, []);

  const fetchConsultantes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setConsultantes(data);
    }
    setLoading(false);
  };

  const togglePremium = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: !currentStatus })
      .eq("id", id);

    if (!error) {
      // Optimistic update
      setConsultantes(
        consultantes.map((c) =>
          c.id === id ? { ...c, is_premium: !currentStatus } : c,
        ),
      );
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">
            Directorio de Consultantes
          </h1>
          <p className="text-gray-500 text-sm">
            Gestiona el acceso y los detalles de tus alumnos.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500">
          Total:{" "}
          <span className="font-bold text-gray-900">{consultantes.length}</span>
        </div>
      </header>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="px-6 py-4 font-semibold">Nombre / Email</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold">Fecha Registro</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-4 bg-gray-100 rounded w-8 inline-block"></div>
                    </td>
                  </tr>
                ))
              : consultantes.map((consultante) => (
                  <tr
                    key={consultante.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-xs">
                          {consultante.full_name?.[0] ||
                            consultante.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {consultante.full_name || "Sin nombre"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {consultante.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                              ${
                                consultante.is_premium
                                  ? "bg-green-50 text-green-700 border-green-100"
                                  : "bg-gray-50 text-gray-600 border-gray-200"
                              }`}
                      >
                        {consultante.is_premium ? "Premium" : "Gratuito"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(consultante.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          togglePremium(consultante.id, consultante.is_premium)
                        }
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all
                                 ${
                                   consultante.is_premium
                                     ? "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-red-600"
                                     : "border-pink-200 text-pink-600 hover:bg-pink-50"
                                 }`}
                      >
                        {consultante.is_premium
                          ? "Desactivar Premium"
                          : "Activar Premium"}
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && consultantes.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <span className="material-symbols-outlined text-4xl mb-2">
              person_off
            </span>
            <p>No hay consultantes registrados aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
