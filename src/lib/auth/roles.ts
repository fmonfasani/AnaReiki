import type { User } from "@supabase/supabase-js";

export function isAdminFromAppMetadata(user: User | null): boolean {
  if (!user) return false;
  const appMetadata = user.app_metadata ?? {};
  const role = appMetadata.role;
  const roles = appMetadata.roles;

  if (role === "admin") return true;
  if (Array.isArray(roles) && roles.includes("admin")) return true;

  return false;
}
