# Análisis de Refinamientos UI Mobile (Navbar & Footer)

## 1. 📊 Descripción del Problema

- **Contexto**: Tras la implementación inicial del menú móvil, se han detectado problemas de visualización y jerarquía en dispositivos móviles.
- **Síntomas**:
  - **Navbar/Menú**: El menú "sandwich" se superpone de forma desordenada, mostrando logos duplicados y textos amontonados. La estructura no es clara.
  - **Footer**: En modo teléfono, el texto aparece en blanco o muy claro sobre fondo claro, dificultando la legibilidad.
- **Impacto**: UX deficiente en la navegación móvil y falta de accesibilidad por bajo contraste en el footer.

## 2. 🕵️ Diagnóstico

- **Causa Raíz**:
  1. **Navbar**: El componente `AnimatePresence` del overlay está renderizando elementos que compiten con el contenido del Hero y el Header original. La estructura de flex-col del menú no tiene suficientes márgenes.
  2. **Footer**: El uso de `text-text-light` o colores con baja opacidad en el footer móvil no escala bien con el fondo `bg-background-light`.
- **Evidencia**: Capturas de pantalla enviadas por el usuario mostrando superposición de textos y falta de contraste.

## 3. 🔗 Referencias

- Figma designs de referencia para menús limpios.
- WCAG Contrast Checker para el color "terrancota" (Text Main).
