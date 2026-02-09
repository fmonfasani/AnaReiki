"use server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const servicio = formData.get("servicio") as string;
  const mensaje = formData.get("mensaje") as string;

  if (!nombre || !email || !mensaje) {
    return { error: "Por favor, completa los campos requeridos." };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Ana Reiki Contacto <onboarding@resend.dev>",
      to: ["murat.anaj@gmail.com"],
      subject: `Nuevo mensaje de ${nombre} - Ana Reiki`,
      replyTo: email,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Servicio de interés:</strong> ${servicio}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${mensaje}</p>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return {
        error:
          "Hubo un problema al enviar el correo. Por favor, intenta de nuevo más tarde o contáctame por WhatsApp.",
      };
    }

    return {
      success:
        "Mensaje enviado con éxito. Me pondré en contacto contigo pronto.",
    };
  } catch (err) {
    console.error("Server Error:", err);
    return { error: "Ocurrió un error inesperado." };
  }
}
