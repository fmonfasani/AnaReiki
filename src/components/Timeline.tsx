export default function Timeline() {
  const steps = [
    {
      id: "01",
      title: "Escucha Atenta",
      desc: "Comenzamos con una escucha atenta para comprender el estado actual que estás atravesando, tus emociones, los desafíos que estás transitando y la intención del encuentro.",
      icon: "psychology",
    },
    {
      id: "02",
      title: "Sesión Personalizada",
      desc: "Una sesión personalizada es un espacio de pausa y de diferentes abordajes holísticos para acompañar procesos conscientes y recuperar el equilibrio.",
      icon: "spa",
    },
    {
      id: "03",
      title: "Integración",
      desc: "Durante el proceso te comparto herramientas simples que acompañan la integración de lo trabajado, favoreciendo la autoobservación y el cuidado personal.",
      icon: "all_inclusive",
    },
  ];

  return (
    <section id="proceso" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-20">
          <h2 className="font-display text-4xl md:text-5xl font-medium text-text-main">
            Acompañamiento Terapéutico Integral:
            <br />
            <span className="italic text-primary-dark">
              “Un Encuentro con tu Interior”
            </span>
          </h2>
          <div className="h-1 w-20 bg-primary/30 mx-auto mt-6 rounded-full"></div>
        </div>

        <div className="relative">
          {/* Central Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-primary/20 md:-translate-x-1/2"></div>

          <div className="space-y-12">
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative flex flex-col md:flex-row items-start md:items-center gap-8 group"
              >
                <div
                  className={`flex-1 ${i % 2 === 0 ? "md:text-right" : "md:order-3 md:text-left"} order-2`}
                >
                  <span className="text-primary font-bold text-sm tracking-widest uppercase mb-1 block">
                    Paso {step.id}
                  </span>
                  <h3 className="font-display text-3xl font-medium text-text-main mb-2">
                    {step.title}
                  </h3>
                  <p className="text-text-light leading-relaxed max-w-md mx-auto md:ml-auto md:mr-0">
                    {step.desc}
                  </p>
                </div>

                <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-white border-2 border-primary rounded-full shrink-0 order-1 md:order-2 shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform duration-500">
                  <span className="material-symbols-outlined text-primary text-xl">
                    {step.icon}
                  </span>
                </div>

                <div
                  className={`flex-1 order-3 ${i % 2 === 0 ? "" : "md:order-1"} hidden md:block`}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
