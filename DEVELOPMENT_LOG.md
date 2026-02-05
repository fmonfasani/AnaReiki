# 🌸 Ana Reiki - Registro de Desarrollo y Arquitectura

Este documento detalla la evolución, decisiones técnicas y cambios realizados en la aplicación de Bienestar Holístico de Ana.

## 📅 Hito 1: Inicialización y Foundation (2026-01-25)

- **Creación**: Inicialización con `create-next-app` utilizando **Next.js 15 (App Router)**, Tailwind CSS y TypeScript.
- **Identidad Visual**:
  - Tipografías: `Newsreader` (Serif) para elegancia y `Noto Sans` (Sans) para legibilidad moderna.
- **Componentes Base**: Implementación de `Navbar.tsx` y `Footer.tsx` con diseño responsivo.

## 📅 Hito 2: Refinamiento Estético y Contenido (2026-01-26)

- **Cambio de Identidad (Prompt V2)**:
  - Se actualizó la paleta a **Rosa Pastel (#F4D4DD)** para una sensación más etérea y tranquila.
  - Se definieron colores de acento: `Text Main (#4A3B3E)` y `Background Alt (#F9F3F1)`.
- **Integración de Imágenes**:
  - Generación de activos visuales mediante IA para las secciones de Hero, Registros Akáshicos, Yoga, Yoga en Familia, Yoga Niños, Rito de Útero, Celebraciones Holísticas, Péndulo y Tapping.
  - Configuración de `next/image` para optimización de carga.
- **Contenido Específico Integrado**:
  - **Terapias (5)**: Registros Akáshicos, Biodecodificación, Reiki, Armonización de Chakras con Péndulo y Tapping (EFT).
  - **Encuentros**: Yoga en Familia, Yoga Niños, Rito de Útero y Celebraciones.
- **Implementación de Secciones Dinámicas**:
  - `Therapies.tsx`: Grid interactivo con cards expandibles (ahora con 5 servicios).
  - `Encounters.tsx`: Galería tipo mosaico con hover effects.
  - `Timeline.tsx`: El camino del bienestar (Consulta → Inmersión → Integración).

## 📅 Hito 3: Preparación para Despliegue (Actual)

- **Refinamiento UI**: Aplicación del sistema de colores pastel (#F4D4DD) y bordes ultra-redondeados.
- **Optimización**: Eliminación de placeholders y reemplazo por contenido real según el prompt.
- **Plan de Deploy**: Documentación de pasos para Vercel.

## 📅 Hito 4: Actualización Integral de Contenido y UX (2026-02-04)

- **Evolución de Marca**:
  - Cambio de marca a **ANA MUR REIKI** en toda la plataforma.
  - Implementación de CTA reflexivos ("¿Sentís el llamado a escucharte?") y botones de acción "Agendar Sesión".
- **Expansión de Servicios**:
  - Se completó la oferta de servicios a **9 ítems oficiales**, unificando la Home y la página de `/servicios`.
  - Inclusión de distintivo "Modalidad Online / Presencial".
- **Refactorización de Secciones**:
  - `Timeline.tsx` evolucionó a **Acompañamiento Terapéutico Integral**, detallando las fases de Escucha, Sesión Presencial e Integración.
  - `Encounters.tsx` rediseñado para asegurar legibilidad 100% de descripciones mediante un sistema de expansión ("Saber más").
- **Filosofía**: Actualización de la misión y propósito hacia una mirada más humana, consciente e integral del cuerpo.
- **Footer**: Actualización completa de datos de contacto reales y redes sociales (@anamur.reiki).

## 🏗️ Arquitectura Técnica

- **SSR (Server-Side Rendering)**: Todas las páginas principales se sirven desde el servidor para maximizar el SEO.
- **Client Components**: Uso selectivo de `"use client"` para componentes interactivos como las cards de terapias.
- **Layout System**: Estructura compartida en `layout.tsx` para consistencia visual.
