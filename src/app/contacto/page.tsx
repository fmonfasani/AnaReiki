import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "./ContactForm";

export default function Contacto() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div className="space-y-8">
                <h1 className="font-display text-5xl md:text-6xl font-medium">
                  Iniciemos este{" "}
                  <span className="text-primary italic">viaje juntos</span>.
                </h1>
                <p className="text-lg text-text-subtle leading-relaxed">
                  ¿Tienes alguna duda o quieres reservar una sesión? Completa el
                  formulario y me pondré en contacto contigo lo antes posible.
                </p>
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wider text-text-subtle">
                        Email
                      </p>
                      <a
                        href="mailto:murat.anaj@gmail.com"
                        className="text-lg hover:text-primary transition-colors"
                      >
                        murat.anaj@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">call</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wider text-text-subtle">
                        WhatsApp
                      </p>
                      <a
                        href="https://wa.me/543584376502"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg hover:text-primary transition-colors flex items-center gap-2"
                      >
                        +54 3584376502
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
