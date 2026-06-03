import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import EmailMarketingForm from "@/components/admin/EmailMarketingForm";

export default async function EmailMarketingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user, supabase))) {
    redirect("/login");
  }

  const svc = createServiceClient();

  const { count: totalUsers } = await svc
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: premiumUsers } = await svc
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_premium", true);

  const { data: campaigns } = await svc
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const totalSent = campaigns?.reduce((a, c) => a + c.sent_count, 0) || 0;
  const totalFailed = campaigns?.reduce((a, c) => a + c.failed_count, 0) || 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Email Marketing
        </h1>
        <p className="text-gray-500">
          Enviá comunicaciones a tus consultantes por segmento y tags.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Todos</p>
          <p className="text-2xl font-bold text-gray-900">{totalUsers || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Premium</p>
          <p className="text-2xl font-bold text-gray-900">{premiumUsers || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Gratuitos</p>
          <p className="text-2xl font-bold text-gray-900">{(totalUsers || 0) - (premiumUsers || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Campañas</p>
          <p className="text-2xl font-bold text-gray-900">{campaigns?.length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total enviados</p>
          <p className="text-2xl font-bold text-gray-900">{totalSent}</p>
          {totalFailed > 0 && (
            <p className="text-xs text-red-500 mt-1">{totalFailed} fallaron</p>
          )}
        </div>
      </div>

      <EmailMarketingForm />

      {campaigns && campaigns.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Historial de campañas</h2>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Asunto</th>
                <th className="px-6 py-3 font-semibold">Segmento</th>
                <th className="px-6 py-3 font-semibold">Tags</th>
                <th className="px-6 py-3 font-semibold">Enviados</th>
                <th className="px-6 py-3 font-semibold">Fallidos</th>
                <th className="px-6 py-3 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-medium text-gray-900 text-sm">{c.subject}</td>
                  <td className="px-6 py-3 text-sm text-gray-500 capitalize">{c.segment}</td>
                  <td className="px-6 py-3 text-sm">
                    {(c.tags || []).length > 0
                      ? (c.tags as string[]).map((t) => (
                          <span key={t} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs mr-1">{t}</span>
                        ))
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-3 text-sm text-green-600 font-medium">{c.sent_count}</td>
                  <td className="px-6 py-3 text-sm text-red-500">{c.failed_count || "—"}</td>
                  <td className="px-6 py-3 text-sm text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
