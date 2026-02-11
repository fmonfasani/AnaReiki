# Análisis: Panel de Control Administrativo (Profesora Ana Reiki)

## 🎯 Objetivo

Proveer a la profesora de una herramienta centralizada para gestionar su negocio, sus alumnos (consultantes) y su contenido digital sin necesidad de tocar código ni entrar directamente a bases de datos técnicas.

## 🔍 Requerimientos del Administrador

- **Gestión de Personas**: Ver quiénes están registrados, su historial de suscripción y sus notas.
- **Gestión de Tiempo**: Definir qué días y horas atiende, y ver sus próximas citas.
- **Gestión de Contenido**: Un "CMS" simple para subir videos y podcasts.

## 🧩 Flujos Críticos

1. **Aprovisionamiento de Contenido**:
   - Seleccionar un video local -> Subir a Cloudinary automáticamente.
   - Pegar URL de Spotify -> Guardar en base de datos.
2. **Control de Agenda**:
   - Bloquear días (vacaciones/feriados).
   - Validar/Cancelar citas de alumnos.

## 🛠️ Stack Tecnológico Interno

- **Auth**: Roles de Supabase (campo `role` en `profiles`).
- **Media**: SDK de Cloudinary para uploads directos.
- **Notificaciones**: Resend para avisar a alumnos de nuevos videos.

---

## 📊 Conclusión del Análisis

Actualmente, la administración se hace "a mano" o vía WhatsApp. Un panel administrativo profesional permitirá escalar la membresía de 10 a 100+ alumnos con el mismo esfuerzo operativo.
