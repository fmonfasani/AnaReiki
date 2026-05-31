import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import SidebarNav from "./SidebarNav";

const PLAN_ACCESS: Record<string, string[]> = {
  prana: ["inicio", "suscripciones", "mis-citas", "comunidad", "perfil"],
  shakti: ["inicio", "suscripciones", "biblioteca", "podcast", "comunidad", "evolucion", "mis-citas", "perfil"],
  ananda: ["inicio", "suscripciones", "biblioteca", "clases", "podcast", "comunidad", "mensajes", "chat-buda", "evolucion", "mis-citas", "perfil"],
};

const NAV_ITEMS = [
  { id: "inicio", name: "Inicio", href: "/consultantes", icon: "home" },
  { id: "suscripciones", name: "Suscripciones", href: "/consultantes/suscripciones", icon: "diamond" },
  { id: "biblioteca", name: "Biblioteca", href: "/consultantes/biblioteca", icon: "library_books" },
  { id: "clases", name: "Clases", href: "/consultantes/clases", icon: "video_library" },
  { id: "podcast", name: "Podcast", href: "/consultantes/podcast", icon: "podcasts" },
  { id: "comunidad", name: "Comunidad", href: "/consultantes/comunidad", icon: "forum" },
  { id: "mensajes", name: "Mensajes", href: "/consultantes/mensajes", icon: "chat" },
  { id: "chat-buda", name: "Chat Buda", href: "/consultantes/chat-buda", icon: "psychiatry" },
  { id: "evolucion", name: "Evolución", href: "/consultantes/evolucion", icon: "spa" },
  { id: "mis-citas", name: "Mi Agenda", href: "/consultantes/mis-citas", icon: "calendar_month" },
  { id: "perfil", name: "Mi Perfil", href: "/consultantes/perfil", icon: "person" },
];

export default async function ConsultantesLayout({
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

  const [userIsAdmin, profileResult] = await Promise.all([
    isAdmin(user, supabase),
    supabase.from("profiles").select("plan_tier").eq("id", user.id).single(),
  ]);

  const planTier = profileResult.data?.plan_tier || "prana";
  const accessibleModules = PLAN_ACCESS[planTier] || PLAN_ACCESS.prana;

  let navItems = NAV_ITEMS.map((item) => ({
    ...item,
    locked: !accessibleModules.includes(item.id),
  }));

  if (userIsAdmin) {
    navItems.unshift({
      id: "admin",
      name: "Panel Admin",
      href: "/admin",
      icon: "admin_panel_settings",
      locked: false,
    });
  }

  const PLAN_LABELS: Record<string, string> = {
    prana: "Prana",
    shakti: "Shakti",
    ananda: "Ananda",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link
          href="/consultantes"
          className="font-display font-bold text-xl text-gray-900"
        >
          Ana Reiki
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-pink-100 text-pink-700 font-semibold px-2 py-0.5 rounded-full">
            {PLAN_LABELS[planTier] || "Prana"}
          </span>
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs ring-2 ring-white">
            {user.email?.[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r h-screen sticky top-0 justify-between z-20">
        <div>
          <div className="p-8 pb-4">
            <Link
              href="/consultantes"
              className="font-display font-bold text-2xl text-gray-900"
            >
              Ana Reiki
            </Link>
            <p className="text-xs text-pink-500 mt-1 uppercase tracking-widest font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
              Espacio Consultante
            </p>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            <SidebarNav items={navItems} planTier={planTier} />
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 m-4 bg-gray-50 rounded-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold shadow-sm ring-2 ring-white">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {user.user_metadata?.full_name || "Consultante"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <div className="mb-3 text-xs text-center">
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold px-3 py-1 rounded-full">
              {PLAN_LABELS[planTier] || "Prana"}
            </span>
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
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex flex-col items-center p-2 transition-colors ${
              item.locked ? "text-gray-300" : "text-gray-400"
            }`}
          >
            <span className="material-symbols-outlined text-2xl mb-0.5">
              {item.locked ? "lock" : item.icon}
            </span>
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
