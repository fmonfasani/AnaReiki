# Análisis Integral de Arquitectura — Ana Reiki

**Fecha**: 2026-06-05
**Máquina**: enacom37009 (PC Local)
**Autor**: AI Agent (OpenCode)
**Propósito**: Revisión completa de arquitectura funcional, UX, negocio, permisos, procesos y escalabilidad.

---

## 1. DIAGNÓSTICO DE LA SITUACIÓN ACTUAL

El proyecto tiene una base técnica sólida (Next.js 15 + Supabase + 28 migraciones, 165 tests) pero arrastra **problemas de arquitectura funcional**:

- **Comunidad es un cajón de sastre**: mezcla foros, mensajes, comentarios en tablas no normalizadas
- **Módulo comercial inexistente**: hay `promotions` y `payments` como tablas aisladas, pero no hay un módulo "Comercial" que las articule
- **Reservas sin pago obligatorio**: el appointment se crea en estado `pending` sin exigir pago → alta tasa de no-show potencial
- **No hay wallet/créditos**: las cancelaciones se resuelven con refund o nada, no hay crédito interno
- **Mensajes acoplados a comunidad**: no hay DM independiente
- **No hay grupos, amistades, reportes, ni moderación formal**
- **Sidebar admin plano**: todas las rutas cuelgan del mismo nivel, sin agrupación lógica
- **UX sin diferenciación clara**: al consultante se le mezcla contenido (biblioteca, clases, podcast) con social (comunidad, mensajes) con transaccional (agenda)

---

## 2. PROBLEMAS DETECTADOS

| # | Problema | Impacto | Prioridad |
|---|----------|---------|-----------|
| 1 | Comunidad mezcla foros + mensajes + comentarios | Alto - deuda técnica, mala UX, difícil moderación | Alta |
| 2 | No hay módulo comercial integral | Medio - promos y pagos aislados sin articulación | Media |
| 3 | Reserva sin pago obligatorio | Alto - no-shows, pérdida de ingresos | **Crítica** |
| 4 | No hay wallet/créditos internos | Medio - cancelaciones sin retención del usuario | Media |
| 5 | Mensajes acoplados a comunidad | Alto - sin DM independiente, mala escalabilidad | Alta |
| 6 | No hay grupos, amistades, reportes, moderación formal | Medio - comunidad sin herramientas de gestión | Media |
| 7 | Sidebar admin plano | Bajo - desorganización visual, bajo esfuerzo de arreglo | Baja |
| 8 | UX sin diferenciación clara | Medio - el consultante pierde foco entre contenido, social y transaccional | Media |

---

## 3. ARQUITECTURA FUNCIONAL PROPUESTA

```
┌─────────────────────────────────────────────────────────┐
│                    ANA REIKI PLATFORM                    │
├────────────┬────────────┬──────────────┬────────────────┤
│  PÚBLICO   │ CONSULTANTE │   ADMIN      │    SISTEMA     │
│  (Landing) │  (App)      │   (Panel)    │   (Backend)    │
├────────────┼────────────┼──────────────┼────────────────┤
│ - Home     │ - Inicio   │ - Dashboard  │ - Auth (4 roles)│
│ - Servicios│ - Biblioteca│ - Consult.  │ - Pagos MP     │
│ - Blog     │ - Clases   │ - Agenda    │ - Subscripciones│
│ - Contacto │ - Podcast  │ - Contenido │ - Emails (Resend)│
│            │ - Comunidad │ - Comunidad │ - Cron reminders│
│            │ - Grupos   │ - Mensajes  │ - Webhooks      │
│            │ - DM       │ - Comercial │ - API REST      │
│            │ - Perfil   │ - Pagos     │                 │
│            │ - Agenda   │ - Email Mkt │                 │
│            │ - Wallet   │ - Promos    │                 │
└────────────┴────────────┴──────────────┴────────────────┘
```

---

## 4. DISEÑO DE MENÚS

### Sidebar Administrador (propuesto)

```
📊 Dashboard
👥 Consultantes
📅 Agenda
📝 Contenido
───────────
🌐 Comunidad
  ├── Foros
  ├── Grupos
  ├── Moderación
  └── Reportes
💬 Mensajes
  ├── Conversaciones
  ├── Bandeja
  └── Archivados
───────────
💰 Comercial
  ├── Servicios
  ├── Precios
  ├── Promociones
  └── Cupones
💳 Pagos
  ├── Transacciones
  ├── Reembolsos
  ├── Pasarela
  └── Facturación
📧 Email Marketing
🎁 Promos
```

### Sidebar Consultante (propuesto)

```
🏠 Inicio
📚 Biblioteca
🧘 Clases
🎙️ Podcast
───────────
🌐 Comunidad
  ├── Foros
  ├── Grupos
  └── Amigos
💬 Mensajes
───────────
📅 Agenda
  ├── Reservar turno
  ├── Mis turnos
  └── Historial
👛 Wallet
  ├── Saldo
  ├── Movimientos
  └── Créditos
⚙️ Perfil
```

