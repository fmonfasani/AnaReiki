import Image from "next/image";

const encounters = [
  {
    title: "Yoga en Familia",
    subtitle: "Compartí un momento consciente",
    image: "/images/family_yoga.png",
    description:
      "Encuentros pensados para compartir un espacio de conexión, movimiento y presencia entre grandes y chicos, fortaleciendo el vínculo y el bienestar emocional.",
  },
  {
    title: "Yoga para Niños",
    subtitle: "Movimiento, juego y calma",
    image: "/images/kids_yoga.png",
    description:
      "Clases adaptadas a la infancia que promueven el juego, la conciencia corporal, la respiración y la gestión emocional, respetando los tiempos y necesidades de cada niño.",
  },
  {
    title: "Rito del Útero",
    subtitle: "Honrá tu linaje femenino",
    image: "/images/womb_healing.png",
    description:
      "Ceremonias de encuentro y sanación que invitan a honrar el cuerpo, la energía femenina y el linaje ancestral, generando espacios de contención, liberación y transformación.",
  },
  {
    title: "Celebraciones Holísticas",
    subtitle: "Celebrar con presencia",
    image: "/images/holistic_celebration.png",
    description:
      "Propuestas de encuentros conscientes para celebrar momentos importantes de la vida desde una mirada integral, espiritual y amorosa (cumpleaños, bautismos, bendiciones).",
  },
];

export default function Encounters() {
  return (
    <section id="encuentros" className="py-24 bg-background-alt/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-medium text-text-main mb-4">
            Encuentros
          </h2>
          <p className="text-text-light max-w-2xl mx-auto">
            Espacios grupales diseñados para la conexión comunitaria y el
            crecimiento compartido.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {encounters.map((item, i) => (
            <div
              key={i}
              className="group relative aspect-[3/4] overflow-hidden rounded-[2.5rem] shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-text-main/90 via-text-main/20 to-transparent opacity-80 transition-opacity group-hover:opacity-95" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <h3 className="font-display text-2xl font-bold mb-1">
                  {item.title}
                </h3>
                <p className="text-primary-dark font-bold text-xs uppercase tracking-widest mb-3">
                  {item.subtitle}
                </p>
                <p className="text-sm text-gray-200 line-clamp-3 opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
