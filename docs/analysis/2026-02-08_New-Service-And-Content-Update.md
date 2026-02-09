# Análisis de Actualización: Nuevo Servicio y Refinamiento de Contenido

**Fecha:** 08 de Febrero, 2026
**Objetivo:** Integrar el servicio de "Meditaciones Guiadas" y actualizar los mensajes clave en el Home para mejorar la conexión emocional con el usuario.

## 1. Análisis de Requerimientos

### 1.1 Nueva Propuesta de Valor (Hero Section)

El texto actual en el Home es descriptivo, pero el usuario solicita uno más empático y orientado a la solución:

- **Texto Anterior:** "Mi propósito es acompañar procesos terapéuticos desde una mirada integral, respetando los tiempos de cada persona y reconociendo al cuerpo como una guía sabia."
- **Nuevo Texto:** "En medio del ritmo cotidiano, muchas veces nos alejamos de lo que sentimos y necesitamos. Este espacio fue creado para acompañarte a volver a tu centro, escuchar tu cuerpo y emociones y recuperar el equilibrio que te pertenece."

Este cambio busca que el visitante se sienta identificado con la sensación de caos cotidiano y vea en el sitio un refugio.

### 1.2 Integración del Servicio "Meditaciones Guiadas"

Este servicio es altamente solicitado y debe integrarse en todos los puntos de contacto:

- **Imagen:** Generada por IA para transmitir serenidad, luz natural y equilibrio.
- **Ubicación:**
  - Componente `Therapies.tsx` (Homepage).
  - Página `/servicios` (Detalle).
  - Formulario de Contacto (Dropdown).

### 1.3 Mejora del Formulario de Contacto

Se requiere que el usuario pueda especificar su interés desde el inicio mediante una lista desplegable. Esto facilita la cualificación del lead y ahorra tiempo en la comunicación inicial.

## 2. Propuesta Técnica

### 2.1 Estructura de Datos de Servicios

Actualizar los arrays de servicios en `Therapies.tsx` y `servicios/page.tsx` para incluir el objeto:

```typescript
{
  title: "Meditaciones Guiadas",
  subtitle: "Silencio y presencia",
  image: "/images/meditaciones_guiadas.png", // imagen generada
  description: "Un espacio para pausar la mente y conectar con el presente a través de la respiración y la visualización guiada. Ideal para reducir el estrés y recuperar la claridad mental."
}
```

### 2.2 Formulario de Contacto

Modificar el componente `ContactForm.tsx` para que el campo `Servicio de interés` sea dinámico o incluya todas las opciones actualizadas, incluyendo "Meditaciones Guiadas".

## 3. Impacto Visual

- La nueva imagen de meditaciones mantendrá la estética de luz suave, tonos rosados y blancos que ya se implementó en la refactorización anterior.
- El texto del Hero será más extenso, por lo que se revisará el espaciado para asegurar que en móvil siga siendo legible sin empujar los botones demasiado abajo.
