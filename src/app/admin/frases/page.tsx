"use client";

import { useEffect, useState } from "react";

type OracleQuote = {
  id: string;
  quote: string;
  author: string;
  category: string;
  is_active: boolean;
  created_at: string;
};

export default function FrasesAdminPage() {
  const [quotes, setQuotes] = useState<OracleQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ quote: "", author: "Ana Reiki", category: "general", is_active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = async () => {
    const res = await fetch("/api/admin/oracle-quotes");
    const json = await res.json();
    setQuotes(json.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchQuotes(); }, []);

  const handleSave = async () => {
    if (!form.quote.trim()) return;
    setSaving(true);
    setError(null);
    const url = editingId
      ? `/api/admin/oracle-quotes/${editingId}`
      : "/api/admin/oracle-quotes";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { const j = await res.json(); setError(j.error || "Error"); setSaving(false); return; }
    setShowForm(false);
    setEditingId(null);
    setForm({ quote: "", author: "Ana Reiki", category: "general", is_active: true });
    setSaving(false);
    fetchQuotes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta frase?")) return;
    await fetch(`/api/admin/oracle-quotes/${id}`, { method: "DELETE" });
    fetchQuotes();
  };

  const handleEdit = (q: OracleQuote) => {
    setForm({ quote: q.quote, author: q.author, category: q.category, is_active: q.is_active });
    setEditingId(q.id);
    setShowForm(true);
  };

  const toggleActive = async (q: OracleQuote) => {
    await fetch(`/api/admin/oracle-quotes/${q.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !q.is_active }),
    });
    fetchQuotes();
  };

  const categories = ["general", "respiracion", "intuicion", "presencia", "gratitud", "calma", "cuerpo", "paciencia", "soltar", "sanacion", "amor", "intencion", "autenticidad", "paz"];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Frases del Oráculo</h1>
          <p className="text-gray-500 text-sm mt-1">Gestioná las frases que aparecen en el dashboard de consultantes</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ quote: "", author: "Ana Reiki", category: "general", is_active: true }); }} className="px-4 py-2 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors">
          + Nueva Frase
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">{editingId ? "Editar Frase" : "Nueva Frase"}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frase *</label>
              <textarea value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 text-sm resize-none" rows={3} placeholder="Escribí la frase aquí..." />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
                <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 text-sm">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activa</label>
                <label className="flex items-center gap-2 mt-3">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                  <span className="text-sm text-gray-600">Visible para consultantes</span>
                </label>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || !form.quote.trim()} className="px-4 py-2 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : quotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400">No hay frases todavía. ¡Creá la primera!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div key={q.id} className={`bg-white rounded-2xl border p-5 shadow-sm ${!q.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-gray-900 italic leading-relaxed">"{q.quote}"</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">— {q.author}</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-500 uppercase">{q.category}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${q.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {q.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(q)} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title={q.is_active ? "Desactivar" : "Activar"}>
                    {q.is_active ? "Desactivar" : "Activar"}
                  </button>
                  <button onClick={() => handleEdit(q)} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
