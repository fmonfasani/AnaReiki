import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const services = [
  {
    title: "Sanación Bioenergética",
    img: "/images/bioenergy.png",
    description:
      "La bioenergía es un proceso de sanación que trabaja sobre el campo energético humano. A través de un toque suave y la intención enfocada, ayudamos a liberar bloqueos emocionales y físicos, permitiendo que tu vitalidad natural fluya libremente.",
    benefits: [
      "Reducción del estrés y la ansiedad",
      "Mejora del sueño",
      "Claridad mental y emocional",
      "Fortalecimiento del sistema inmunológico",
    ],
  },
  {
    title: "Registros Akáshicos",
    img: "/images/akashic.png",
    description:
      "Accede a la 'biblioteca del alma'. Los Registros Akáshicos contienen la información de tu viaje espiritual, tus talentos, desafíos y propósito. Una lectura te brinda perspectiva y guía para situaciones actuales de tu vida.",
    benefits: [
      "Comprensión profunda de patrones de vida",
      "Guía para la toma de decisiones",
      "Sanación de memorias pasadas",
      "Conexión con tu propósito superior",
    ],
  },
  {
    title: "Yoga Consciente",
    img: "/images/yoga.png",
    description:
      "Una práctica que va más allá de lo físico. Combinamos asanas restaurativas con técnicas de respiración (pranayama) y meditación guiada para crear un refugio de paz interior y equilibrio corporal.",
    benefits: [
      "Flexibilidad y fuerza física",
      "Equilibrio del sistema nervioso",
      "Paz interior duradera",
      "Conexión cuerpo-mente",
    ],
  },
];

export default function Servicios() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="py-20 bg-background-alt/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h1 className="font-display text-5xl md:text-6xl font-medium mb-6">
                Nuestros Servicios
              </h1>
              <p className="text-text-subtle text-lg font-light leading-relaxed">
                Cada sesión está diseñada con un enfoque holístico para atender
                tus necesidades únicas, buscando siempre el retorno a tu centro
                y bienestar natural.
              </p>
            </div>

            <div className="space-y-24">
              {services.map((service, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-12 lg:gap-20 items-center`}
                >
                  <div className="flex-1 w-full relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
                    <Image
                      src={service.img}
                      alt={service.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-6">
                    <h2 className="font-display text-4xl font-medium text-text-main">
                      {service.title}
                    </h2>
                    <p className="text-text-subtle text-lg leading-relaxed">
                      {service.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      {service.benefits.map((benefit, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm">
                            check_circle
                          </span>
                          <span className="text-sm font-medium">{benefit}</span>
                        </div>
                      ))}
                    </div>
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
