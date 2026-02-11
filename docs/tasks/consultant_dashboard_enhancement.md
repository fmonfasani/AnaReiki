# Task: Implementación Dashboard Consultante 2.0

## 🛠️ Tareas Técnicas

### Fase 1: Base de Datos (Supabase)

- [ ] Crear tabla `appointments` (id, user_id, start_time, end_time, status, notes).
- [ ] Crear tabla `daily_reflections` (id, user_id, mood, entry, created_at).
- [ ] Configurar RLS para que el usuario solo lea sus propias reflexiones y citas.

### Fase 2: Módulo de Agenda

- [ ] Instalar `react-day-picker` y `date-fns` para el manejo de fechas.
- [ ] Crear componente `BookingCalendar` que consuma la disponibilidad del Admin.
- [ ] Implementar flujo de confirmación de cita con envío de email vía Resend.

### Fase 3: UI de Evolución

- [ ] Crear página `/miembros/evolucion`.
- [ ] Componente `SessionNoteCard` para visualizar feedback de la profesora.
- [ ] Formulario de Intención Diaria en el Dashboard principal.

### Fase 4: Gamificación

- [ ] Lógica para calcular la "Racha" de días de ingreso.
- [ ] Badge de "Usuario Activo" visualmente atractivo.

---

## 📅 Estimación

3-5 días de desarrollo intensivo.
