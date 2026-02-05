import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-background-light pt-16 pb-8 border-t border-background-alt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">
                spa
              </span>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight">
                ANA MUR REIKI
              </h3>
            </div>
            <p className="text-terracotta text-sm leading-relaxed max-w-sm italic">
              "Acompaño a mujeres a sanar desde la raíz, activar su energía
              femenina y vivir en sincronicidad con su ser."
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold text-lg mb-4 text-text-main">
              Secciones
            </h4>
            <ul className="space-y-3 text-sm text-terracotta">
              <li>
                <Link
                  href="/"
                  className="hover:text-primary-dark transition-colors"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/servicios"
                  className="hover:text-primary-dark transition-colors"
                >
                  Servicios
                </Link>
              </li>
              <li>
                <Link
                  href="/filosofia"
                  className="hover:text-primary-dark transition-colors"
                >
                  Filosofía
                </Link>
              </li>
              <li>
                <Link
                  href="/contacto"
                  className="hover:text-primary-dark transition-colors"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-lg mb-4 text-text-main">
              Contacto
            </h4>
            <ul className="space-y-3 text-sm text-terracotta">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  mail
                </span>
                murat.anaj@gmail.com
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  call
                </span>
                +54 3584376502
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  location_on
                </span>
                Río Cuarto, Córdoba. Argentina
              </li>
              <li className="flex items-center gap-2 pt-2 border-t border-primary/10">
                <span className="material-symbols-outlined text-base">
                  person
                </span>
                @anamur.reiki
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-terracotta">
          <p>
            © 2024 Ana Reiki Bienestar Holístico. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="hover:text-primary-dark transition-colors"
            >
              Privacidad
            </Link>
            <Link
              href="#"
              className="hover:text-primary-dark transition-colors"
            >
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
