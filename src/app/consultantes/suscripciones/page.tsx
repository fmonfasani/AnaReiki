import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PremiumUpgrade from "./PremiumUpgrade";

export default async function SuscripcionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium, plan_tier")
    .eq("id", user.id)
    .single();

  const { data: plans } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  let subscription = null;
  if (profile?.is_premium) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*, pricing_plans!inner(name, slug)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();
    subscription = sub;
  }

  return (
    <PremiumUpgrade
      isPremium={profile?.is_premium || false}
      planTier={profile?.plan_tier || "prana"}
      plans={(plans || []) as any[]}
      subscription={(subscription || null) as any}
      userEmail={user.email || ""}
    />
  );
}
