import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const services = [
  {
    title: "Registros Akáshicos",
    subtitle: "Accedé a la guía de tu alma",
    img: "/images/akashic.png",
    description:
      "Los Registros Akáshicos son una herramienta de acceso a la información del alma. A través de su apertura, se obtiene guía, claridad y comprensión sobre situaciones de la vida presente, vínculos, bloqueos emocionales y procesos personales, facilitando la toma de conciencia y la sanación.",
    benefits: [
      "Claridad en vínculos",
      "Sanación de bloqueos",
      "Comprensión del alma",
      "Guía espiritual",
    ],
  },
  {
    title: "Biodecodificación",
    subtitle: "Comprendé el origen emocional",
    img: "/images/bioenergy.png",
    description:
      "La Biodecodificación acompaña a reconocer el origen emocional de síntomas físicos, enfermedades o conflictos recurrentes. Mediante la observación consciente, se genera comprensión y transformación, favoreciendo el equilibrio entre cuerpo, mente y emoción.",
    benefits: [
      "Origen de síntomas",
      "Equilibrio emocional",
      "Observación consciente",
      "Transformación personal",
    ],
  },
  {
    title: "Reiki",
    subtitle: "Armonizá cuerpo, mente y energía",
    img: "/images/hero.png",
    description:
      "El Reiki es una terapia energética que canaliza energía vital universal para armonizar cuerpo, mente y espíritu. Durante la sesión se promueve la relajación profunda, la liberación de tensiones y el restablecimiento del bienestar integral.",
    benefits: [
      "Armonización energética",
      "Relajación profunda",
      "Liberación de tensiones",
      "Bienestar integral",
    ],
  },
  {
    title: "Armonización de Chakras con Péndulo",
    subtitle: "Equilibrá tu energía vital",
    img: "/images/pendulum.png",
    description:
      "La armonización de chakras con péndulo trabaja sobre los centros energéticos del cuerpo, detectando y liberando bloqueos. Este proceso ayuda a restaurar el flujo natural de la energía, aportando equilibrio, claridad y vitalidad.",
    benefits: [
      "Equilibrio de chakras",
      "Detección de bloqueos",
      "Vitalidad renovada",
      "Claridad energética",
    ],
  },
  {
    title: "Tapping (EFT)",
    subtitle: "Liberá emociones y tensiones",
    img: "/images/tapping.png",
    description:
      "El Tapping o EFT (Emotional Freedom Techniques) es una técnica de liberación emocional que combina estimulación suave de puntos energéticos con enfoque consciente en emociones, pensamientos o situaciones que generan malestar. Ayuda a reducir el estrés, la ansiedad y bloqueos emocionales.",
    benefits: [
      "Reducción de estrés",
      "Liberación emocional",
      "Calma mental",
      "Bienestar inmediato",
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
              <p className="text-text-light text-lg font-light leading-relaxed">
                Terapias holísticas diseñadas para acompañarte en tu proceso de
                sanación, autodescubrimiento y equilibrio integral.
              </p>
            </div>

            <div className="space-y-24">
              {services.map((service, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-12 lg:gap-20 items-center`}
                >
                  <div className="flex-1 w-full relative h-[450px] rounded-[3rem] overflow-hidden shadow-2xl">
                    <Image
                      src={service.img}
                      alt={service.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-6">
                    <span className="text-primary-dark font-bold text-sm tracking-widest uppercase">
                      {service.subtitle}
                    </span>
                    <h2 className="font-display text-4xl font-medium text-text-main">
                      {service.title}
                    </h2>
                    <p className="text-text-light text-lg leading-relaxed">
                      {service.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      {service.benefits.map((benefit, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm font-bold">
                            check_circle
                          </span>
                          <span className="text-sm font-medium text-text-main">
                            {benefit}
                          </span>
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
