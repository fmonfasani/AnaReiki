import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function Filosofia() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="py-24 relative overflow-hidden bg-[#1b1214] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary-dark text-xs font-bold uppercase tracking-wider">
                  ESENCIA
                </div>
                <h1 className="font-display text-5xl md:text-6xl font-medium leading-tight text-white">
                  Filosofía humana y{" "}
                  <span className="text-primary-dark italic">consciente</span>.
                </h1>
                <p className="text-lg md:text-xl text-white/90 leading-relaxed font-light">
                  Entiendo al cuerpo como un campo sensible que guarda memoria
                  emocional y energética. Mi trabajo se orienta a facilitar
                  espacios de conciencia donde esa información pueda ser
                  reconocida e integrada, permitiendo que la energía vuelva a
                  fluir de manera armónica. Creo en el poder del cuerpo como
                  guía y en la importancia de escuchar sus mensajes para
                  recuperar el equilibrio y el bienestar.
                </p>
                <div className="grid gap-6 pt-4">
                  <div className="flex items-start gap-4 p-8 bg-white/5 rounded-3xl shadow-sm border border-white/10 transition-all hover:shadow-md hover:bg-white/10">
                    <span className="material-symbols-outlined text-primary-dark text-4xl">
                      self_improvement
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-display text-xl font-bold text-white">
                        Presencia
                      </h3>
                      <p className="text-sm text-white/70">
                        Acompaño desde una mirada amorosa, profunda y guiada.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-8 bg-white/5 rounded-3xl shadow-sm border border-white/10 transition-all hover:shadow-md hover:bg-white/10">
                    <span className="material-symbols-outlined text-primary text-4xl">
                      favorite
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-display text-xl font-bold text-white">
                        Sanación
                      </h3>
                      <p className="text-sm text-white/70">
                        Acompaño procesos de sanación desde una mirada integral,
                        respetuosa y consciente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 relative w-full h-[600px] rounded-[3rem] overflow-hidden shadow-2xl">
                <Image
                  src="/images/hero.png"
                  alt="Filosofía Ana Reiki"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background-alt/30">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
            <h2 className="font-display text-4xl font-medium">Compromiso</h2>
            <p className="text-2xl md:text-3xl text-text-subtle italic leading-relaxed font-light">
              "Mi misión es facilitar un espacio seguro de contención y
              equilibrio, donde cada persona pueda recordar su propia capacidad
              de sanación y redescubrir la luz que ya habita en su interior."
            </p>
            <div className="h-0.5 w-24 bg-primary/40 mx-auto transition-all group-hover:w-32"></div>
            <p className="font-bold font-display uppercase tracking-[0.2em] text-xs text-primary-dark">
              — Ana, Terapeuta Holística
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
