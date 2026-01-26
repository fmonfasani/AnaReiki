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
                  Nuestra Esencia
                </div>
                <h1 className="font-display text-5xl md:text-6xl font-medium leading-tight">
                  Sabiduría ancestral para la vida{" "}
                  <span className="text-primary italic">moderna</span>.
                </h1>
                <p className="text-lg text-text-subtle leading-relaxed">
                  Creemos que el verdadero bienestar no es solo la ausencia de
                  malestar, sino la presencia vibrante de energía vital en todos
                  los niveles del ser.
                </p>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-background-alt/50">
                    <span className="material-symbols-outlined text-primary text-3xl">
                      self_improvement
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-bold mb-1">
                        Presencia
                      </h3>
                      <p className="text-sm text-text-subtle">
                        El aquí y ahora como único espacio de sanación
                        verdadera.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-background-alt/50">
                    <span className="material-symbols-outlined text-primary text-3xl">
                      favorite
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-bold mb-1">
                        Compasión
                      </h3>
                      <p className="text-sm text-text-subtle">
                        Hacia uno mismo y hacia el camino de cada alma.
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
            <h2 className="font-display text-4xl font-medium">
              Nuestro Compromiso
            </h2>
            <p className="text-xl text-text-subtle italic leading-relaxed">
              "Mi misión es facilitar un espacio seguro de contención y
              equilibrio, donde cada persona pueda recordar su propia capacidad
              de sanación y redescubrir la luz que ya habita en su interior."
            </p>
            <div className="h-0.5 w-20 bg-primary/30 mx-auto"></div>
            <p className="font-bold font-display uppercase tracking-widest text-sm">
              — Ana, Terapeuta Holística
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
