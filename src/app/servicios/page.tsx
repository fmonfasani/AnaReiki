import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const services = [
  {
    title: "Lectura de Registros Akáshicos",
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
    title: "Sesión Biodecodificación",
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
    title: "Sesión Reiki",
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
    title: "Armonización de chakras con péndulo",
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
    title: "Ejercicios de Tapping",
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
  {
    title: "Consultas por encuentros",
    subtitle: "Espacios de consulta personalizada",
    img: "/images/consultation.png",
    description:
      "Espacios individuales diseñados para profundizar en temas específicos a través de un abordaje holístico, brindando herramientas concretas para el proceso personal.",
    benefits: [
      "Atención personalizada",
      "Herramientas prácticas",
      "Enfoque integral",
      "Seguimiento consciente",
    ],
  },
  {
    title: "Clases de yoga para niños",
    subtitle: "Movimiento, juego y calma",
    img: "/images/kids_yoga.png",
    description:
      "Clases adaptadas a la infancia que promueven el juego, la conciencia corporal, la respiración y la gestión emocional, respetando los tiempos y necesidades de cada niño.",
    benefits: [
      "Conciencia corporal",
      "Gestión emocional",
      "Juego consciente",
      "Calma y atención",
    ],
  },
  {
    title: "Rito y sanación de útero y linaje femenino",
    subtitle: "Honrá tu linaje femenino",
    img: "/images/womb_healing.png",
    description:
      "Ceremonias de encuentro y sanación que invitan a honrar el cuerpo, la energía femenina y el linaje ancestral, generando espacios de con tención, liberación y transformación.",
    benefits: [
      "Sanación ancestral",
      "Energía femenina",
      "Contención grupal",
      "Transformación",
    ],
  },
  {
    title: "Meditaciones Guiadas",
    subtitle: "Silencio y presencia",
    img: "/images/meditaciones_guiadas.png",
    description:
      "Un espacio para pausar la mente y conectar con el presente a través de la respiración y la visualización guiada. Ideal para reducir el estrés, calmar la ansiedad y recuperar la claridad mental en medio del ruido diario.",
    benefits: [
      "Pausa consciente",
      "Calma mental",
      "Reducción de estrés",
      "Foco y claridad",
    ],
  },
  {
    title: "Celebraciones Holísticas",
    subtitle: "Celebrar con presencia",
    img: "/images/holistic_celebration.png",
    description:
      "Propuestas de encuentros conscientes para celebrar momentos importantes de la vida desde una mirada integral, espiritual y amorosa (cumpleaños, bautismos, bendición del camino por el niño/a por nacer).",
    benefits: [
      "Celebración consciente",
      "Vínculos sagrados",
      "Mirada integral",
      "Entorno amoroso",
    ],
  },
];

export default function Servicios() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-[#1b1214]">
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h1 className="font-display text-5xl md:text-6xl font-medium mb-6 text-white">
                Servicios
              </h1>
              <p className="text-white/80 text-lg font-light leading-relaxed mb-4">
                Terapias holísticas diseñadas para acompañarte en tu proceso de
                sanación, autodescubrimiento y equilibrio integral.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-white font-medium text-sm border border-white/10">
                <span className="material-symbols-outlined text-sm">
                  check_circle
                </span>
                Modalidad Online / Presencial
              </div>
            </div>

            <div className="space-y-24">
              {services.map((service, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-12 lg:gap-20 items-center`}
                >
                  <div className="flex-1 w-full relative h-[450px] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/5">
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
                    <h2 className="font-display text-4xl font-medium text-white">
                      {service.title}
                    </h2>
                    <p className="text-white/70 text-lg leading-relaxed">
                      {service.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      {service.benefits.map((benefit, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary-dark text-sm font-bold">
                            check_circle
                          </span>
                          <span className="text-sm font-medium text-white/90">
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
