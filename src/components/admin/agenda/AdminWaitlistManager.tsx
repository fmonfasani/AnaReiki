"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";

type WaitlistEntry = {
  id: string;
  client_id: string;
  preferred_date: string;
  preferred_start_time: string;
  preferred_end_time: string;
  status: string;
  created_at: string;
  profiles?: { email: string; full_name: string | null } | null;
};

export default function AdminWaitlistManager() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWaitlist();
  }, []);

  async function loadWaitlist() {
    const supabase = createClient();
    const { data } = await supabase
      .from("waitlist")
      .select("*, profiles:client_id(email, full_name)")
      .eq("status", "waiting")
      .order("created_at", { ascending: true });

    setEntries((data as WaitlistEntry[]) || []);
    setLoading(false);
  }

  async function handleFulfill(id: string) {
    const supabase = createClient();
    await supabase.from("waitlist").update({ status: "fulfilled" }).eq("id", id);
    loadWaitlist();
  }

  async function handleNotify(id: string, email?: string) {
    if (!email) return;
    const supabase = createClient();

    try {
      await fetch("/api/email-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment: "all",
          subject: "¡Se liberó un turno!",
          content: `Hola! Te escribimos porque se liberó un turno en la agenda. Ingresá a tu panel para reservarlo.`,
          testEmail: email,
        }),
      });

      await supabase.from("waitlist").update({ status: "notified" }).eq("id", id);
      loadWaitlist();
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse h-6 w-48 bg-gray-100 rounded" />
      </div>
    );
  }

  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 font-display mb-4">
        <span className="material-symbols-outlined text-sm align-text-bottom mr-1">notifications</span>
        Lista de Espera ({entries.length})
      </h3>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200"
          >
            <div>
              <p className="text-sm font-medium text-amber-900">
                {entry.profiles?.full_name || "Sin nombre"}
              </p>
              <p className="text-xs text-amber-700">
                {entry.profiles?.email} — {format(new Date(entry.preferred_date), "dd/MM", { locale: es })} a las{" "}
                {entry.preferred_start_time.slice(0, 5)} hs
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Solicitado el {format(new Date(entry.created_at), "dd/MM HH:mm", { locale: es })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleNotify(entry.id, entry.profiles?.email)}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Notificar
              </button>
              <button
                onClick={() => handleFulfill(entry.id)}
                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Completado
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
