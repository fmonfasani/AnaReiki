import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import EmailMarketingForm from "@/components/admin/EmailMarketingForm";

export default async function EmailMarketingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user, supabase))) {
    redirect("/login");
  }

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: premiumUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_premium", true);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Email Marketing 📧
        </h1>
        <p className="text-gray-500">
          Enviá comunicaciones a tus consultantes por segmento.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Todos</p>
          <p className="text-2xl font-bold text-gray-900">{totalUsers || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Premium</p>
          <p className="text-2xl font-bold text-gray-900">
            {premiumUsers || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Gratuitos</p>
          <p className="text-2xl font-bold text-gray-900">
            {(totalUsers || 0) - (premiumUsers || 0)}
          </p>
        </div>
      </div>

      <EmailMarketingForm />
    </div>
  );
}
