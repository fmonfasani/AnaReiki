# Documentación Técnica: Proyecto Ana Murat - Bienestar Holístico

Esta documentación detalla la arquitectura, tecnologías y funcionalidades implementadas en la plataforma web de Ana Murat.

## 1. Stack Tecnológico (Core)

| Tecnología        | Uso                                   | Versión |
| :---------------- | :------------------------------------ | :------ |
| **Next.js**       | Framework de Aplicación (App Router)  | 15.x    |
| **TypeScript**    | Lenguaje de programación              | 5.x     |
| **Tailwind CSS**  | Estilos y Diseño de Interfaz          | 4.0     |
| **Framer Motion** | Animaciones e Interacciones fluidas   | 12.x    |
| **Resend**        | Infraestructura de Mailing            | SDK v3  |
| **Vercel**        | Hosting y despliegue continuo (CI/CD) | -       |

---

## 2. Arquitectura de la Aplicación

La aplicación sigue el patrón de **App Router** de Next.js, organizando la lógica en componentes de cliente y servidor para optimizar el rendimiento.

### Estructura de Carpetas:

- `/src/app`: Rutas del sistema (`/`, `/servicios`, `/filosofia`, `/contacto`).
- `/src/components`: Componentes modulares y reutilizables.
- `/public`: Activos estáticos como imágenes generadas por IA y logotipos.
- `/docs`: Registro de análisis y tareas (Análisis de cambios, logs de desarrollo).

---

## 3. Funcionalidades Detalladas (Features)

### 3.1 Sistema de Contacto e Integraciones

- **Mailing Nativo:** Implementado mediante `Server Actions` y la API de **Resend**. Permite a los usuarios enviar consultas sin salir de la web.
- **WhatsApp (`bg-whatsapp`):** Acceso directo y persistente a través de botones de alta visibilidad para contacto inmediato.
- **Calendly:** Integración de agenda externa para la reserva automatizada de sesiones.

### 3.2 Experiencia de Usuario (UX) Móvil

- **Menú Sandwich Premium:** Un overlay de pantalla completa (`z-[9999]`) diseñado para ser 100% opaco y facilitar la navegación con el pulgar.
- **Diseño Adaptativo:** Uso exhaustivo de grillas dinámicas que se ajustan desde móviles pequeños hasta pantallas 4K.

### 3.3 Catálogo de Servicios

- **Gestión Dinámica:** Sistema de 9 terapias (incluyendo las nuevas Meditaciones Guiadas) renderizadas mediante arrays de objetos, facilitando la escalabilidad futura.
- **Segmentación:** Dropdown dinámico en el formulario de contacto para pre-clasificar el interés del paciente.

---

## 4. Diseño y Estética

La plataforma utiliza un lenguaje visual **Premium Holístico**:

- **Tipografías:** Uso de fuentes `display` para títulos elegantes y `body` ligeras para lecturas relajadas.
- **Paleta de Colores:**
  - `primary-dark`: #d48498 (Marca)
  - `terracotta`: #a86b5e (Acentos)
  - `whatsapp`: #25d366 (Conversión)
  - `background-light`: Blanco roto para evitar la fatiga visual.

---

## 5. Mantenimiento y Escalabilidad

- **Variables de Entorno:** Claves sensibles (`RESEND_API_KEY`) gestionadas de forma segura en el dashboard de Vercel.
- **SEO:** Implementación de etiquetas semánticas HTML5 y optimización de carga de imágenes (Next/Image) para un posicionamiento orgánico superior.

---

**Desarrollado con enfoque en conversión y bienestar.** © 2026 Ana Murat.
