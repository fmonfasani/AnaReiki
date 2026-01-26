import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-12 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="flex flex-col gap-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light text-primary w-fit mx-auto lg:mx-0 shadow-sm">
                  <span className="material-symbols-outlined text-sm">
                    self_improvement
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Restaura tu Equilibrio
                  </span>
                </div>
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium leading-[1.1] text-text-main">
                  Reconectá con tu{" "}
                  <span className="text-primary italic">armonía interior</span>
                </h1>
                <p className="text-lg sm:text-xl text-text-subtle font-body font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Un viaje transformador de bioenergía, movimiento consciente y
                  visión espiritual diseñado para restaurar la paz y la
                  vitalidad en tu vida.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  <Link
                    href="/contacto"
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-display font-bold text-lg transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 group"
                  >
                    Comienza tu Viaje
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </Link>
                  <Link
                    href="/servicios"
                    className="bg-white border border-background-alt hover:bg-background-light text-text-main px-8 py-4 rounded-xl font-display font-medium text-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-primary">
                      spa
                    </span>
                    Ver Servicios
                  </Link>
                </div>
              </div>

              <div className="relative lg:h-[600px] flex items-center justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary-light/40 to-transparent rounded-full blur-3xl -z-10"></div>
                <div className="relative w-full aspect-[4/5] lg:aspect-auto lg:h-full rounded-t-[10rem] rounded-b-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                  <Image
                    src="/images/hero.png"
                    alt="Mujer meditando en posición de loto serena"
                    fill
                    className="object-cover transition-transform duration-[2s] hover:scale-105"
                    priority
                  />
                  <div className="absolute bottom-8 left-8 right-8 glass p-6 rounded-2xl shadow-lg z-20">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full text-primary">
                        <span className="material-symbols-outlined">
                          favorite
                        </span>
                      </div>
                      <div>
                        <p className="font-display font-bold text-lg text-text-main">
                          Práctica Diaria
                        </p>
                        <p className="text-sm text-text-subtle">
                          Únete a cientos en paz
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Brief Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-4xl md:text-5xl font-medium mb-16">
              Nuestras Propuestas
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Bioenergía",
                  img: "/images/bioenergy.png",
                  desc: "Equilibra tus centros energéticos.",
                },
                {
                  title: "Registros Akáshicos",
                  img: "/images/akashic.png",
                  desc: "Obtén guía espiritual del alma.",
                },
                {
                  title: "Yoga Consciente",
                  img: "/images/yoga.png",
                  desc: "Alinea cuerpo, mente y espíritu.",
                },
              ].map((service, i) => (
                <div
                  key={i}
                  className="group relative bg-background-light rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-primary/10"
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <Image
                      src={service.img}
                      alt={service.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-8">
                    <h3 className="font-display text-2xl font-medium mb-3">
                      {service.title}
                    </h3>
                    <p className="text-text-subtle text-sm mb-6">
                      {service.desc}
                    </p>
                    <Link
                      href="/servicios"
                      className="inline-flex items-center text-primary font-bold text-sm group-hover:gap-2 transition-all"
                    >
                      Más información{" "}
                      <span className="material-symbols-outlined text-sm">
                        arrow_right_alt
                      </span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
