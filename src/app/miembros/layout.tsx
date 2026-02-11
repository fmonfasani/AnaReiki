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

  const navItems = [
    { name: "Inicio", href: "/miembros", icon: "home" },
    { name: "Clases", href: "/miembros/clases", icon: "video_library" },
    { name: "Podcast", href: "/miembros/podcast", icon: "podcasts" },
    { name: "Evolución", href: "/miembros/evolucion", icon: "spa" },
    { name: "Reservar", href: "/miembros/reservar", icon: "calendar_month" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link
          href="/miembros"
          className="font-display font-bold text-xl text-gray-900"
        >
          Ana Reiki
        </Link>
        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs ring-2 ring-white">
          {user.email?.[0].toUpperCase()}
        </div>
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r h-screen sticky top-0 justify-between z-20">
        <div>
          <div className="p-8 pb-4">
            <Link
              href="/miembros"
              className="font-display font-bold text-2xl text-gray-900"
            >
              Ana Reiki
            </Link>
            <p className="text-xs text-pink-500 mt-1 uppercase tracking-widest font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
              Espacio Miembros
            </p>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-4 py-3 text-gray-600 hover:bg-pink-50 hover:text-pink-700 rounded-xl transition-all duration-200 group"
              >
                <span className="material-symbols-outlined mr-3 text-xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 m-4 bg-gray-50 rounded-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold shadow-sm ring-2 ring-white">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {user.user_metadata?.full_name || "Miembro"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-full">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-2 px-4 flex justify-between items-center z-50 shadow-lg-up safe-area-bottom">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-pink-600 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl mb-0.5">
              {item.icon}
            </span>
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
