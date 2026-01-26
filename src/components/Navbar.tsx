import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-background-alt/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="material-symbols-outlined text-primary text-3xl group-hover:rotate-180 transition-transform duration-700">
              spa
            </span>
            <h2 className="font-display text-2xl font-medium tracking-tight">
              Ana Reiki
            </h2>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/servicios"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Servicios
            </Link>
            <Link
              href="/filosofia"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Filosofía
            </Link>
            <Link
              href="/contacto"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Contacto
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/contacto"
              className="hidden md:flex bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-display font-medium transition-all transform hover:scale-105 shadow-lg shadow-primary/20"
            >
              Reservar Sesión
            </Link>
            <button className="md:hidden text-text-main p-2">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
