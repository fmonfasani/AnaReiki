import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import AdminContentManager from "@/components/admin/AdminContentManager";

export default async function AdminContenidoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user, supabase))) redirect("/login");

  const { data: content } = await supabase
    .from("content")
    .select("*, content_categories!left(name, slug)")
    .order("published_at", { ascending: false });

  const { data: categories } = await supabase
    .from("content_categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Centro de Contenido
        </h1>
        <p className="text-gray-500">
          Administrá clases, podcasts, categorías y acceso premium.
        </p>
      </header>

      <AdminContentManager
        initialContent={content || []}
        categories={categories || []}
      />
    </div>
  );
}
