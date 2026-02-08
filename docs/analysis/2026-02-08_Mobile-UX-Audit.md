# Auditoría de UX Mobile y Propuesta de Refinamiento 📱

Basado en las capturas de pantalla proporcionadas desde un dispositivo móvil, he realizado un análisis detallado de la estética, colores, fuentes y legibilidad.

## 1. Análisis de Estado Actual (Audit)

### 🔴 Problemas Críticos (Legibilidad)

- **Contraste en Tarjetas (Página Filosofía):** En la captura `uploaded_image_4`, las tarjetas de "Presencia" y "Sanación" muestran texto blanco sobre un fondo muy claro/blanco. Esto hace que el contenido sea **completamente ilegible**.
- **Inputs del Formulario:** Los placeholders y etiquetas en el formulario de contacto (`uploaded_image_0`) podrían beneficiarse de un contraste ligeramente mayor para mejorar la accesibilidad visual.

### 🟡 Estética y Diseño

- **Coherencia de Marca:** El uso de la tipografía Serif para encabezados da una sensación muy "premium" y artesanal, lo cual es excelente. Sin embargo, el espaciado entre párrafos de texto largo (Captura 4) se siente un poco apretado para lectura móvil.
- **Paleta de Colores:** La combinación de marrón oscuro, rosa pastel y terracota es armoniosa, pero el rosa del botón "Enviar Mensaje" contra el fondo blanco de la tarjeta podría subir un tono para ganar "fuerza" visual.

### 🔵 Experiencia de Usuario (Touch)

- **Touch Targets:** Los inputs del formulario parecen tener un padding ajustado. En móvil, es ideal que sean más altos para facilitar la selección.
- **Footer:** La alineación de la información de contacto en el footer (`uploaded_image_3`) es funcional, pero el espaciado vertical entre bloques (Secciones vs Contacto) podría ser más generoso.

---

## 2. Propuesta de Refinamiento

### Tipografía y Color

- **Corrección de Contraste:** Cambiar el texto de las tarjetas claras de blanco a `text-text-main` o `text-primary-dark`.
- **Ajuste de Tonos:** Reforzar el color `primary` en botones para que el texto blanco resalte mejor (pasar de un rosa muy pálido a un rosa más saturado/terracota).

### Layout y Espaciado

- **Mobile First Spacing:** Incrementar el `gap` en los grids móviles y añadir un `line-height` más generoso a los párrafos de la sección de Filosofía.
- **Inmersión:** Añadir sombras sutiles (`shadow-sm`) a las tarjetas para darles profundidad sobre los fondos claros.

---

## 3. Plan de Acción (Tareas)

- [ ] **Global:** Revisar variables de color en `tailwind.config.ts` o `globals.css` para asegurar contrastes según WCAG.
- [ ] **Filosofía:** Corregir color de texto en tarjetas de pilares (Presencia/Sanación).
- [ ] **Contacto:** Aumentar padding de inputs y mejorar contraste de etiquetas.
- [ ] **Footer:** Ajustar espaciado y márgenes para evitar saturación visual.
- [ ] **Botones:** Implementar estados de escala (`active:scale-95`) para feedback táctil rápido.

---

_Documento creado el 08 de Febrero de 2026 para el proyecto Ana Murat._
