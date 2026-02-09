"use client";
import { useState } from "react";
import { sendEmail } from "./actions";

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setStatus(null);

    const result = await sendEmail(formData);

    setIsSubmitting(false);
    if (result.success) {
      setStatus({ type: "success", message: result.success });
      // Reset form
      const form = document.querySelector("form") as HTMLFormElement;
      form?.reset();
    } else if (result.error) {
      setStatus({ type: "error", message: result.error });
    }
  }

  return (
    <div className="bg-white dark:bg-background-alt/5 p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-background-alt/50 transition-all">
      <form action={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-main dark:text-text-main ml-1 uppercase tracking-wider">
              Nombre
            </label>
            <input
              name="nombre"
              type="text"
              required
              className="w-full px-6 py-5 rounded-2xl bg-background-light dark:bg-white text-text-main border-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-text-light/50"
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-main dark:text-text-main ml-1 uppercase tracking-wider">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-6 py-5 rounded-2xl bg-background-light dark:bg-white text-text-main border-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-text-light/50"
              placeholder="tu@email.com"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-text-main dark:text-text-main ml-1 uppercase tracking-wider">
            Servicio de interés
          </label>
          <select
            name="servicio"
            required
            className="w-full px-6 py-5 rounded-2xl bg-background-light dark:bg-white text-text-main border-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none cursor-pointer"
          >
            <option value="">Selecciona una opción</option>
            <option value="Bioenergía">Bioenergía</option>
            <option value="Registros Akáshicos">Registros Akáshicos</option>
            <option value="Meditaciones Guiadas">Meditaciones Guiadas</option>
            <option value="Yoga Consciente">Yoga Consciente</option>
            <option value="Acompañamiento Terapéutico">
              Acompañamiento Terapéutico
            </option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-text-main dark:text-text-main ml-1 uppercase tracking-wider">
            Mensaje
          </label>
          <textarea
            name="mensaje"
            rows={4}
            required
            className="w-full px-6 py-5 rounded-2xl bg-background-light dark:bg-white text-text-main border-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-text-light/50"
            placeholder="¿En qué puedo ayudarte?"
          ></textarea>
        </div>

        {status && (
          <div
            className={`p-4 rounded-2xl text-sm font-medium ${
              status.type === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-terracotta hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-display font-bold text-xl transition-all shadow-xl shadow-terracotta/20 transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Enviando...
            </>
          ) : (
            "Enviar Mensaje"
          )}
        </button>
      </form>
    </div>
  );
}
