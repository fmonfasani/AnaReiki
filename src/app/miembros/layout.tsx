import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link
          href="/miembros"
          className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
        >
          Ana Reiki
        </Link>
        <LogoutButton />
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r h-screen sticky top-0">
        <div className="p-6 border-b">
          <Link
            href="/miembros"
            className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            Ana Reiki
          </Link>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">
            Área de Miembros
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/miembros"
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 group"
          >
            <span className="mr-3 text-lg group-hover:scale-110 transition-transform">
              🏠
            </span>
            <span className="font-medium">Inicio</span>
          </Link>
          <Link
            href="/miembros/clases"
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 group"
          >
            <span className="mr-3 text-lg group-hover:scale-110 transition-transform">
              📚
            </span>
            <span className="font-medium">Clases Grabadas</span>
          </Link>
          <Link
            href="/miembros/podcast"
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 group"
          >
            <span className="mr-3 text-lg group-hover:scale-110 transition-transform">
              🎙️
            </span>
            <span className="font-medium">Podcast</span>
          </Link>
        </nav>

        <div className="p-4 border-t space-y-4">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold shadow-md">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.user_metadata?.full_name || "Miembro"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Navigation Bar */}
        <nav className="md:hidden flex justify-around bg-white border-t border-b py-2 sticky top-[57px] z-40">
          <Link
            href="/miembros"
            className="flex flex-col items-center p-2 text-purple-600"
          >
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-bold">Inicio</span>
          </Link>
          <Link
            href="/miembros/clases"
            className="flex flex-col items-center p-2 text-gray-500"
          >
            <span className="text-xl">📚</span>
            <span className="text-[10px] font-bold">Clases</span>
          </Link>
          <Link
            href="/miembros/podcast"
            className="flex flex-col items-center p-2 text-gray-500"
          >
            <span className="text-xl">🎙️</span>
            <span className="text-[10px] font-bold">Podcast</span>
          </Link>
        </nav>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
