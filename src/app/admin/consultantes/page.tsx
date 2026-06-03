"use client";

import React, { useEffect, useState, useCallback } from "react";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  is_premium: boolean;
  role: string | null;
  created_at: string;
  tags?: string[];
}

export default function ConsultantesPage() {
  const [consultantes, setConsultantes] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  async function fetchConsultantes() {
    setLoading(true);
    const res = await fetch("/api/admin/consultantes");
    const json = await res.json();
    if (json.data) setConsultantes(json.data);
    setLoading(false);
  }

  useEffect(() => {
    fetchConsultantes();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === consultantes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(consultantes.map((c) => c.id)));
    }
  };

  const copyEmails = useCallback(() => {
    const emails = consultantes
      .filter((c) => selected.has(c.id))
      .map((c) => c.email)
      .join(", ");
    navigator.clipboard.writeText(emails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [consultantes, selected]);

  const exportCSV = useCallback(() => {
    const selectedList = consultantes.filter((c) => selected.has(c.id));
    const headers = "Nombre,Email,Estado,Rol,Fecha Registro";
    const rows = selectedList.map((c) =>
      [
        `"${c.full_name || ""}"`,
        c.email,
        c.is_premium ? "Premium" : "Gratuito",
        c.role || "consultante",
        new Date(c.created_at).toLocaleDateString(),
      ].join(","),
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consultantes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [consultantes, selected]);

  const togglePremium = async (id: string, currentStatus: boolean) => {
    const res = await fetch("/api/admin/consultantes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_premium: !currentStatus }),
    });
    if (res.ok) {
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
            Gestiona el acceso, seleccioná emails y exportá contactos.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500">
          Total:{" "}
          <span className="font-bold text-gray-900">{consultantes.length}</span>
          {selected.size > 0 && (
            <span className="ml-2 text-pink-600">
              · {selected.size} seleccionados
            </span>
          )}
        </div>
      </header>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-4 bg-pink-50 border border-pink-100 rounded-xl">
          <span className="text-sm text-pink-700 font-medium">
            {selected.size} {selected.size === 1 ? "seleccionado" : "seleccionados"}:
          </span>
          <button
            onClick={copyEmails}
            className="px-4 py-2 bg-white border border-pink-200 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-100 transition-colors"
          >
            {copied ? "✓ Copiado" : "Copiar emails"}
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-white border border-pink-200 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-100 transition-colors"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            Limpiar selección
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="px-4 py-4 w-10">
                <input
                  type="checkbox"
                  checked={selected.size === consultantes.length && consultantes.length > 0}
                  onChange={toggleAll}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
              </th>
              <th className="px-6 py-4 font-semibold">Nombre / Email</th>
              <th className="px-6 py-4 font-semibold">Tags</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold">Rol</th>
              <th className="px-6 py-4 font-semibold">Fecha Registro</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 w-4 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-100 rounded w-8 inline-block" /></td>
                  </tr>
                ))
              : consultantes.map((consultante) => (
                  <tr
                    key={consultante.id}
                    className={`hover:bg-gray-50/50 transition-colors group ${selected.has(consultante.id) ? "bg-pink-50/50" : ""}`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(consultante.id)}
                        onChange={() => toggleSelect(consultante.id)}
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                    </td>
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
                      <div className="flex gap-1 flex-wrap">
                        {((consultante as any).tags || []).length > 0
                          ? ((consultante as any).tags as string[]).map(
                              (tag: string) => (
                                <span
                                  key={tag}
                                  className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ),
                            )
                          : <span className="text-gray-300 text-xs">—</span>}
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
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                      {consultante.role || "consultante"}
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
