"use client";

import { useState } from "react";

export function LogoutButton({ showText = true }: { showText?: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", redirect: "manual" });
    } catch {
      // fallback
    }
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title={showText ? "" : "Cerrar Sesión"}
      className={`${showText ? "px-3 py-1.5" : "p-2"
        } text-sm font-medium text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2 group`}
    >
      <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">
        logout
      </span>
      {showText && (
        <span className="whitespace-nowrap">
          {loading ? "Cerrando..." : "Salir"}
        </span>
      )}
    </button>
  );
}
