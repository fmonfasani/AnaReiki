# Propuesta: "Reiki Studio Manager" (Panel Admin)

## 🎨 Concepto

Un panel de control "Detrás de escena" robusto pero fácil de usar, con acceso restringido solo para la profesora.

## 🚀 Funcionalidades Principales

### 1. Directorio de Consultantes

- Tabla con búsqueda y filtros.
- Ficha individual por consultante:
  - Información de contacto.
  - Botón para "Dar de Alta/Baja" Premium.
  - Historial de sesiones privadas.

### 2. Gestor de Disponibilidad (Agenda Master)

- Calendario maestro:
  - Click para habilitar/deshabilitar slots horarios (ej: Lunes 14:00 - 18:00).
  - Vista de lista de las citas del día.

### 3. Centro de Carga de Contenido (Media Center)

- **Subida de Videos**: Formulario con `Dropzone`. El video va a Cloudinary y la URL se guarda automáticamente en Supabase.
- **Gestor de Podcast**: Campo para pegar el link de Spotify. Previsualización automática del reproductor.

### 4. Estadísticas Rápidas

- Widgets superiores: "Total Consultantes", "Citas hoy", "Suscripciones activas".

## 🔒 Seguridad

- Ruta protegida `/admin/*`.
- Middleware de Supabase verificando que el usuario tenga el rol de 'admin'.

---

## ✅ Beneficios

- Autonomía total para la profesora.
- Profesionalización extrema de la gestión.
- Reducción de errores humanos en la coordinación de citas.
