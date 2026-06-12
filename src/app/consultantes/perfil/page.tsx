import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/consultantes/ProfileForm";
import MisPromosCard from "@/components/consultantes/MisPromosCard";
import Link from "next/link";

export default async function PerfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="space-y-2">
        <Link
          href="/consultantes"
          className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1 group"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          Volver al Inicio
        </Link>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-display">
          Mi Perfil 👤
        </h1>
        <p className="text-lg text-gray-500">
          Gestioná tu información personal y preferencias.
        </p>
      </header>

      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {(user.user_metadata?.full_name as string)?.charAt(0)?.toUpperCase() || user.email?.charAt(0).toUpperCase() || "A"}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {(user.user_metadata?.full_name as string) || "Miembro"}
          </h2>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <ProfileForm
        initialData={{
          full_name: (user.user_metadata?.full_name as string) || null,
          email: user.email || "",
        }}
      />

      <MisPromosCard />
    </div>
  );
}
