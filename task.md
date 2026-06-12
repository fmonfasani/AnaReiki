# Tareas: Plataforma Ana Reiki

> Estado: actualizado al 05/06/2026

---

## INFRAESTRUCTURA Y CORE

- [x] Proyecto Supabase + auth + RLS
- [x] Migraciones (001→032 aplicadas)
- [x] Deploy VPS Hetzner: Docker + nginx + Let's Encrypt
- [x] GitHub Actions auto-deploy
- [x] 4 roles: consultante, gerente, admin, owner
- [x] Middleware auth + ruteo por rol
- [x] isAdmin() / isOwner() en TypeScript
- [x] service_client bypass RLS en todas las APIs

---

## SISTEMA DE CITAS V2 (AGENDA)

### Booking (consultante)
- [x] ServiceSelector con precio
- [x] ModalitySelector (online/presencial)
- [x] DatePicker con `get_available_dates_v2`
- [x] TimeSlots con `get_available_slots_v2`
- [x] BookingConfirm con resumen + precio
- [x] BookingConfirmation post-reserva
- [x] Pago MP integrado (redirect a checkout)
- [x] Confirmación post-pago (/confirmacion)
- [x] Cancelar turno propio
- [x] Reprogramar turno

### Admin agenda
- [x] RuleManager UI para availability_rules_v2
- [x] CalendarView visual
- [x] AppointmentManager (confirmar, completar, cancelar, no-show)
- [x] AgendaAnalytics (KPIs)
- [x] AdminWaitlistManager
- [x] PendingAppointments
- [x] SlotManager v1 (legacy)

### Disponibilidad
- [x] availability_rules_v2 (reglas semanales y por fecha)
- [x] get_available_slots_v2() (generación dinámica)
- [x] get_available_dates_v2() (rango para DatePicker)
- [x] count_available_slots_v2()
- [x] Strangler fig: tablas v1 siguen funcionando

---

## MERCADO PAGO

### Pagos one-time (turnos)
- [x] createPaymentPreference() en lib (con notificationUrl)
- [x] POST /api/appointments crea preferencia si price_cents > 0
- [x] POST /api/appointments/confirm-payment (post-redirect)
- [x] POST /api/appointments/retry-payment (reintentar pago)
- [x] POST /api/mercadopago/webhook (IPN con tests)
- [x] Pending payment cleanup (30 min timeout vía cron)
- [x] Columnas: price_cents, payment_status, mp_preference_id, mp_payment_id

### Suscripciones (planes)
- [x] createPreapproval() para suscripciones
- [x] POST /api/mercadopago/create-preference
- [x] POST /api/mercadopago/change-plan (upgrade/downgrade/cancel)
- [x] 3 tiers: prana, shakti, ananda
- [x] Plans: monthly y yearly
- [x] PremiumUpgrade component

### OAuth multi-cliente
- [x] Tabla mp_credentials
- [x] OAuth link, callback, status endpoints
- [x] Conexión exitosa (Ana ya conectó, 5 tokens activos)

### Admin payments
- [x] Payments dashboard con KPIs
- [x] Subscription list
- [x] MP OAuth connection banner

---

## PORTAL CONSULTANTES

### Dashboard (/consultantes)
- [x] Saludo personalizado
- [x] Frase del día / oráculo
- [x] Mood Tracker
- [x] Streak counter
- [x] Próximo turno
- [x] Slots sugeridos
- [x] Links rápidos a módulos
- [x] Contenido reciente
- [x] Navegación por tiers (sidebar con candados)

### Perfil
- [x] Ver/editar nombre y email

### Suscripciones
- [x] Comparativa de planes con feature matrix
- [x] Upgrade a Shakti/Ananda
- [x] Downgrade/cancel
- [x] Precios actualizados: Prana gratis, Shakti $149/mes, Ananda $299/mes

### Mis Citas
- [x] Lista de turnos con estados
- [x] Cancelar
- [x] Reprogramar (RescheduleModal v2)

### Evolución
- [x] Mood Chart (línea de tiempo)
- [x] Mood Tracker diario
- [x] Session Notes timeline
- [x] AI Insights tab

### Comunidad
- [x] Foro con categorías y colores
- [x] Crear topics
- [x] Responder threads
- [x] Eliminar propio (consultante)
- [x] Admin: eliminar cualquier post, responder privado/público
- [x] Colores por categoría en filtros y badges

### Mensajes
- [x] Bandeja de entrada/salida
- [x] Leer/no leído
- [x] Disponible para todos los tiers (Prana, Shakti, Ananda)

### Chat Buda (AI)
- [x] Chat contextual con historial de moods + notas
- [x] Botones de sugerencias
- [x] Solo tier Ananda

