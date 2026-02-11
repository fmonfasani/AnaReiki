import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch quick stats
  const { count: usersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  const { count: premiumCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_premium", true);
  const { count: appointmentsCount } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Panel de Control 🛠️
        </h1>
        <p className="text-gray-500">
          Bienvenida Ana. Aquí tienes un resumen de tu plataforma.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 font-medium">Total Miembros</span>
            <span className="material-symbols-outlined text-purple-600 bg-purple-100 p-2 rounded-lg">
              group
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{usersCount || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 font-medium">Miembros Premium</span>
            <span className="material-symbols-outlined text-pink-600 bg-pink-100 p-2 rounded-lg">
              diamond
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {premiumCount || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 font-medium">Citas Pendientes</span>
            <span className="material-symbols-outlined text-orange-600 bg-orange-100 p-2 rounded-lg">
              notifications_active
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {appointmentsCount || 0}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="text-xl font-bold text-gray-900 font-display mt-8">
        Accesos Rápidos
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/consultantes"
          className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-pink-300 hover:shadow-md transition-all"
        >
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-pink-500">
              manage_accounts
            </span>
            Gestionar Usuarios
          </h4>
          <p className="text-sm text-gray-500 mt-2">
            Activar cuentas premium o ver perfiles.
          </p>
        </Link>

        <Link
          href="/admin/agenda"
          className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-pink-300 hover:shadow-md transition-all"
        >
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-pink-500">
              edit_calendar
            </span>
            Configurar Agenda
          </h4>
          <p className="text-sm text-gray-500 mt-2">
            Definir días y horarios de atención.
          </p>
        </Link>

        <Link
          href="/admin/contenido"
          className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-pink-300 hover:shadow-md transition-all"
        >
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-pink-500">
              upload_file
            </span>
            Subir Contenido
          </h4>
          <p className="text-sm text-gray-500 mt-2">
            Agregar nuevos videos o podcasts.
          </p>
        </Link>
      </div>
    </div>
  );
}
