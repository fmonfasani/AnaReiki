import { format, differenceInCalendarDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import MoodTracker from "@/components/MoodTracker";
import { redirect } from "next/navigation";

const DAILY_ORACLE = [
  "Respirá profundo y recordá: el cuerpo siempre te habla con ternura.",
  "Convocá un momento de silencio y escuchá lo que tu intuición quiere revelar.",
  "La presencia consciente hoy abre la puerta a nuevas oportunidades.",
  "Elegí la gratitud y permití que el equilibrio se convierta en tu brújula.",
  "Cada exhalación deja ir lo que ya no sirve; cada inhalación recibe claridad.",
  "Construí tu día desde la calma, y el resto se alinea desde adentro.",
];

const DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function calculateStreak(reflections?: { created_at: string }[]) {
  if (!reflections || reflections.length === 0) return 0;
  const sorted = [...reflections].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  let streak = 0;
  let lastDate: Date | null = null;
  for (const entry of sorted) {
    const day = startOfDay(new Date(entry.created_at));
    if (!lastDate) {
      streak = 1;
      lastDate = day;
      continue;
    }
    const diff = differenceInCalendarDays(lastDate, day);
    if (diff === 0) {
      continue;
    }
    if (diff === 1) {
      streak += 1;
      lastDate = day;
      continue;
    }
    break;
  }

  return streak;
}

export default async function MembersDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const todayIso = new Date().toISOString();
  const [nextAppointment, sessionNotes, reflections, recentContent, availability] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .eq("client_id", user.id)
        .gte("start_time", todayIso)
        .order("start_time", { ascending: true })
        .limit(1)
        .single(),
      supabase
        .from("session_notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_private", false)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("daily_reflections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(14),
      supabase
        .from("content")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(3),
      supabase
        .from("availability_rules")
        .select("*")
        .eq("is_active", true)
        .order("day_of_week")
        .order("start_time"),
    ]);

  const streak = calculateStreak(reflections?.data || []);
  const oracleQuote =
    DAILY_ORACLE[new Date().getDate() % DAILY_ORACLE.length] || DAILY_ORACLE[0];
  const nextSlots = (availability?.data || []).slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-700 to-pink-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider border border-white/30">
              🔥 Racha de {streak} días
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 font-display">
            ¡Hola, {user.user_metadata?.full_name?.split(" ")[0] || "alma"}! ✨
          </h1>
          <p className="text-purple-100 max-w-xl leading-relaxed text-lg italic mb-6">
            "{oracleQuote}"
          </p>
          <p className="text-purple-50/80 max-w-xl leading-relaxed">
            En medio del ritmo cotidiano, muchas veces nos alejamos de lo que
            sentimos y necesitamos. Este espacio fue creado para acompañarte a
            volver a tu centro.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-10 translate-y-10">
          <svg width="300" height="300" viewBox="0 0 200 200">
            <path
              fill="currentColor"
              d="M45.7,-76.3C58.9,-69.3,69.1,-55.6,76.5,-40.9C83.9,-26.2,88.5,-10.6,86.6,4.1C84.7,18.8,76.3,32.6,66.3,44.4C56.3,56.2,44.7,66,31.8,70.9C18.9,75.8,4.7,75.9,-8.8,73.8C-22.3,71.7,-35.1,67.4,-46.8,59.3C-58.5,51.2,-69.1,39.3,-75.6,25.3C-82.1,11.3,-84.5,-4.8,-80.4,-19.4C-76.3,-34,-65.7,-47.1,-53.4,-54.6C-41.1,-62.1,-27.1,-64,-13.6,-66.9C-0.1,-69.8,13.4,-73.7,32.5,-83.3L45.7,-76.3Z"
              transform="translate(100 100)"
            />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mood Tracker */}
        <div className="md:col-span-2">
          <MoodTracker userId={user.id} />
        </div>

        {/* Stats & Streak Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 mb-4 font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500">
                local_fire_department
              </span>
              Tu Progreso
            </h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-bold text-gray-900">{streak}</span>
              <span className="text-gray-500 pb-1">días seguidos</span>
            </div>
            <p className="text-sm text-gray-500">
              Cada día que te detienes a sentir es un paso hacia tu equilibrio.
            </p>
          </div>
          <Link
            href="/consultantes/evolucion"
            className="mt-6 w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl text-center text-sm transition-colors border border-gray-200"
          >
            Ver Bitácora
          </Link>
        </div>

        {/* Next Appointment Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 mb-4 font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-pink-500">
                event
              </span>
              Próxima Sesión
            </h3>

            {nextAppointment.data ? (
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {new Date(nextAppointment.data.start_time).toLocaleDateString(
                    "es-ES",
                    { weekday: "long", day: "numeric" },
                  )}
                </p>
                <p className="text-pink-600 font-medium text-lg">
                  {new Date(nextAppointment.data.start_time).toLocaleTimeString(
                    "es-ES",
                    { hour: "2-digit", minute: "2-digit" },
                  )}{" "}
                  hs
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold uppercase tracking-wide">
                  Confirmada
                </span>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No tienes sesiones agendadas próximamente.
              </p>
            )}
          </div>

          <Link
            href="/consultantes/mis-citas"
            className="mt-6 w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl text-center text-sm transition-colors border border-gray-200"
          >
            {nextAppointment.data ? "Gestionar Citas" : "Reservar Ahora"}
          </Link>
        </div>

        {/* New: Next Slots / Quick Booking */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 mb-4 font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-500">
                schedule
              </span>
              Sugerencias
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Próximos turnos disponibles para tu sesión de Reiki:
            </p>
            <div className="space-y-2">
              {nextSlots.length > 0 ? (
                nextSlots.map((slot, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                    <span className="font-medium text-gray-700">
                      {DAY_LABELS[slot.day_of_week]}
                    </span>
                    <span className="text-teal-600 font-bold">
                      {slot.start_time.slice(0, 5)} hs
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-gray-400 italic">No hay horarios definidos esta semana.</p>
              )}
            </div>
          </div>
          <Link
            href="/consultantes/reservar"
            className="mt-4 w-full py-2 px-4 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-xl text-center text-xs transition-colors border border-teal-100"
          >
            Ver Agenda Completa
          </Link>
        </div>
      </div>

      {/* Quick Access Grid */}
      <h3 className="font-bold text-gray-900 text-xl font-display mt-8">
        Continúa tu práctica
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link
          href="/consultantes/clases"
          className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 text-2xl mb-4 group-hover:scale-110 transition-transform">
            🧘‍♀️
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Clases de Yoga</h3>
          <p className="text-sm text-gray-500">
            Retoma tu última clase o explora nuevas secuencias.
          </p>
        </Link>

        <Link
          href="/consultantes/podcast"
          className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 text-2xl mb-4 group-hover:scale-110 transition-transform">
            🎧
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Meditaciones</h3>
          <p className="text-sm text-gray-500">
            Escucha nuevos episodios y meditaciones guiadas.
          </p>
        </Link>

        <Link
          href="/consultantes/chat-buda"
          className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 text-2xl mb-4 group-hover:scale-110 transition-transform">
            🪷
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Chat Buda</h3>
          <p className="text-sm text-gray-500">
            Conversá con Ana sobre tu proceso y emociones.
          </p>
        </Link>

        <Link
          href="/consultantes/evolucion"
          className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 text-2xl mb-4 group-hover:scale-110 transition-transform">
            🌿
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Mi Evolución</h3>
          <p className="text-sm text-gray-500">
            Revisa tu progreso y notas personales.
          </p>
        </Link>
      </div>

      {/* Latest Content Section */}
      <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 font-display flex items-center">
            <span className="mr-3">🚀</span> Recientemente Agregado
          </h2>
          <Link href="/consultantes/biblioteca" className="text-pink-600 font-bold text-sm hover:underline flex items-center gap-1">
            Biblioteca <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        {recentContent.data && recentContent.data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentContent.data.map((item) => (
              <Link
                key={item.id}
                href={item.type === 'video' ? `/consultantes/clases/${item.id}` : `/consultantes/podcast/${item.id}`}
                className="group flex flex-col"
              >
                <div className="aspect-video bg-gray-100 rounded-2xl mb-3 overflow-hidden border border-gray-50 relative">
                  {item.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-[10px] text-white font-bold uppercase">
                    {item.type}
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-gray-400 max-w-sm">
              Pronto aparecerán aquí tus últimas clases y episodios del podcast.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
