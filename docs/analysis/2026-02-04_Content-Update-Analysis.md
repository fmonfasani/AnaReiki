# Análisis de Cambios - Ana Reiki

Este documento analiza los cambios solicitados para la plataforma **Ana Reiki**, enfocándose en la actualización de contenidos, refinamiento de la identidad de marca y mejoras en la experiencia de usuario (UX).

## 1. Identidad de Marca y Navegación

- **Ajuste de Marca:** Se solicita cambiar el texto del header/logo para incluir "ANA MUR REIKI".
- **Simplificación:** Eliminar el sustantivo "NUESTRO" en los títulos de servicios para un tono más directo y minimalista ("Servicios" en lugar de "Nuestros Servicios").
- **Actualización de Menú:** El listado de servicios en la navegación y secciones debe expandirse para incluir las 9 especialidades actuales.

## 2. Refinamiento de Contenidos por Sección

### A. Filosofía ("Filosofía humana y consciente")

- **Nuevo Tono:** El texto debe reflejar una perspectiva integral del cuerpo como campo sensible y guía sabia.
- **Estructura:** Se actualizan los pilares (Presencia, Sanación) con descripciones más alineadas al propósito terapéutico actual.

### B. Acompañamiento Terapéutico Integral

- **Título:** "Acompañamiento Terapéutico Integral: 'Un Encuentro con tu Interior'".
- **Proceso:** Se ajustan las etapas de Escucha, Sesión Personalizada y Espacios Grupales para reflejar la metodología de Ana.

### C. Encuentros (Espacios Grupales)

- **Actualización Total:** Modificar los 4 tipos de encuentros (Yoga Familia, Yoga Niños, Rito Útero, Celebraciones Holísticas).
- **Problema de Lectura:** Actualmente las descripciones en las tarjetas no se leen completas. Se requiere una solución de diseño (ej. botón "Saber más" o tarjetas expandibles).

### D. Integración y CTA Final

- **Interacción:** Cambiar el tono de las llamadas a la acción (CTA) por preguntas más profundas y reflexivas.
- **Clave:** "La claridad y el equilibrio emocional se construyen a partir de una decisión."

## 3. Datos de Contacto y Otros

- **Modalidad:** Visibilizar explícitamente la opción "Online / Presencial".
- **Footer:** Actualizar redes sociales (IG), emails y teléfonos según la nueva información proporcionada.

---

# Propuesta de Solución

1.  **Componente `Encounters`:** Implementar un sistema de "Saber más" que permita expandir la información de cada encuentro sin sobrecargar la vista principal, asegurando legibilidad en móviles.
2.  **Arquitectura de Información:** Unificar el listado de servicios en un objeto de datos centralizado para que se refleje correctamente tanto en la página de `/servicios` como en los menús.
3.  **Estética Visual:** Mantener la línea premium y minimalista, utilizando tipografías con serif para títulos (Playfair Display) y sans-serif para cuerpos (Inter/Montserrat), resaltando las nuevas descripciones con mejor espaciado.