---

## 5. MODELO DE PERMISOS (4 + 1 roles)

| Rol | Alcance |
|-----|---------|
| **Owner** | Control absoluto. Crea grupos oficiales, asigna moderadores, gestiona reembolsos, ve todo |
| **Admin** | Gestión operativa. Admin de contenido, usuarios, comunidad. No puede borrar grupos ni cambiar roles |
| **Moderador** | Nuevo. Asignado por Owner a grupos específicos. Aprueba/rechaza ingresos, elimina posts/comentarios, cierra debates, reporta usuarios |
| **Gerente** | Visión comercial. Ve reportes, gestiona promos, precios. Sin acceso a datos sensibles de usuarios |
| **Consultante** | Usuario base. Participa en foros, grupos, agenda, wallet, mensajes |

### Reglas clave
- Moderador no puede moderar fuera de sus grupos asignados
- Owner es el único que puede remover moderadores
- Admin puede crear contenido pero no aprobar moderadores
- Gerente puede crear promos pero no ver conversaciones privadas

---

## 6. MODELO DE COMUNIDAD (Foros)

### Entidades de base de datos necesarias

```sql
forums_categories
  id, name, slug, description, display_order, color, icon, is_active, created_at

forum_topics
  id, category_id, author_id, title, content, is_pinned, is_closed,
  is_visible, tags[], view_count, created_at, updated_at

forum_posts
  id, topic_id, author_id, content, is_hidden, hidden_by, hidden_at, created_at

forum_likes
  id, post_id, user_id, created_at

forum_bookmarks
  id, topic_id, user_id, created_at
```

### UX de Foros
- Vista de categorías con cards de última actividad
- Cada categoría muestra: nombre, descripción, contador de temas, última publicación
- Vista de temas: título, autor, pinned indicator, contador de posts y likes, última actividad
- Vista de post: hilo vertical estilo Reddit/Discourse, con anidación de respuestas
- Editor rich text con soporte básico (bold, itálico, links, imágenes)
- Barra de búsqueda global dentro de foros

---

## 7. MODELO DE GRUPOS

### Entidades

```sql
groups
  id, name, description, topic, rules, image_url,
  group_type (public|private|premium), status (active|archived),
  created_by, created_at, updated_at

group_members
  id, group_id, user_id, role (member|moderator|owner),
  status (pending|approved|rejected|banned),
  approved_by, joined_at

group_posts
  id, group_id, author_id, content, is_pinned, created_at

group_comments
  id, group_post_id, author_id, content, created_at

group_join_requests
  id, group_id, user_id, message, status (pending|approved|rejected),
  reviewed_by, created_at
```

### UX de Grupos
- Grid de grupos con imagen, nombre, tipo (badge público/privado/premium), miembros, última actividad
- Página de grupo: muro tipo Facebook Group, con posts, comentarios, miembros visibles
- Modal de solicitud: para grupos privados, campo de mensaje opcional
- Configuración: solo Owner/Moderadores del grupo ven pestaña de settings
- Grupos Premium: bloqueados por `plan_tier`, con badge de candado y CTA a upgrade

---

## 8. MODELO DE MENSAJES (DM)

### Entidades

```sql
conversations
  id, created_at, updated_at, last_message_at

conversation_participants
  id, conversation_id, user_id, last_read_at, is_archived, is_muted

messages
  id, conversation_id, sender_id, content,
  message_type (text|image|audio|file),
  file_url, file_name, file_size,
  is_deleted, created_at
```

### UX de Mensajes
- Layout tipo WhatsApp Web: sidebar de conversaciones + panel de chat
- Conversaciones: avatar, nombre, último mensaje, timestamp, badge de no leídos
- Input con adjuntos: imágenes, audio, documentos
- Búsqueda dentro de conversaciones
- Admin puede ver bandeja general con filtros por usuario, fecha, contenido

---

## 9. SISTEMA DE AMISTADES

### Entidades

```sql
friendships
  id, requester_id, addressee_id,
  status (pending|accepted|rejected|blocked),
  blocked_by, created_at, updated_at
```

### UX
- Botón "Agregar amigo" en perfiles
- Notificación de solicitud (pendiente)
- Lista de amigos en perfil
- Sugerencias de amigos basadas en grupos en común

---

## 10. SISTEMA DE COMENTARIOS (desacoplados)

### Entidades

```sql
comments
  id, author_id, content,
  commentable_type (library_item|podcast|video|class|forum_post),
  commentable_id, parent_id (nullable, para respuestas),
  is_hidden, hidden_by, hidden_at,
  created_at, updated_at
```

