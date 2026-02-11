"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogoutButton } from "@/components/LogoutButton";

export default function AdminLayoutUI({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: "dashboard" },
    { name: "Consultantes", href: "/admin/consultantes", icon: "groups" },
    { name: "Agenda", href: "/admin/agenda", icon: "calendar_month" },
    { name: "Contenido", href: "/admin/contenido", icon: "video_library" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-10`}
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-display text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap"
              >
                Ana Murat{" "}
                <span className="text-pink-600 text-xs uppercase tracking-wider block font-sans">
                  Admin Panel
                </span>
              </motion.h2>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="material-symbols-outlined">
              {isSidebarOpen ? "menu_open" : "menu"}
            </span>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                  ${
                    isActive
                      ? "bg-pink-50 text-pink-700 font-medium shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <span
                  className={`material-symbols-outlined text-2xl ${isActive ? "filled" : ""}`}
                >
                  {item.icon}
                </span>

                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div
            className={`flex items-center gap-3 ${!isSidebarOpen && "justify-center"}`}
          >
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs shrink-0">
              {user.user_metadata?.full_name?.charAt(0) || "A"}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.user_metadata?.full_name || "Ana Murat"}
                </p>
                <p className="text-xs text-gray-400 truncate">Administradora</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"} p-8 overflow-y-auto`}
      >
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
