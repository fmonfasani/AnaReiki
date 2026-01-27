# Propuesta de Solución: Mejoras de UI Mobile

## 1. 🎯 Objetivo

Optimizar la experiencia de usuario en dispositivos móviles mediante la implementación de un menú de navegación funcional, ajustes de tipografía y rediseño de jerarquías visuales en secciones clave.

## 2. 💡 Solución Técnica

- **Arquitectura**:
  - Implementar un sistema de menú lateral (Mobile Menu) usando Framer Motion para animaciones fluidas.
  - Utilizar variables de espaciado dinámicas en el Hero.
- **Cambios en Código**:
  - `Navbar.tsx`:
    - Añadir estado `isOpen` (React `useState`).
    - Implementar un componente `MobileMenu` con superposición (overlay) difuminada.
  - `page.tsx`:
    - Ajustar el Hero para que la imagen y el texto se apilen de forma más armónica en móviles extremos (<375px).
    - Reducir el tamaño de fuente inicial del H1 a `text-4xl` en móviles e incrementar gradualmente.
  - `Therapies.tsx` & `Encounters.tsx`:
    - Ajustar los bordes redondeados y el espaciado interno para ahorrar espacio vertical sin sacrificar la estética premium.
- **Alternativas Descartadas**:
  - No se usará un menú de navegación nativo del navegador para mantener la estética "glassmorphism" y las animaciones premium.

## 3. 🛡️ Plan de Riesgos/Validación

- **Riesgos**: Posible impacto en la performance si se sobrecargan las animaciones. Se mitigará usando componentes livianos.
- **Validación**:
  - Probar en Chrome DevTools con perfiles de iPhone SE y Pixel 7.
  - Asegurar que el scroll se bloquee cuando el menú móvil esté abierto.