- Polimórfico vía `commentable_type` + `commentable_id` (single table inheritance)
- Moderable desde un panel unificado de moderación
- Reportable

---

## 11. SISTEMA DE REPORTES

### Entidades

```sql
reports
  id, reporter_id, reported_user_id,
  reportable_type (post|comment|user|message|forum_topic|group_post),
  reportable_id, reason (spam|harassment|offensive|ads|other),
  description, status (pending|reviewed|dismissed|action_taken),
  reviewed_by, reviewed_at, created_at
```

### UX
- Botón "Reportar" (ícono ⚑) en cada elemento social
- Modal con selección de motivo + campo opcional de descripción
- Badge en sidebar Admin con contador de reportes pendientes

---

## 12. MÓDULO COMERCIAL

### Entidades

```sql
services (ya existe, extender)
  → Agregar: category, capacity, currency (ARS/USD),
    is_package, max_advance_days, min_cancel_hours

pricing_tiers (nueva tabla, por servicio)
  id, service_id, name, price_cents, currency,
  modality (presencial|virtual|hibrida),
  duration_minutes, is_active

promotions (ya existe)
  → ya tiene discount_percent, discount_fixed, price_override,
    allowed_tiers, max_purchases

coupons (nueva)
  id, code, discount_type (percent|fixed), discount_value,
  max_uses, current_uses, expires_at, allowed_services[],
  allowed_tiers[], is_active, created_by

gift_cards (nueva)
  id, code, amount_cents, sender_id, recipient_email,
  recipient_id, status (active|redeemed|expired),
  expires_at, created_at, redeemed_at
```

---

## 13. MODELO DE RESERVAS + PAGOS

### Flujo completo propuesto

```
1. Usuario selecciona servicio
2. Selecciona fecha → APIs de disponibilidad v2
3. Selecciona horario
4. Selecciona modalidad (presencial/virtual/híbrida)
5. Ve resumen: servicio + fecha + hora + precio
6. Elige método de pago:
   ┌────────────────────────────────┐
   │  a) Pagar ahora (MP/Stripe)    │
   │  b) Usar créditos (Wallet)     │
   │  c) Combinar crédito + pago    │
   │  d) Gift card                  │
   │  e) Cupón de descuento         │
   └────────────────────────────────┘
7. Aplica descuentos automáticos (promos vigentes, membresía)
8. Confirma pago
9. Appointment se crea en estado 'confirmed' (NO 'pending')
10. Email de confirmación + recordatorio automático (cron)
```

### Estados de appointment extendidos

```sql
'pending_payment' → usuario inició pero no pagó (se libera en 15 min)
'confirmed'       → pagado, reserva firme
'completed'       → sesión realizada
'cancelled'       → cancelado por usuario o admin
'no_show'         → usuario no asistió
'refunded'        → reembolsado por admin
'rescheduled'     → reprogramado
```

---

## 14. MODELO DE CRÉDITOS INTERNOS (WALLET)

### Entidades

```sql
wallets
  id, user_id, balance_cents, created_at, updated_at

wallet_transactions
  id, wallet_id, type (credit|debit|expiration),
  amount_cents, balance_after_cents,
  reference_type (appointment|promo|refund|gift_card|admin),
  reference_id, description, created_at, expires_at

credit_policies
  id, name, validity_days, applies_to (cancel|no_show|refund),
  percentage_of_paid, is_active
```

### Lógica de cancelación

| Escenario | Política propuesta |
|-----------|-------------------|
| Cancela > 24h antes | 100% en crédito interno (sin expiración, o 1 año) |
| Cancela 2-24h antes | 50% en crédito interno |
| Cancela < 2h antes | 0% (no-show) |
| Admin cancela | Reembolso total o crédito (a criterio) |
| Reprogramación | Sin costo si es con > 24h de anticipación |

---

## 15. PASARELA DE PAGOS

| Pasarela | Ventajas | Desventajas |
|----------|----------|-------------|
| **Mercado Pago** | Ya implementado. Líder en Argentina. Cuotas sin interés. | OAuth roto actualmente. Solo LATAM. |
| **Stripe** | Global. Mejor DX. Documentación excelente. | No tiene cuotas sin interés en ARG. Requiere nueva integración. |
| **PayPal** | Global. Confianza del usuario. | Comisiones altas. No apto para suscripciones recurrentes en ARG. |

**Recomendación**: Mantener MP como primario (ya está integrado, solo falta debuggear OAuth). Stripe como secundario en Fase 3 para clientes internacionales.

---

## 16. ROADMAP

### Fase 1 — Fundación Social (Prioridad: Alta)

