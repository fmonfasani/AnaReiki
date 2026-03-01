"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ showText = true }: { showText?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setLoading(false);
    }
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
