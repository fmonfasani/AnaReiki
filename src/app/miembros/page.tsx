import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import MoodTracker from "@/components/MoodTracker";

export default async function MembersDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null; // Should be handled by layout/middleware

  // Get next appointment
  const today = new Date().toISOString();
  const { data: nextAppointment } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .gte('start_time', today)
    .order('start_time', { ascending: true })
    .limit(1)
    .single();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 font-display">
            ¡Hola, {user.user_metadata?.full_name?.split(" ")[0]}! ✨
          </h1>
          <p className="text-purple-100 max-w-xl">
            Bienvenida a tu espacio sagrado. Hoy es un buen día para conectar con
            tu energía.
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

        {/* Next Appointment Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
           <div>
              <h3 className="font-bold text-gray-900 mb-4 font-display flex items-center gap-2">
                 <span className="material-symbols-outlined text-pink-500">event</span>
                 Próxima Sesión
              </h3>
              
              {nextAppointment ? (
                 <div>
                    <p className="text-2xl font-bold text-gray-800">
                       {new Date(nextAppointment.start_time).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-pink-600 font-medium text-lg">
                       {new Date(nextAppointment.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute:'2-digit' })} hs
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
              href="/miembros/reservar"
              className="mt-6 w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl text-center text-sm transition-colors border border-gray-200"
           >
              {nextAppointment ? 'Gestionar Citas' : 'Agendar Sesión'}
           </Link>
        </div>
      </div>


      {/* Quick Access Grid */}
      <h3 className="font-bold text-gray-900 text-xl font-display mt-8">
        Continúa tu práctica
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/miembros/clases"
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
          href="/miembros/podcast"
            </p>
            <span className="inline-flex items-center text-pink-600 font-bold group-hover:translate-x-2 transition-transform">
              Escuchar ahora <span className="ml-2">→</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Latest Content Placeholder Section */}
      <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="mr-3">🚀</span> Recientemente Agregado
        </h2>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-gray-400 max-w-sm">
            Pronto aparecerán aquí tus últimas clases y episodios del podcast
            para un acceso más rápido.
          </p>
        </div>
      </section>
    </div>
  );
}