| Item | Esfuerzo | Impacto |
|------|----------|---------|
| Debuggear OAuth MP | 1 día | **Bloqueante** |
| Separar DM de Comunidad (tablas + API) | 3 días | Alto |
| Sistema de Foros (categorías, temas, posts, likes) | 5 días | Alto |
| Sistema de Comentarios polimórfico | 2 días | Alto |
| Sidebar Admin reorganizado | 1 día | Medio |
| Sidebar Consultante reorganizado | 1 día | Medio |
| Migración de datos existentes de comunidad | 2 días | Alto |
| **Total estimado** | **14 días** | |

### Fase 2 — Grupos, Pagos y Wallet (Prioridad: Media-Alta)

| Item | Esfuerzo | Impacto |
|------|----------|---------|
| Módulo Grupos (CRUD + membresías + roles) | 5 días | Alto |
| Sistema de Amistades | 2 días | Medio |
| Sistema de Reportes + Moderación | 3 días | Alto |
| Wallet + Créditos internos | 4 días | Alto |
| Flujo de reserva con pago obligatorio | 5 días | Muy alto |
| Política de cancelación con créditos | 2 días | Alto |
| **Total estimado** | **21 días** | |

### Fase 3 — Monetización y Crecimiento (Prioridad: Media)

| Item | Esfuerzo | Impacto |
|------|----------|---------|
| Módulo Comercial completo (servicios + precios) | 3 días | Alto |
| Cupones de descuento | 2 días | Medio |
| Gift Cards | 3 días | Medio |
| Integración Stripe como alternativa a MP | 5 días | Alto |
| Facturación automática | 3 días | Medio |
| Upgrade / downgrade de membresías self-service | 4 días | Alto |
| Dashboard de métricas comunidad (DAU, MAU, retention) | 3 días | Medio |
| Sugerencias de amigos y grupos | 2 días | Bajo |
| **Total estimado** | **25 días** | |

---

## 17. RIESGOS Y RECOMENDACIONES

### Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Migración de datos de comunidad existente | Alta | Alto | Hacerla en Fase 1, con rollback plan |
| Complejidad de permisos (Owner/Admin/Mod/Gerente) | Media | Alto | Tests de integración de RLS (ya hay 165 tests, expandir) |
| OAuth MP roto en producción | Alta | Bloqueante | Debuggear prioridad #1 |
| Wallet sin expiración → pasivo contable | Media | Medio | Política de expiración a 12 meses |
| Usuarios que no pagan pero ocupan slots | Alta | Medio | Timeout de 15 min en `pending_payment` + release automático |

### Recomendaciones clave

1. **No mezclar fases**: Fase 1 es puramente social + reorganización. No tocar pagos aún.
2. **Single Table Inheritance para comentarios**: Evita tablas separadas por cada tipo de contenido.
3. **CQRS para foros**: Lecturas (vista de hilos) separadas de escrituras (postear).
4. **Cachear disponibilidad**: Las queries de `get_available_slots_v2` son pesadas. Usar Redis o cache en memoria.
5. **Notificaciones**: Implementar temprano (Fase 1.5). Sin notificaciones, la comunidad muere.
6. **CRON semilla**: Un cron que ejecute `expire_old_approvals()` y libere slots de `pending_payment` vencidos.
7. **Stripe como secundario**: MP ya tiene integración. Stripe para clientes internacionales en Fase 3.
8. **Eliminar `gerente` o renombrarlo**: El rol `gerente` está en las tablas pero no se usa en UI. Si no hay pantalla, no existe. Definir si se implementa o se depreca.

---

## 18. CONCLUSIÓN EJECUTIVA

### Priorización de implementación

```
1. 🔴 Debuggear OAuth MP             → BLOQUEANTE. Sin esto no hay pagos.
2. 🔴 Separar DM + Foros + Comentarios → Base social del rediseño.
3. 🟡 Sistema de Foros + Categorías   → Comunidad real.
4. 🟡 Sidebar Admin reordenado        → Bajo esfuerzo, alto impacto.
5. 🟡 Sistema de Reportes             → Moderación. Sin esto, tóxicos matan la comunidad.
6. 🟡 Grupos                          → Feature de mayor engagement potencial.
7. 🟢 Flujo reserva con pago obligatorio → Reducción de no-show.
8. 🟢 Wallet + Créditos               → Retención post-cancelación.
9. 🟢 Amistades + Notificaciones      → Sticky social.
10. 🟢 Cupones, Gift Cards, Stripe    → Monetización avanzada.
```

### Resumen

La plataforma tiene una **base técnica excelente** (Next.js 15, Supabase, 165 tests, Docker, CI/CD). El problema no es técnico sino **funcional**: los módulos sociales están acoplados, no hay diferenciación de espacios (foro vs DM vs comentarios), y el flujo de reservas no exige pago.

El cambio de **mayor impacto con menor esfuerzo** es la separación de Comunidad/Foros/Mensajes + reorganización del sidebar. Eso solo ya desacopla la arquitectura y prepara el terreno para todo lo demás.