### Biblioteca
- [x] Catálogo con filtros por tipo/categoría
- [x] Favoritos
- [x] Progreso de visualización
- [x] PremiumGate para contenido restringido

### Clases
- [x] Grid de videos
- [x] Premium badges
- [x] VideoPlayer
- [x] Solo tier Ananda

### Podcast
- [x] Lista de episodios
- [x] PodcastPlayer
- [x] Solo tier Shakti+

---

## ADMIN PANEL

### Dashboard
- [x] KPIs: usuarios totales, premium, activos, turnos pendientes, avg mood
- [x] Links rápidos

### Consultantes
- [x] Directorio con checkboxes
- [x] Copiar emails al portapapeles
- [x] Exportar CSV
- [x] Tags visibles
- [x] Toggle premium
- [x] Perfil individual

### Contenido (CMS)
- [x] Upload videos/thumbnails
- [x] Gestión de podcasts
- [x] Categorías
- [x] Premium flags
- [x] API /api/content CRUD

### Comunidad (moderación)
- [x] Ver todos los topics
- [x] Mensajes directos
- [x] Comentarios en contenido
- [x] Enviar mensaje como admin

### Email Marketing
- [x] Componer campaña
- [x] Segmentar por: todos/premium/free
- [x] Filtro por tags
- [x] Historial de campañas con stats
- [x] Tabla email_campaigns

### Promos
- [x] CRUD promociones
- [x] 3 tipos: porcentaje, fijo, override
- [x] Filtro por tiers
- [x] Activar/desactivar
- [x] Máximo de compras
- [x] Fecha de expiración
- [x] Tabla promos + promo_purchases

### Servicios
- [x] CRUD servicios
- [x] Price_cents editable solo por owner

---

## CONTENIDO PÚBLICO

### Landing
- [x] Hero section
- [x] Therapies showcase
- [x] Encounters
- [x] Timeline
- [x] CTA reservar / WhatsApp

### Páginas públicas
- [x] /servicios
- [x] /filosofia
- [x] /contacto (formulario + datos)

---

## PENDIENTE DE ANÁLISIS (`docs/analysis/`)

### De `consultant_dashboard_enhancement.md`
- [ ] **Dashboard personalizado**: implementar mood tracker como "Centro de Bienestar"
- [ ] **Historia de sesiones**: mostrar registro de sesiones pasadas con notas de evolución
- [ ] **Oráculo / frase del día**: ya hay una frase, verificar si cumple
- [ ] **Racha de meditación**: gamificar días seguidos de uso
- [ ] **Reserva desde dashboard**: ya implementado vía wizard
- [ ] Requiere tabla `session_history` y `user_intentions`

### De `admin_control_panel.md`
- [x] Gestión de personas ✅
- [x] Gestión de tiempo (disponibilidad) ✅
- [x] Gestión de contenido (CMS) ✅
- [x] Bloquear días (availability_rules) ✅
- [x] Validar/cancelar citas ✅

### De `2026-02-08_New-Service-And-Content-Update.md`
- [ ] **Meditaciones Guiadas**: agregar como servicio en Therapies, /servicios, formulario
- [ ] **Hero text empático**: actualizar texto actual con versión más empática
- [ ] **Formulario de contacto**: agregar dropdown "Servicio de interés" con opciones dinámicas

### De `2026-02-08_Mobile-UX-Audit.md`
- [ ] **Contraste**: corregir texto blanco sobre fondo claro en tarjetas
- [ ] **Touch targets**: aumentar padding en inputs móviles
- [ ] **Espaciado**: mejorar line-height en párrafos, gap en grids
- [ ] **Footer**: ajustar espaciado entre bloques
- [ ] **Botones**: agregar active:scale-95 para feedback táctil

### De `2026-01-27_Mobile-UI-Improvements-Analysis.md`
- [ ] **Hero responsive**: ajustar font-size para pantallas <400px
- [ ] **Mobile menu drawer**: implementar menú hamburguesa funcional
- [ ] **Cards**: revisar aspect-square en cards de Terapias

---

## PRÓXIMOS PASOS INMEDIATOS

1. [ ] Ejecutar migration 031 en Supabase Dashboard
2. [ ] Verificar dominio Resend en Namecheap (DNS)
3. [ ] Testear checkout MP con cuenta diferente (producción)
4. [ ] Separar DM de Comunidad (tablas + API + migración)
5. [ ] Sistema de Foros (categorías, temas, posts, likes, bookmarks)
6. [ ] Sistema de Comentarios polimórfico
7. [ ] Sidebar Admin y Consultante reorganizados
8. [ ] Agenda reingeniería Fase 5: Admin RuleManager UI
9. [ ] Agregar Meditaciones Guiadas como servicio
10. [ ] Mobile menu drawer funcional
