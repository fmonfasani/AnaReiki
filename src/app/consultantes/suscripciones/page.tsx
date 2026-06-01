import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PremiumUpgrade from "./PremiumUpgrade";

export default async function SuscripcionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <PremiumUpgrade />;
}
