# Task: Implementación Panel de Control Admin

## 🛠️ Tareas Técnicas

### Fase 1: Seguridad y Roles

- [ ] Agregar columna `role` (text) a la tabla `profiles`.
- [ ] Crear política RLS para que solo el 'admin' pueda ver la lista completa de perfiles.
- [ ] Actualizar Middleware para rebotar a usuarios no-admin de la ruta `/admin`.

### Fase 2: Directorio de Consultantes

- [ ] Crear página `/admin/consultantes`.
- [ ] Implementar tabla con acciones (Ver detalles, Toggle Premium).
- [ ] Crear modal de "Detalle del Consultante".

### Fase 3: Gestión de Agenda

- [ ] Crear tabla `availability` (professora_id, day_of_week, start_time, end_time).
- [ ] Interfaz de administrador para definir horarios semanales.
- [ ] Lista de citas pendientes con botón de "Confirmar/Cancelar".

### Fase 4: CMS de Contenido

- [ ] Crear página `/admin/contenido`.
- [ ] Implementar `Cloudinary Upload Widget` para videos.
- [ ] Formulario para agregar podcasts con validación de URL de Spotify.

### Fase 5: Notificaciones Automáticas

- [ ] Integrar Resend para enviar mail masivo: "¡Hola! Ana ha subido una nueva clase: [Título]".

---

## 📅 Estimación

5-7 días de desarrollo.
