# Propuesta de Refinamiento: Navbar & Footer Mobile

## 1. 🎯 Objetivo

Mejorar la estructura del menú hamburguesa y asegurar la legibilidad del footer en dispositivos móviles.

## 2. 💡 Solución Técnica

- **Navbar (Menú Sandwich)**:
  - Limpiar el overlay: eliminar duplicados del logo y centrar los links de navegación.
  - Ajustar el botón hamburguesa para que tenga un diseño más refinado (líneas sutiles en lugar de ícono genérico).
  - Asegurar que el overlay ocupe el 100% de la pantalla de forma limpia con fondo opaco.
- **Footer**:
  - Cambiar las clases de color de `text-text-light` o colores blancos a un tono "terrancota" (`text-text-main` o similar).
  - Asegurar que el copyright y los links legales sean legibles.
- **Cambios en Código**:
  - `Navbar.tsx`: Simplificar la estructura del `motion.div`.
  - `Footer.tsx`: Reemplazar clases de color de texto.

## 3. 🛡️ Plan de Riesgos/Validación

- **Validación**: Verificar contraste en móviles y alineación de iconos.
