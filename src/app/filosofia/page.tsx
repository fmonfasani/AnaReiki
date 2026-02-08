import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function Filosofia() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  ESENCIA
                </div>
                <h1 className="font-display text-5xl md:text-6xl font-medium leading-tight">
                  Filosofía humana y{" "}
                  <span className="text-primary italic">consciente</span>.
                </h1>
                <p className="text-lg md:text-xl text-text-subtle leading-relaxed font-light">
                  Entiendo al cuerpo como un campo sensible que guarda memoria
                  emocional y energética. Mi trabajo se orienta a facilitar
                  espacios de conciencia donde esa información pueda ser
                  reconocida e integrada, permitiendo que la energía vuelva a
                  fluir de manera armónica. Creo en el poder del cuerpo como
                  guía y en la importancia de escuchar sus mensajes para
                  recuperar el equilibrio y el bienestar.
                </p>
                <div className="grid gap-6 pt-4">
                  <div className="flex items-start gap-4 p-8 bg-white dark:bg-background-alt/10 rounded-3xl shadow-sm border border-background-alt/50 transition-all hover:shadow-md">
                    <span className="material-symbols-outlined text-primary-dark text-4xl">
                      self_improvement
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-display text-xl font-bold text-text-main dark:text-text-main">
                        Presencia
                      </h3>
                      <p className="text-sm text-text-light">
                        Acompaño desde una mirada amorosa, profunda y guiada.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-8 bg-white dark:bg-background-alt/10 rounded-3xl shadow-sm border border-background-alt/50 transition-all hover:shadow-md">
                    <span className="material-symbols-outlined text-primary-dark text-4xl">
                      favorite
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-display text-xl font-bold text-text-main dark:text-text-main">
                        Sanación
                      </h3>
                      <p className="text-sm text-text-light">
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
