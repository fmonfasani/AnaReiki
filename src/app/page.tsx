import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Therapies from "@/components/Therapies";
import Encounters from "@/components/Encounters";
import Timeline from "@/components/Timeline";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-12 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="flex flex-col gap-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-text-main w-fit mx-auto lg:mx-0 shadow-sm border border-primary/20">
                  <span className="material-symbols-outlined text-sm">
                    self_improvement
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Restaura tu Equilibrio
                  </span>
                </div>
                <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-medium leading-[1.2] lg:leading-[1.1] text-text-main">
                  Reconectá con tu{" "}
                  <span className="text-primary-dark italic">
                    armonía interior
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-text-light font-body font-light leading-relaxed max-w-xl mx-auto lg:mx-0 px-4 sm:px-0">
                  En medio del ritmo cotidiano, muchas veces nos alejamos de lo
                  que sentimos y necesitamos. Este espacio fue creado para
                  acompañarte a volver a tu centro, escuchar tu cuerpo y
                  emociones y recuperar el equilibrio que te pertenece.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4 px-6 sm:px-0">
                  <Link
                    href="https://wa.me/543584376502"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-whatsapp hover:bg-whatsapp/90 text-white px-8 py-4 rounded-full font-display font-bold text-lg transition-all shadow-xl shadow-whatsapp/20 flex items-center justify-center gap-2 group transform hover:-translate-y-1"
                  >
                    Contactame
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                      chat
                    </span>
                  </Link>
                  <Link
                    href="#terapias"
                    className="bg-white border border-primary/20 hover:bg-background-alt text-text-main px-8 py-4 rounded-full font-display font-medium text-lg transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1 overflow-hidden"
                  >
                    <span className="material-symbols-outlined text-primary-dark">
                      spa
                    </span>
                    Explorar Servicios
                  </Link>
                </div>
              </div>

              <div className="relative lg:h-[650px] flex items-center justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-primary/30 to-transparent rounded-full blur-3xl -z-10 animate-pulse"></div>
                <div className="relative w-full aspect-[4/5] lg:aspect-auto lg:h-full rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white">
                  <Image
                    src="/images/hero.png"
                    alt="Ana - Bienestar Holístico"
                    fill
                    className="object-cover transition-transform duration-[4s] hover:scale-110"
                    priority
                  />
                  <div className="absolute bottom-8 left-8 right-8 glass p-6 rounded-3xl shadow-lg z-20 border border-white/40">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/40 p-3 rounded-full text-text-main">
                        <span className="material-symbols-outlined">
                          favorite
                        </span>
                      </div>
                      <div>
                        <p className="font-display font-bold text-lg text-text-main tracking-tight">
                          Esencia & Luz
                        </p>
                        <p className="text-sm text-text-light">
                          Acompañando procesos de sanación
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Preview */}
        <section className="py-24 bg-white relative">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="material-symbols-outlined text-5xl text-primary/30 mb-6">
              format_quote
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-medium leading-relaxed text-text-main mb-8">
              "En medio del ritmo cotidiano, muchas veces nos alejamos de lo que
              sentimos y necesitamos. Este espacio fue creado para acompañarte a
              volver a tu centro y recuperar el equilibrio."
            </h2>
            <Link
              href="/filosofia"
              className="text-primary-dark font-bold uppercase tracking-widest text-sm hover:underline flex items-center justify-center gap-2"
            >
              Conocé mi misión{" "}
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </Link>
          </div>
        </section>

        <Therapies />

        <Encounters />

        <Timeline />

        {/* Final CTA */}
        <section className="py-24 bg-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="font-display text-4xl md:text-5xl font-medium text-text-main mb-8">
              ¿Sentís el llamado a escucharte?
              <br />
              <span className="italic text-primary-dark">
                ¿Te regalás un espacio para vos?
              </span>
            </h2>
            <p className="text-xl text-text-light mb-12 max-w-2xl mx-auto leading-relaxed">
              La claridad y el equilibrio emocional se construyen a partir de
              una decisión. Reservá tu espacio hoy.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="https://wa.me/543584376502"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-whatsapp hover:bg-whatsapp/90 text-white px-12 py-5 rounded-full font-display font-bold text-xl transition-all shadow-xl shadow-whatsapp/30 transform hover:-translate-y-1"
              >
                Contactame
              </Link>
              <Link
                href="/contacto"
                className="bg-white hover:bg-background-alt text-text-main px-12 py-5 rounded-full font-display font-bold text-xl transition-all shadow-md transform hover:-translate-y-1"
              >
                Contactar
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
