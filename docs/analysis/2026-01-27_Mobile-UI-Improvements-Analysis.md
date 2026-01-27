# Análisis de Mejoras de UI Mobile

## 1. 📊 Descripción del Problema

- **Contexto**: La aplicación actual de Ana Reiki ha sido construida con un enfoque desktop-first en algunas secciones, y aunque utiliza Tailwind para responsividad básica, hay elementos que no están optimizados para la experiencia móvil.
- **Síntomas**:
  - El Hero section tiene un espaciado que puede verse comprimido en móviles.
  - El menú de navegación (Navbar) no tiene un Drawer/Mobile Menu funcional (solo el ícono).
  - Las cards de Terapias y Encuentros pueden ocupar demasiado espacio vertical sin una jerarquía visual clara en pantallas pequeñas.
  - El padding global en móviles se siente genérico.
- **Impacto**: Visual y UX. La navegación es difícil en móviles y el primer impacto visual (Hero) pierde fuerza.

## 2. 🕵️ Diagnóstico

- **Causa Raíz**:
  1. Falta de un componente de Menu Mobile funcional.
  2. Los tamaños de fuente (text-6xl/7xl) en el Hero no se ajustan agresivamente para pantallas de <400px.
  3. Uso de `aspect-square` en las cards de Terapias que puede hacer que el contenido se desborde o se vea muy pequeño dependiendo del viewport.
- **Evidencia**:
  - `Navbar.tsx`: El botón de menú (`md:hidden`) está presente pero no tiene lógica de estado para abrir un menú.
  - `page.tsx`: El Hero usa `text-5xl sm:text-6xl lg:text-7xl` pero carece de un ajuste fino para alturas de dispositivos cortos.

## 3. 🔗 Referencias

- Tailwind CSS Responsive Design: https://tailwindcss.com/docs/responsive-design
- Framer Motion Mobile Navigation: https://www.framer.com/motion/
