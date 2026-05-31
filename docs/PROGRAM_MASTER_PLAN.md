# PROGRAMA ANA REIKI — PLAN MAESTRO

> **Clasificación:** CONFIDENCIAL
> **Versión:** 1.0
> **Autor:** Program Director / Enterprise Architect / CTO / PMO / CQO / Business Architect / Functional Analyst
> **Última revisión:** 2026-05-30

---

## ÍNDICE

1. CARTA DEL PROGRAMA
2. BUSINESS MODEL CANVAS
3. VALUE PROPOSITION CANVAS
4. CUSTOMER JOURNEY
5. MODELO DE MONETIZACIÓN
6. ROADMAP MASTER
7. BACKLOG MASTER
8. DEPENDENCY MAP
9. MILESTONES
10. CRITERIOS GO / NO GO
11. EPICS, FEATURES, USER STORIES
12. USE CASES
13. CQO — VALIDACIÓN DE CALIDAD
14. RIESGOS Y MITIGACIONES

---

## 1. CARTA DEL PROGRAMA

### 1.1 Visión

Construir la plataforma SaaS de bienestar integral líder en LATAM, donde cada persona encuentre su camino de sanación con acompañamiento profesional, herramientas digitales e inteligencia artificial.

### 1.2 Misión

Empoderar a terapeutas y consultantes con una plataforma unificada que integre gestión clínica, contenido multimedia, comunidad y tecnología predictiva para transformar la terapia en una experiencia continua, medida y personalizada.

### 1.3 Objetivos Estratégicos

| KPI | Línea Base | Meta 12 meses | Meta 24 meses |
|-----|-----------|---------------|---------------|
| Usuarios registrados | 0 | 500 | 5,000 |
| Usuarios premium | 0 | 100 | 1,200 |
| Ingreso recurrente mensual (MRR) | $0 | $5,000 USD | $50,000 USD |
| Tasa de retención mensual | 0% | >75% | >85% |
| Churn rate | 0% | <8% | <5% |
| NPS | 0 | >50 | >70 |
| Sesiones mensuales por usuario | 0 | >12 | >20 |

### 1.4 Stakeholders

| Stakeholder | Rol | Interés |
|-------------|-----|---------|
| Ana (terapeuta) | Product Owner / Domain Expert | Gestionar su práctica, escalar su impacto |
| Consultantes (clientes) | Usuarios finales | Acceder a contenido, reservar citas, seguir su evolución |
| Administradores (Ana + staff) | Operadores del sistema | Gestionar contenido, agenda, clientes |
| Inversores | Financiadores | ROI, crecimiento, tracción |
| Equipo técnico | Implementadores | Plataforma estable, escalable, mantenible |

---

## 2. BUSINESS MODEL CANVAS

### 2.1 Canvas

| Segmento | Propuesta de Valor | Canales | Relación | Fuentes de Ingreso |
|----------|-------------------|---------|----------|-------------------|
| **Consultantes individuales** que buscan bienestar holístico | Plataforma todo-en-uno: terapia + contenido diario + comunidad + IA | Web app (Next.js), Mobile app (React Native), WhatsApp, Email | Automatizada + personal (Ana) | Membresía mensual/anual, Sesiones individuales, Cursos |
| **Terapeutas/Profesionales** que quieren digitalizar su práctica | SaaS white-label: CRM terapéutico + agenda + teleconsulta + billing | Web app, API, Marketplace | Self-service + onboarding guiado | SaaS mensual por terapeuta, Comisión por sesión |
| **Empresas** que ofrecen bienestar a empleados | Programa corporativo: acceso grupal + reporting + talleres | Portal corporativo, API | Account manager dedicado | Contrato anual por empresa |

| Recursos Clave | Actividades Clave | Socios Clave | Estructura de Costos |
|----------------|-------------------|--------------|---------------------|
| Plataforma tecnológica (Next.js + Supabase + Cloudinary) | Desarrollo continuo de producto | Cloudinary (video hosting) | Infraestructura cloud |
| Contenido original (sesiones grabadas, meditaciones) | Creación de contenido | Spotify (podcast) | Personal: dev, content, support |
| Datos de mood y progreso (activo estratégico) | Curación de comunidad | Supabase (DB + Auth) | Marketing y adquisición |
| Marca Ana Murat Reiki | Onboarding y soporte | Resend (email) | Contenido (producción video/audio) |
| Red de terapeutas (futuro) | Validación clínica | OpenAI (IA terapéutica) | APIs externas (IA, email, cloud) |

### 2.2 Value Proposition Canvas

**Perfil del Cliente (Consultante):**

| Trabajos por hacer | Dolores | Ganancias |
|-------------------|---------|-----------|
| Encontrar bienestar emocional y físico | Falta de tiempo para ir a sesiones presenciales | Acceso 24/7 a contenido desde casa |
| Mantener una práctica diaria de autocuidado | Dificultad para mantener consistencia | Recordatorios y rachas (gamificación) |
| Buscar acompañamiento profesional de confianza | Procesos terapeuticos caros y fragmentados | Precios accesibles vs sesiones presenciales |
| Medir su progreso emocional | No saber si está mejorando | Mood tracker + gráficas de evolución |
| Conectar con comunidad de similares | Aislamiento en el proceso de sanación | Foro, grupos, eventos comunitarios |

**Propuesta de Valor:**

| Productos/Servicios | Aliviadores de dolor | Creadores de ganancia |
|--------------------|---------------------|---------------------|
| Membresía mensual con contenido ilimitado | Precio fijo, sin sorpresas | Biblioteca siempre creciente |
| Mood tracker + IA predictiva | Visualización objetiva del progreso | Alertas tempranas de recaída |
| Booking inteligente | Sin cadenas de WhatsApp | Confirmación automática |
| Comunidad terapéutica | Acompañamiento entre pares | Sentido de pertenencia |
| Planes personalizados por IA | Contenido relevante para cada etapa | Recomendaciones inteligentes |

---

## 3. CUSTOMER JOURNEY

### 3.1 Customer Journey Map — Consultante

```
FASE 1: DESCUBRIMIENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Touchpoints:   Google / Instagram / WhatsApp / Recomendación
Acciones:      Busca "bienestar holístico" / Ve contenido de Ana / Pregunta por WhatsApp
Emoción:       🔍 Curiosa, esperanzada, incrédula
Métrica:       Visitantes únicos → Tasa de conversión a registro > 5%

FASE 2: ACTIVACIÓN (REGISTRO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Touchpoints:   Web app / formulario registro / email confirmación
Acciones:      Crea cuenta / Confirma email / Completa perfil (datos demográficos, área de interés)
Emoción:       😊 Motivada, expectante
Métrica:       Registros completados / Tasa de activación > 70%

FASE 3: PRIMERA EXPERIENCIA (ONBOARDING)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Touchpoints:   Dashboard / email onboarding / WhatsApp
Acciones:      Tour guiado / Mood check inicial / Recomendación de primer contenido / Booking primera sesión
Emoción:       🧐 Explorando, algo abrumada
Métrica:       Usuarios que completan onboarding > 80% / Tiempo hasta primera acción > 7 días

FASE 4: ENGAGEMENT (USO REGULAR)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Touchpoints:   Web app / Mobile app / Email / Push notifications
Acciones:      Login diario / Registra mood / Ve contenido / Asiste a sesiones / Participa en comunidad
Emoción:       😌 Rutina saludable, satisfacción
Métrica:       DAU/MAU > 40% / Sesiones semanales > 3 / Tasa de retención > 85%

FASE 5: MONETIZACIÓN (CONVERSIÓN A PREMIUM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Touchpoints:   Web app / Email marketing / Contenido gated
Acciones:      Prueba gratis premium / Ve contenido exclusivo / Decide upgrade / Paga membresía
Emoción:       💰 Evaluando valor, decisión de inversión
Métrica:       Free → Premium conversion > 10% / Trial → Paid > 25%

FASE 6: LEALTAD (RETENCIÓN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Touchpoints:   Web app / Comunidad / Email / WhatsApp
Acciones:      Renueva membresía / Recomienda a amigos / Comparte en redes / Da feedback
Emoción:       ❤️ Pertenencia, gratitud, defensora de marca
Métrica:       Churn < 5% / Net Promoter Score > 70 / Referrals por usuario > 0.5

FASE 7: EXPANSIÓN (UPSELL / CROSS-SELL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Touchpoints:   Web app / Email / Dashboard
Acciones:      Compra curso avanzado / Upgrade a plan familiar / Contrata sesión 1:1 premium
Emoción:       🚀 Crecimiento personal, inversión en sí misma
Métrica:       ARPU / Upsell rate > 15% / Cross-sell rate > 20%
```

---

## 4. MODELO DE MONETIZACIÓN

### 4.1 Estructura de Membresías

| Plan | Precio (USD/mes) | Precio (USD/año) | Características | Target |
|------|------------------|-------------------|-----------------|--------|
| **Free** | $0 | $0 | Perfil, mood tracker básico, 1 clase muestra, comunidad lectura | Visitantes |
| **Basic** | $9.99 | $99 ($8.25/mes) | Contenido completo (videos + podcast), mood tracker avanzado, agenda, 1 sesión trimestral incluida | Consultantes regulares |
| **Premium** | $19.99 | $199 ($16.58/mes) | Todo Basic + IA terapéutica, plan personalizado, sesiones mensuales, comunidad activa, cursos incluidos | Consultantes comprometidos |
| **Familiar** | $29.99 | $299 ($24.92/mes) | Todo Premium + hasta 4 perfiles, contenido familiar, talleres grupales | Familias |
| **Corporativo** | Custom | Custom | Acceso grupal, reporting, talleres empresa, API | Empresas |

### 4.2 Revenue Streams

| Fuente | Tipo | % Proyectado | Madurez |
|--------|------|--------------|---------|
| Membresías Basic + Premium | Recurrente (MRR) | 60% | Fase 3 |
| Sesiones 1:1 (pay-per-session) | Transaccional | 15% | Fase 1 |
| Cursos avanzados (individuales) | Transaccional | 10% | Fase 4 |
| SaaS terapeutas (white-label) | Recurrente (MRR) | 10% | Fase 6 |
| Marketplace comisiones | Transaccional | 5% | Fase 7 |

### 4.3 Upselling / Cross-selling

| Trigger | Upsell | Cross-sell |
|---------|--------|------------|
| Usuario free completa onboarding | Upgrade a Basic | — |
| Usuario Basic ve 10+ videos/semana | Upgrade a Premium | Curso complementario |
| Usuario registra mood bajo 3 veces seguidas | — | Sesión 1:1 con terapeuta |
| Usuario completa racha de 30 días | Upgrade a Premium (descuento por loyalty) | Plan familiar |
| Usuario compra sesión 1:1 | Pack de 5 sesiones con descuento | Membresía Premium |
| Usuario no ha iniciado sesión en 14 días | Oferta de reconexión (50% off 1 mes) | — |

### 4.4 Estrategia de Retención

| Programa | Mecanismo | Impacto Esperado |
|----------|-----------|------------------|
| Rachas de meditación | Gamificación (streaks + badges) | +20% DAU |
| Contenido personalizado | IA recomienda según mood + historial | +15% tiempo en plataforma |
| Email nurturing | Automatización con Resend: bienvenida, hitos, reconexión | +10% retención semanal |
| Comunidad | Foros, grupos de apoyo, retos semanales | -5% churn |
| Aniversario / hitos | Descuentos por permanencia, regalos | +5% retención anual |

---

## 5. ROADMAP MASTER

### 5.1 Línea de Tiempo del Programa

```
FASE 0: FUNDACIÓN
┌─────────────────────────────────────────────────────┐
│  SPRINT 1-2    │  DURACIÓN: 4 semanas               │
│  ESTABILIZAR Y ASEGURAR                             │
├─────────────────────────────────────────────────────┤
│  FASE 1: PANEL CLIENTES 2.0                         │
│  SPRINT 3-5    │  DURACIÓN: 6 semanas               │
│  MEJORAR EXPERIENCIA DE MIEMBROS                    │
├─────────────────────────────────────────────────────┤
│  FASE 2: CRM TERAPÉUTICO                            │
│  SPRINT 6-8    │  DURACIÓN: 6 semanas               │
│  GESTIÓN COMPLETA DE CLIENTES                       │
├─────────────────────────────────────────────────────┤
│  FASE 3: AGENDA INTELIGENTE                         │
│  SPRINT 9-11   │  DURACIÓN: 6 semanas               │
│  OPTIMIZACIÓN DE RESERVAS                           │
├─────────────────────────────────────────────────────┤
│  FASE 4: IA TERAPÉUTICA                             │
│  SPRINT 12-15  │  DURACIÓN: 8 semanas               │
│  ASISTENCIA INTELIGENTE                             │
├─────────────────────────────────────────────────────┤
│  FASE 5: COMUNIDAD                                  │
│  SPRINT 16-18  │  DURACIÓN: 6 semanas               │
│  ECOSISTEMA SOCIAL                                  │
├─────────────────────────────────────────────────────┤
│  FASE 6: APLICACIONES MÓVILES                       │
│  SPRINT 19-22  │  DURACIÓN: 8 semanas               │
│  NATIVO MÓVIL                                       │
├─────────────────────────────────────────────────────┤
│  FASE 7: ESCALA Y OPTIMIZACIÓN                      │
│  SPRINT 23-24  │  DURACIÓN: 4 semanas               │
│  PRODUCCIÓN Y CRECIMIENTO                           │
└─────────────────────────────────────────────────────┘
TOTAL: 48 semanas (~12 meses)
```

### 5.2 Diagrama de Fases

```
FASE 0 ──────────────────────────────────────
  │
  ├──[GO/GATE 1]── FASE 1 ───────────────────
  │                  │
  │                  ├──[GO/GATE 2]── FASE 2 ─
  │                  │                  │
  │                  │                  ├──[GO/GATE 3]── FASE 3 ─
  │                  │                  │                  │
  │                  │                  │                  ├──[GO/GATE 4]── FASE 4 ─
  │                  │                  │                  │                  │
  │                  │                  │                  │                  ├──[GO/GATE 5]── FASE 5 ─
  │                  │                  │                  │                  │                  │
  │                  │                  │                  │                  │                  ├──[GO/GATE 6]── FASE 6 ─
  │                  │                  │                  │                  │                  │                  │
  │                  │                  │                  │                  │                  │                  ├──[GO/GATE 7]── FASE 7
  │                  │                  │                  │                  │                  │                  │
  v                  v                  v                  v                  v                  v                  v
 ←8semanas→        ←6semanas→         ←6semanas→         ←6semanas→         ←8semanas→         ←6semanas→         ←8semanas→         ←4semanas→
  ESTABILIZAR        CLIENTES           CRM                AGENDA              IA               COMUNIDAD           MOBILE            ESCALAR
```

---

## 6. BACKLOG MASTER

### 6.1 FASE 0: FUNDACIÓN Y ESTABILIZACIÓN (Sprint 1-2)

#### Objetivo
Corregir toda la deuda técnica crítica, vulnerabilidades de seguridad y estabilizar la plataforma actual antes de agregar nueva funcionalidad.

#### Alcance
- Seguridad: parchar RLS, server actions, middleware
- Base de datos: alinear tipos, corregir migraciones
- UX: estados de carga, error, vacío
- Testing: setup de Vitest, tests críticos

#### Entregables

| ID | Entregable | Esfuerzo | Prioridad |
|----|-----------|----------|-----------|
| F0.1 | Auditoría de seguridad completa resuelta | 5d | 🔴 Crítica |
| F0.2 | Migración 009: parche RLS content + profiles | 2d | 🔴 Crítica |
| F0.3 | Types de DB regenerados y alineados | 3d | 🔴 Crítica |
| F0.4 | Server actions de content con service_role | 3d | 🔴 Crítica |
| F0.5 | Error boundaries + loading states en todas las rutas | 4d | 🟡 Alta |
| F0.6 | Test suite: setup + tests críticos (auth, appointments, content) | 5d | 🟡 Alta |
| F0.7 | Responsive audit: corregir contraste, padding, touch targets | 3d | 🟡 Alta |
| F0.8 | Manejo de errores LogoutButton + stalls en páginas | 1d | 🟡 Alta |

#### Dependencias
- Ninguna (es la fase fundacional)

#### Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Data loss al aplicar migración 006 en producción | Alta | 🔴 Crítico | Crear migración 009 con backup antes de aplicar |
| Bugs silenciosos por types desalineados | Alta | 🟡 Alto | Test de integración antes de merge |
| Sesiones rotas post-parche de seguridad | Media | 🔴 Crítico | Test de autenticación completo |

#### Criterios de Aceptación
1. ✅ Ninguna política RLS permite escalación de privilegios
2. ✅ Admin puede subir contenido exitosamente
3. ✅ Tipos TypeScript reflejan exactamente el esquema de DB
4. ✅ No existen páginas sin error boundary
5. ✅ Todos los componentes server-side tienen estados de carga/error/empty
6. ✅ Suite de tests mínima: auth flow + booking + content CRUD
7. ✅ Auditoría mobile UX resuelta (contraste, espaciado, touch)
8. ✅ Logout maneja errores HTTP correctamente

---

### 6.2 FASE 1: PANEL CLIENTES 2.0 (Sprint 3-5)

#### Objetivo
Transformar el área de miembros actual en un centro de bienestar personalizado con perfil, historial, gráficas y reproducción de citas.

#### Alcance
- Perfil de usuario editable
- Timeline de bienestar unificado
- Gráficas de evolución de mood
- Reprogramación de citas desde UI
- Notificaciones push/email

#### Entregables

| ID | Entregable | Esfuerzo | Prioridad |
|----|-----------|----------|-----------|
| F1.1 | Página de perfil de usuario (editar nombre, avatar, email) | 3d | 🔴 Alta |
| F1.2 | Timeline unificado (appointments + notes + reflections) | 5d | 🔴 Alta |
| F1.3 | Gráfica de tendencia de mood (semanal/mensual) con date-fns | 4d | 🔴 Alta |
| F1.4 | Reprogramación de citas desde Mis Citas (conectar RPC existente) | 3d | 🔴 Alta |
| F1.5 | Tabla `notifications` + sistema de notificaciones in-app | 5d | 🟡 Media |
| F1.6 | Recordatorios de cita vía Resend (24h antes) | 3d | 🟡 Media |
| F1.7 | Badges y logros por rachas (gamificación) | 4d | 🟡 Media |
| F1.8 | Página de configuración (notificaciones, privacidad, preferencias) | 3d | 🟡 Media |

#### Dependencias
- Fase 0 completada (seguridad + estabilidad)
- Migración 010: tabla `notifications`, `user_preferences`

#### Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Reprogramación de citas rompe booking si RPC está mal | Media | 🔴 Crítico | Test coverage en reschedule RPC |
| Timeline unificado tiene performance pobre con muchos datos | Alta | 🟡 Alto | Paginación + caching |
| Emails de Resend caen en spam | Media | 🟡 Medio | Configurar DKIM/SPF en dominio |

#### Criterios de Aceptación
1. ✅ Usuario puede editar su perfil (nombre, avatar)
2. ✅ Timeline muestra appointments + session_notes + reflections ordenados por fecha
3. ✅ Gráfica de mood renderiza datos reales con periodos semanal/mensual
4. ✅ Usuario puede reprogramar una cita futura (cambiar fecha/hora)
5. ✅ Notificaciones aparecen en un dropdown en el header
6. ✅ Email recordatorio llega 24h antes de cada cita
7. ✅ Badge de "Racha de 7 días" se muestra correctamente
8. ✅ Usuario puede configurar preferencias de notificación

---

### 6.3 FASE 2: CRM TERAPÉUTICO (Sprint 6-8)

#### Objetivo
Construir un sistema completo de gestión de clientes para Ana, con historial clínico, analíticas y automatización.

#### Alcance
- Dashboard admin avanzado
- Ficha completa de consultante
- Notas de sesión vinculadas a appointments
- Historial clínico por cliente
- Automatización de email marketing
- Exportación de datos

#### Entregables

| ID | Entregable | Esfuerzo | Prioridad |
|----|-----------|----------|-----------|
| F2.1 | Dashboard admin con KPIs (retención, churn, engagement) | 5d | 🔴 Alta |
| F2.2 | Ficha de consultante: datos personales + historial + notas + sesiones | 8d | 🔴 Alta |
| F2.3 | Notas de sesión vinculadas a appointment_id | 3d | 🔴 Alta |
| F2.4 | Migración 011: relación session_notes → appointments | 2d | 🔴 Alta |
| F2.5 | Historial clínico exportable (PDF) | 4d | 🟡 Media |
| F2.6 | Email marketing: broadcast a todos/miembros/premium | 5d | 🟡 Media |
| F2.7 | Sistema de etiquetas para segmentar clientes | 3d | 🟡 Media |
| F2.8 | Vista de calendario admin con filtros (día/semana/mes) | 4d | 🟡 Media |

#### Dependencias
- Fase 1 completada (perfil, timeline, notificaciones)
- Migración 011: ALTER session_notes ADD appointment_id

#### Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| CRM se vuelve demasiado complejo para Ana | Media | 🟡 Alto | UX simplificado + onboarding guiado |
| Exportación de datos personales sin cumplir GDPR | Media | 🔴 Crítico | Data privacy review antes de release |
| Email marketing sin opt-out legal | Baja | 🔴 Crítico | Incluir unsubscribe link en todos los emails |

#### Criterios de Aceptación
1. ✅ Admin ve KPIs: usuarios activos, retención, engagement, ingresos
2. ✅ Admin puede ver ficha completa de cualquier consultante
3. ✅ Notas de sesión se crean vinculadas a una appointment específica
4. ✅ Admin puede exportar historial de un consultante en PDF
5. ✅ Admin puede enviar email a segmento específico
6. ✅ Todos los emails tienen unsubscribe link
7. ✅ Calendario admin muestra appointments con filtros funcionales

---

### 6.4 FASE 3: AGENDA INTELIGENTE (Sprint 9-11)

#### Objetivo
Evolucionar el sistema de booking a una agenda inteligente con multiterapeuta, sincronización, waitlist y recomendación por IA.

#### Alcance
- Agenda multi-consultante
- Sincronización Google Calendar
- Waitlist automática
- Recomendación de slots por IA
- Pago integrado para sesiones

#### Entregables

| ID | Entregable | Esfuerzo | Prioridad |
|----|-----------|----------|-----------|
| F3.1 | Portal multi-consultante (cada terapeuta gestiona su agenda) | 8d | 🔴 Alta |
| F3.2 | Sincronización Google Calendar (OAuth + webhook) | 8d | 🔴 Alta |
| F3.3 | Waitlist automática (notificar cuando slot se libera) | 4d | 🟡 Media |
| F3.4 | Recomendación de mejor slot (IA: horario más popular) | 5d | 🟡 Media |
| F3.5 | Pasarela de pago integrada (Stripe/MercadoPago) | 8d | 🔴 Alta |
| F3.6 | Check-in automático: recordatorio + confirmación 1h antes | 3d | 🟡 Media |
| F3.7 | Política de cancelación con penalidad (no-show tracking) | 3d | 🟡 Media |
| F3.8 | Notificaciones SMS (Twilio) para recordatorios críticos | 4d | 🟡 Media |

#### Dependencias
- Fase 0 (estabilidad)
- Stripe/MercadoPago account setup
- Google Cloud Console project con Calendar API

#### Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Google Calendar API rate limits | Media | 🟡 Medio | Caching + sync diferido |
| Stripe onboarding complejo en LATAM | Alta | 🔴 Crítico | MercadoPago como alternativa |
| Waitlist sin test puede generar overbooking | Media | 🔴 Crítico | DB constraint test riguroso |

#### Criterios de Aceptación
1. ✅ Terapeuta puede ver su agenda personal independiente
2. ✅ Eventos de Google Calendar se sincronizan bidireccionalmente
3. ✅ Usuario puede unirse a waitlist y recibe notificación
4. ✅ IA recomienda 3 mejores slots basado en historial
5. ✅ Usuario puede pagar sesión con tarjeta/débito
6. ✅ No-show registra penalidad automática
7. ✅ Recordatorio SMS llega 1h antes de la cita

---

### 6.5 FASE 4: IA TERAPÉUTICA (Sprint 12-15)

#### Objetivo
Integrar inteligencia artificial para análisis predictivo de mood, recomendación de contenido, asistente virtual y planes personalizados.

#### Alcance
- Asistente virtual (chat IA) con contexto del usuario
- Análisis predictivo de bienestar
- Recomendación de contenido por perfil
- Plan de bienestar personalizado generado por IA
- Procesamiento de lenguaje natural para notas de sesión

#### Entregables

| ID | Entregable | Esfuerzo | Prioridad |
|----|-----------|----------|-----------|
| F4.1 | Chat IA terapéutico con contexto del usuario (mood, citas, notas) | 12d | 🔴 Alta |
| F4.2 | Análisis predictivo: alerta cuando mood baja consistentemente | 8d | 🔴 Alta |
| F4.3 | Recomendación de contenido por perfil (colaborative + content filtering) | 6d | 🟡 Media |
| F4.4 | Plan de bienestar semanal generado por IA | 8d | 🟡 Media |
| F4.5 | Resumen automático de notas de sesión | 4d | 🟡 Media |
| F4.6 | Insights dashboard: "Esta semana tu bienestar subió 15%" | 5d | 🟡 Media |

#### Dependencias
- API key OpenAI (o similar)
- Fase 1 (timeline + mood data)
- Stack DB para vectores (pgvector en Supabase)

#### Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Alucinaciones de IA en contexto terapéutico | Alta | 🔴 Crítico | Disclaimer + supervisión humana + guardrails |
| Costos de API de IA no controlados | Alta | 🟡 Alto | Rate limiting + caching + modelo local |
| Privacidad de datos de salud con IA | Alta | 🔴 Crítico | Procesar en servidor, no enviar PII a API externa |
| Regulación sanitaria (IA como dispositivo médico) | Baja | 🔴 Crítico | Posicionar como "asistente, no reemplazo" |

#### Criterios de Aceptación
1. ✅ Chat IA responde con contexto del usuario (sabe su mood, citas, progreso)
2. ✅ Sistema detecta patrón de 3+ días con mood bajo y sugiere intervención
3. ✅ Contenido recomendado tiene precisión >70% (click-through)
4. ✅ Plan semanal generado incluye 3 actividades + 1 contenido + 1 reflexión
5. ✅ Notas de sesión se resumen en 3 bullet points
6. ✅ Dashboard de insights muestra tendencias con lenguaje natural
7. ✅ Todos los outputs de IA tienen "Revisado por Ana" tag

---

### 6.6 FASE 5: COMUNIDAD (Sprint 16-18)

#### Objetivo
Crear un ecosistema social donde los consultantes interactúen, compartan experiencias y se apoyen mutuamente.

#### Alcance
- Foros de discusión por tema
- Grupos de apoyo (moderados)
- Retos semanales
- Eventos en vivo (webinars, círculos)
- Muro de logros compartidos

#### Entregables

| ID | Entregable | Esfuerzo | Prioridad |
|----|-----------|----------|-----------|
| F5.1 | Foro por categorías (Reiki, Yoga, Meditación, Bienestar) | 8d | 🔴 Alta |
| F5.2 | Sistema de grupos privados con moderación | 6d | 🟡 Media |
| F5.3 | Retos semanales con tracking (ej: "7 días de gratitud") | 5d | 🟡 Media |
| F5.4 | Calendario de eventos en vivo + streaming integrado | 8d | 🔴 Alta |
| F5.5 | Muro de logros compartibles (racha, hitos, badges) | 4d | 🟡 Media |
| F5.6 | Sistema de reportes y moderación de contenido | 3d | 🔴 Alta |
| F5.7 | Tabla `community_posts`, `comments`, `groups`, `challenges` | 4d | 🔴 Alta |

#### Dependencias
- Migración 012: tablas de comunidad
- Fase 1 (perfiles + avatares)
- Fase 3 (eventos en agenda)
- Servicio de streaming (Zoom API / StreamYard)

#### Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Contenido inapropiado en comunidad | Media | 🔴 Crítico | Moderación + reportes + IA de filtrado |
| Baja participación inicial | Alta | 🟡 Alto | Ana como community manager al inicio |
| Moderación consume tiempo de Ana | Alta | 🟡 Alto | Automatizar con reglas + IA |

#### Criterios de Aceptación
1. ✅ Usuario puede crear post en foro con título, contenido, categoría
2. ✅ Usuario puede comentar en posts de otros
3. ✅ Admin puede crear grupo privado con miembros seleccionados
4. ✅ Reto semanal muestra progreso colectivo
5. ✅ Evento en vivo se transmite dentro de la plataforma
6. ✅ Usuario puede compartir logro en redes sociales
7. ✅ Reportes de contenido inapropiado llegan al admin

---

### 6.7 FASE 6: APLICACIONES MÓVILES (Sprint 19-22)

#### Objetivo
Llevar la plataforma a dispositivos móviles con experiencia nativa, offline, push notifications y rendimiento óptimo.

#### Alcance
- App Android + iOS (React Native / Expo)
- Autenticación biométrica
- Modo offline (contenido descargable)
- Push notifications
- Widgets de mood en homescreen

#### Entregables

| ID | Entregable | Esfuerzo | Prioridad |
|----|-----------|----------|-----------|
| F6.1 | Proyecto Expo configurado con Supabase Auth | 5d | 🔴 Alta |
| F6.2 | Navegación y routing mobile (tabs + stack) | 5d | 🔴 Alta |
| F6.3 | Dashboard mobile con mood tracker offline-first | 8d | 🔴 Alta |
| F6.4 | Video player nativo (Cloudinary SDK mobile) | 5d | 🟡 Media |
| F6.5 | Reproductor de podcast background | 4d | 🟡 Media |
| F6.6 | Push notifications (Expo Push API) | 5d | 🔴 Alta |
| F6.7 | Descarga offline de contenido (videos + podcasts) | 8d | 🟡 Media |
| F6.8 | Widget de mood en homescreen (iOS widget + Android widget) | 5d | 🟡 Media |
| F6.9 | Biometric auth (FaceID + fingerprint) | 3d | 🟡 Media |
| F6.10 | Publicación App Store + Play Store | 5d | 🔴 Alta |

#### Dependencias
- Fase 1-5 completadas (todo el contenido debe existir)
- Cuenta de desarrollador Apple ($99/año)
- Cuenta de desarrollador Google ($25 única)

#### Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Apple rechaza app por contenido de salud | Media | 🔴 Crítico | Checklist de revisión antes de submit |
| Offline sync conflictivo | Alta | 🟡 Alto | CRDT + sync diferido |
| Rendimiento pobre en dispositivos gama baja | Alta | 🟡 Alto | Optimización de assets + lazy loading |
| Expo native modules limitados | Media | 🟡 Medio | Eject a bare workflow si necesario |

#### Criterios de Aceptación
1. ✅ App corre en iOS 16+ y Android 12+
2. ✅ Auth con FaceID / fingerprint funciona
3. ✅ Dashboard muestra datos offline cuando no hay conexión
4. ✅ Video se reproduce en fullscreen nativo
5. ✅ Podcast continúa en background
6. ✅ Push notification llega al recordar cita
7. ✅ Usuario descarga video y lo ve sin conexión
8. ✅ App publicada en App Store y Play Store

---

### 6.8 FASE 7: ESCALA Y OPTIMIZACIÓN (Sprint 23-24)

#### Objetivo
Preparar la plataforma para escalar a miles de usuarios con rendimiento óptimo, costos controlados y experiencia impecable.

#### Alcance
- Performance audit completo
- Optimización de costos cloud
- CDN tuning
- Database optimization
- Test coverage total
- Documentación completa

#### Entregables

| ID | Entregable | Esfuerzo | Prioridad |
|----|-----------|----------|-----------|
| F7.1 | Performance audit (Lighthouse, Web Vitals) | 3d | 🔴 Alta |
| F7.2 | Optimización de imágenes y assets (CDN + lazy) | 4d | 🟡 Media |
| F7.3 | Database tuning: índices, queries lentas, connection pooling | 5d | 🔴 Alta |
| F7.4 | Cost optimization: Supabase, Cloudinary, OpenAI | 3d | 🟡 Medio |
| F7.5 | Test coverage >80% (unit + integration + e2e) | 8d | 🔴 Alta |
| F7.6 | Documentación técnica completa (runbooks, ADRs, API) | 5d | 🟡 Media |
| F7.7 | Plan de continuidad de negocio (BCP) | 3d | 🟡 Medio |
| F7.8 | Penetration test + security audit | 5d | 🔴 Alta |

#### Dependencias
- Fase 0-6 completadas

#### Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Costos cloud se disparan al escalar | Alta | 🔴 Crítico | Budget alerts + auto-scaling limits |
| Penetration test encuentra vulnerabilidades críticas | Media | 🔴 Crítico | Fix antes de go-live |
| Documentación se vuelve obsoleta rápido | Alta | 🟡 Medio | CI check: docs out of sync → warning |

#### Criterios de Aceptación
1. ✅ Lighthouse score >90 en todas las páginas
2. ✅ Tiempo de carga <2s en 4G
3. ✅ Costos mensuales cloud <$500 USD proyectados para 5000 usuarios
4. ✅ Test coverage mínimo 80%
5. ✅ Todos los runbooks actualizados
6. ✅ Penetration test sin hallazgos críticos
7. ✅ Plan de continuidad documentado

---

## 7. DEPENDENCY MAP

```
FASE 0 ──────────────────────── FUNDACIÓN
  │
  │  Dependencias de FASE 0: Ninguna (punto de partida)
  │
  ├──────▶ FASE 1 ──────────────────────────── PANEL CLIENTES 2.0
  │         │
  │         │  Dependencias de FASE 1: FASE 0 ✅
  │         │  Migraciones nuevas: 010 (notifications, user_preferences)
  │         │
  │         ├──────▶ FASE 2 ────────────────── CRM TERAPÉUTICO
  │         │         │
  │         │         │  Dependencias de FASE 2: FASE 1 ✅
  │         │         │  Migraciones nuevas: 011 (session_notes → appointments FK)
  │         │         │
  │         │         └──────▶ FASE 3 ──────── AGENDA INTELIGENTE
  │         │                    │
  │         │                    │  Dependencias de FASE 3: FASE 0, Stripe/MP account
  │         │                    │  APIs externas: Google Calendar, Stripe/MercadoPago
  │         │                    │
  │         │                    ├──────▶ FASE 4 ────────────── IA TERAPÉUTICA
  │         │                    │         │
  │         │                    │         │  Dependencias de FASE 4: FASE 1 (data), FASE 3 (agenda)
  │         │                    │         │  APIs externas: OpenAI, pgvector
  │         │                    │         │
  │         │                    │         ├──────▶ FASE 5 ──── COMUNIDAD
  │         │                    │         │         │
  │         │                    │         │         │  Dependencias de FASE 5: FASE 1 (perfiles), FASE 3 (eventos)
  │         │                    │         │         │  Migraciones nuevas: 012 (community tables)
  │         │                    │         │         │  APIs externas: Zoom/StreamYard
  │         │                    │         │         │
  │         │                    │         │         ├──────▶ FASE 6 ──── APPS MÓVILES
  │         │                    │         │         │         │
  │         │                    │         │         │         │  Dependencias de FASE 6: FASE 1-5 completadas
  │         │                    │         │         │         │  Cuentas: Apple Developer, Google Play
  │         │                    │         │         │         │
  │         │                    │         │         │         └──────▶ FASE 7 ── ESCALA Y OPTIMIZACIÓN
  │         │                    │         │         │                    │
  │         │                    │         │         │                    │  Dependencias de FASE 7: FASE 0-6 completadas
  │         │                    │         │         │                    │
  │         │                    │         │         │                    └──────▶ 🚀 LANZAMIENTO OFICIAL
  │         │                    │         │         │
  │         │                    │         │         └── APIs de TERCEROS (todas las fases)
  │         │                    │         │             ├── Supabase (Auth + DB + Storage)
  │         │                    │         │             ├── Cloudinary (video hosting)
  │         │                    │         │             ├── Spotify (podcast embed)
  │         │                    │         │             ├── Resend (emails)
  │         │                    │         │             ├── OpenAI (IA terapéutica)
  │         │                    │         │             ├── Stripe / MercadoPago (pagos)
  │         │                    │         │             ├── Google Calendar (sync)
  │         │                    │         │             ├── Twilio (SMS)
  │         │                    │         │             ├── Zoom / StreamYard (eventos)
  │         │                    │         │             └── Vercel (hosting + analytics)
  │         │                    │         │
  │         │                    │         └── MIGRACIONES DEPENDIENTES
  │         │                    │               ├── 001-008 (existentes)
  │         │                    │               ├── 009: Fix RLS content + profiles
  │         │                    │               ├── 010: notifications, user_preferences
  │         │                    │               ├── 011: session_notes → appointments FK
  │         │                    │               └── 012: community tables
  │         │                    │
  │         │                    └── INFRAESTRUCTURA COMPARTIDA
  │         │                        ├── Vercel (hosting web)
  │         │                        ├── Supabase project (producción + staging)
  │         │                        ├── Monorepo (turborepo para web + mobile + agent)
  │         │                        └── CI/CD (Vercel + GitHub Actions)
  │         │
  │         └── CROSS-CUTTING CONCERNS (todas las fases)
  │             ├── Observabilidad (Vercel Analytics + Sentry)
  │             ├── Testing (Vitest + Playwright)
  │             ├── Seguridad (auditoría continua)
  │             └── Documentación (runbooks + ADRs)
  │
  v
TIEMPO
```

---

## 8. MILESTONES

| Hito | Fecha | Sprint | Descripción | Criterio GO/NO GO |
|------|-------|--------|-------------|-------------------|
| **M0** | Semana 4 | Sprint 2 | Fundación estabilizada | Auditoría seguridad aprueba, tests pasan, admin sube contenido |
| **M1** | Semana 10 | Sprint 5 | Panel Clientes 2.0 live | Perfil, timeline, gráficas, reprogramación funcionando |
| **M2** | Semana 16 | Sprint 8 | CRM Terapéutico operativo | Fichas cliente, historial, notas de sesión, email marketing |
| **M3** | Semana 22 | Sprint 11 | Agenda Inteligente activa | Multi-consultante, Google Calendar, pagos, waitlist |
| **M4** | Semana 30 | Sprint 15 | IA Terapéutica integrada | Chat, predicciones, recomendaciones, plan personalizado |
| **M5** | Semana 36 | Sprint 18 | Comunidad lanzada | Foros, grupos, retos, eventos en vivo |
| **M6** | Semana 44 | Sprint 22 | Apps móviles publicadas | App Store + Play Store, offline, push |
| **M7** | Semana 48 | Sprint 24 | Plataforma escalada y optimizada | Performance, costos, tests, documentación |

---

## 9. CRITERIOS GO / NO GO

### 9.1 Gate 0 → Fase 1 (Semana 4)

| Criterio | Métrica | Mínimo para GO |
|----------|---------|---------------|
| Vulnerabilidades críticas resueltas | Cantidad | 0 abiertas |
| RLS content profile fix implementado | Test pasa | ✅ |
| Types DB regenerados y alineados | Test compila | ✅ |
| Admin sube contenido exitosamente | Test E2E pasa | ✅ |
| Error boundaries en todas las rutas | Revisión código | 100% rutas cubiertas |
| Test suite mínimo operativo | Tests pasando | >10 tests |
| Auditoría móvil UX resuelta | Revisión QA | Sin issues P0/P1 |
| Deuda técnica documentada | Backlog items | Todos con owner y fecha |

**GO si:** Todos los criterios PASS. Cualquier FAIL → detener avance, lista de correcciones.

### 9.2 Gate 1 → Fase 2 (Semana 10)

| Criterio | Mínimo para GO |
|----------|---------------|
| Perfil de usuario funcional | ✅ |
| Timeline unificado sin bugs | ✅ |
| Gráfica de mood renderiza datos reales | ✅ |
| Reprogramación de citas operativa | ✅ |
| Notificaciones in-app funcionando | ✅ |
| Emails recordatorio enviados correctamente | ✅ |
| Gamificación básica (rachas + badges) | ✅ |
| Sin regresiones en Fase 0 | ✅ |
| Cobertura de tests >30% en módulos nuevos | ✅ |

### 9.3 Gate 2 → Fase 3 (Semana 16)

| Criterio | Mínimo para GO |
|----------|---------------|
| Dashboard admin con KPIs reales | ✅ |
| Ficha de consultante completa | ✅ |
| Notas de sesión vinculadas a appointments | ✅ |
| Exportación PDF funcional | ✅ |
| Email marketing operativo (broadcast + segmentado) | ✅ |
| Sistema de etiquetas funcional | ✅ |
| Sin regresiones en Fase 0-1 | ✅ |

### 9.4 Gate 3 → Fase 4 (Semana 22)

| Criterio | Mínimo para GO |
|----------|---------------|
| Multi-consultante operativo | ✅ |
| Google Calendar sync bidireccional | ✅ |
| Pagos con Stripe/MercadoPago funcionales | ✅ |
| Waitlist automática + notificación | ✅ |
| Política de cancelación implementada | ✅ |
| Sin regresiones en fases anteriores | ✅ |
| Penetration test de booking pasado | ✅ |

### 9.5 Gate 4 → Fase 5 (Semana 30)

| Criterio | Mínimo para GO |
|----------|---------------|
| Chat IA con contexto de usuario funcional | ✅ |
| Predicción de baja de mood implementada | ✅ |
| Recomendación de contenido con precisión >70% | ✅ |
| Plan semanal generado por IA | ✅ |
| Resumen automático de notas | ✅ |
| Dashboard insights en lenguaje natural | ✅ |
| Disclaimer "IA asistencial, no reemplazo" visible | ✅ |
| Sin regresiones en fases anteriores | ✅ |
| Costos de API de IA dentro del budget | ✅ |

### 9.6 Gate 5 → Fase 6 (Semana 36)

| Criterio | Mínimo para GO |
|----------|---------------|
| Foro por categorías funcional | ✅ |
| Grupos privados con moderación | ✅ |
| Retos semanales operativos | ✅ |
| Eventos en vivo con streaming | ✅ |
| Muro de logros compartible | ✅ |
| Sistema de reportes funcional | ✅ |
| Sin regresiones en fases anteriores | ✅ |

### 9.7 Gate 6 → Fase 7 (Semana 44)

| Criterio | Mínimo para GO |
|----------|---------------|
| App iOS publicada en App Store | ✅ |
| App Android publicada en Play Store | ✅ |
| Auth biométrico funcional | ✅ |
| Offline mode operativo (contenido descargable) | ✅ |
| Push notifications funcionales | ✅ |
| Widget de mood en homescreen | ✅ |
| Performance mobile: carga <3s en 4G | ✅ |
| Sin regresiones en fases anteriores | ✅ |

### 9.8 Gate 7 → GO-LIVE FINAL (Semana 48)

| Criterio | Mínimo para GO |
|----------|---------------|
| Lighthouse >90 en todas las páginas | ✅ |
| Tiempo de carga <2s en 4G | ✅ |
| Costos cloud <$500 USD/mes proyectados | ✅ |
| Test coverage >80% | ✅ |
| Penetration test: 0 hallazgos críticos | ✅ |
| Plan de continuidad documentado | ✅ |
| Documentación técnica completa | ✅ |
| Todos los bugs conocidos resueltos o planificados | ✅ |
| Sin deuda técnica P0/P1 | ✅ |

---

## 10. EPICS, FEATURES Y USER STORIES

### 10.1 EPIC 0: SEGURIDAD Y ESTABILIDAD

**Feature 0.1 — Endurecimiento de Seguridad**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-001 | RLS profiles restringido | Como sistema, quiero que ningún usuario no-admin pueda modificar role/is_premium, para prevenir escalación de privilegios | P0 |
| US-002 | RLS content operators | Como admin, quiero poder insertar contenido con mi sesión normal, no service_role, para que el panel admin funcione | P0 |
| US-003 | Server actions autorizadas | Como sistema, quiero que todas las server actions verifiquen rol admin donde corresponda, para prevenir mutaciones no autorizadas | P0 |

**Feature 0.2 — Estabilidad de Plataforma**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-004 | Error boundaries | Como usuario, quiero ver un mensaje amigable cuando algo falla, no una pantalla en blanco | P1 |
| US-005 | Loading states | Como usuario, quiero ver un skeleton mientras los datos cargan | P1 |
| US-006 | Empty states | Como usuario, quiero ver un mensaje claro cuando no hay datos en una sección | P1 |
| US-007 | Test suite existente | Como desarrollador, quiero tests que validen auth flow y booking, para prevenir regresiones | P1 |

### 10.2 EPIC 1: PANEL CLIENTES 2.0

**Feature 1.1 — Perfil de Usuario**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-008 | Ver perfil | Como miembro, quiero ver mi perfil con mis datos actuales, para saber qué información tiene la plataforma sobre mí | P1 |
| US-009 | Editar perfil | Como miembro, quiero editar mi nombre y foto de perfil, para mantener mis datos actualizados | P1 |
| US-010 | Configurar preferencias | Como miembro, quiero configurar qué notificaciones recibo, para controlar mi experiencia | P2 |

**Feature 1.2 — Timeline de Bienestar**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-011 | Ver timeline | Como miembro, quiero ver una línea de tiempo con mis citas, notas de sesión y reflexiones diarias, para tener una visión completa de mi progreso | P1 |
| US-012 | Filtrar timeline | Como miembro, quiero filtrar el timeline por tipo (citas, notas, reflexiones), para enfocarme en lo que me interesa | P2 |

**Feature 1.3 — Gráficas de Evolución**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-013 | Ver gráfica de mood semanal | Como miembro, quiero ver una gráfica de mi estado de ánimo de los últimos 7 días, para visualizar mi evolución emocional | P1 |
| US-014 | Ver gráfica de mood mensual | Como miembro, quiero ver una gráfica mensual de mi estado de ánimo, para identificar patrones a largo plazo | P1 |
| US-015 | Correlaciones | Como miembro, quiero ver cómo mi mood se correlaciona con mis citas y contenido visto, para entender qué me ayuda | P2 |

**Feature 1.4 — Reprogramación de Citas**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-016 | Reprogramar cita | Como miembro, quiero cambiar la fecha/hora de una cita futura, para adaptarme a cambios imprevistos | P1 |
| US-017 | Confirmar reprogramación | Como miembro, quiero recibir confirmación cuando reprogramo una cita, para estar segura que el cambio se guardó | P1 |

**Feature 1.5 — Gamificación**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-018 | Ver racha actual | Como miembro, quiero ver mi racha de días consecutivos usando la plataforma, para sentirme motivada a mantener el hábito | P1 |
| US-019 | Obtener badges | Como miembro, quiero recibir insignias por hitos (7 días, 30 días, primera cita), para celebrar mis logros | P2 |
| US-020 | Compartir logros | Como miembro, quiero compartir mis logros en redes sociales, para inspirar a otros | P3 |

### 10.3 EPIC 2: CRM TERAPÉUTICO

**Feature 2.1 — Dashboard Admin**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-021 | Ver KPIs | Como admin, quiero ver KPIs en tiempo real (usuarios activos, retención, churn), para tomar decisiones informadas | P1 |
| US-022 | Ver tendencias | Como admin, quiero ver gráficas de tendencia de registros y actividad, para identificar patrones de crecimiento | P1 |
| US-023 | Exportar reportes | Como admin, quiero exportar reportes en CSV/PDF, para compartir con inversores o para análisis externo | P2 |

**Feature 2.2 — Ficha de Consultante**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-024 | Ver ficha completa | Como admin, quiero ver una ficha con datos personales, historial de citas, notas de sesión, y estado de membresía, para tener una visión 360° del consultante | P1 |
| US-025 | Buscar consultantes | Como admin, quiero buscar consultantes por nombre o email, para encontrar rápido a cualquier persona | P1 |
| US-026 | Segmentar por etiquetas | Como admin, quiero asignar etiquetas a consultantes (ej: "Reiki frecuente", "Nuevo", "Premium"), para segmentar comunicación | P2 |

**Feature 2.3 — Notas de Sesión**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-027 | Crear nota de sesión | Como admin, quiero crear una nota de sesión vinculada a una cita específica, para registrar el progreso del consultante | P1 |
| US-028 | Nota privada | Como admin, quiero marcar una nota como privada (visible solo para mí), para registrar información sensible | P1 |
| US-029 | Ver historial de notas | Como admin, quiero ver todas las notas de un consultante ordenadas por fecha, para entender su evolución | P1 |

### 10.4 EPIC 3: AGENDA INTELIGENTE

**Feature 3.1 — Multi-consultante**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-030 | Gestión multi-agenda | Como terapeuta, quiero gestionar mi propia agenda independiente, para no mezclarme con otros profesionales | P1 |
| US-031 | Perfil de terapeuta | Como terapeuta, quiero tener un perfil público con mi foto, especialidad y horarios, para que los clientes me elijan | P1 |

**Feature 3.2 — Calendario Externo**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-032 | Sync Google Calendar | Como terapeuta, quiero sincronizar mi Google Calendar con la plataforma, para evitar dobles reservas | P1 |
| US-033 | Bloqueo automático | Como terapeuta, quiero que las citas reservadas en la plataforma aparezcan en mi Google Calendar automáticamente | P1 |

**Feature 3.3 — Pagos**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-034 | Pagar sesión online | Como miembro, quiero pagar mi sesión con tarjeta de crédito/débito al reservar, para asegurar mi turno | P1 |
| US-035 | Recibir pago como admin | Como admin, quiero recibir el pago directamente en mi cuenta bancaria, para no gestionar cobros manualmente | P1 |
| US-036 | Historial de pagos | Como miembro, quiero ver mi historial de pagos y facturas, para llevar control de mis gastos | P2 |

**Feature 3.4 — Waitlist**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-037 | Unirse a waitlist | Como miembro, quiero unirme a una lista de espera si no hay horario disponible, para no perder la oportunidad | P2 |
| US-038 | Notificar disponibilidad | Como sistema, quiero notificar al miembro cuando un slot se libere en la waitlist, para que pueda reservar rápido | P2 |

### 10.5 EPIC 4: IA TERAPÉUTICA

**Feature 4.1 — Asistente Virtual**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-039 | Chat con IA | Como miembro, quiero chatear con un asistente que conoce mi historial de mood y citas, para obtener apoyo personalizado | P1 |
| US-040 | Contexto del usuario | Como sistema, quiero que la IA tenga acceso al mood actual, últimas reflexiones y citas del usuario, para dar respuestas relevantes | P1 |
| US-041 | Disclaimer terapéutico | Como sistema, quiero que la IA muestre un disclaimer de que no reemplaza a Ana, para gestionar expectativas | P1 |

**Feature 4.2 — Análisis Predictivo**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-042 | Detección de tendencia negativa | Como sistema, quiero detectar cuando el mood de un usuario baja consistentemente (3+ días), para alertar a Ana | P1 |
| US-043 | Sugerencia de intervención | Como sistema, quiero sugerir contenido o una cita cuando detecto una tendencia negativa, para intervenir temprano | P1 |

**Feature 4.3 — Plan Personalizado**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-044 | Plan semanal generado | Como miembro, quiero recibir un plan de bienestar semanal personalizado basado en mi historial, para tener una guía diaria | P1 |
| US-045 | Contenido recomendado | Como miembro, quiero ver recomendaciones de videos y podcasts basadas en mi perfil, para descubrir contenido relevante | P1 |

### 10.6 EPIC 5: COMUNIDAD

**Feature 5.1 — Foros**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-046 | Crear post | Como miembro, quiero crear un post en el foro con un tema de bienestar, para compartir mi experiencia | P1 |
| US-047 | Comentar posts | Como miembro, quiero comentar en posts de otros miembros, para interactuar y apoyar a la comunidad | P1 |
| US-048 | Moderar contenido | Como admin, quiero poder ocultar/eliminar posts inapropiados, para mantener un espacio seguro | P1 |

**Feature 5.2 — Eventos en Vivo**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-049 | Ver calendario de eventos | Como miembro, quiero ver los próximos eventos en vivo (círculos, webinars), para participar | P1 |
| US-050 | Unirme a evento | Como miembro, quiero unirme a un evento en vivo desde la plataforma, para no necesitar otra aplicación | P1 |
| US-051 | Crear evento | Como admin, quiero crear un evento en vivo con fecha, hora y tema, para programar actividades | P1 |

### 10.7 EPIC 6: APLICACIONES MÓVILES

**Feature 6.1 — Experiencia Nativa**

| US | Título | Historia | Prioridad |
|----|--------|---------|-----------|
| US-052 | Auth biométrico | Como miembro, quiero iniciar sesión con mi huella o rostro, para no tener que escribir contraseña cada vez | P1 |
| US-053 | Offline mode | Como miembro, quiero descargar contenido para ver sin conexión, para usarlo en el transporte o donde no hay internet | P1 |
| US-054 | Push notifications | Como miembro, quiero recibir notificaciones push de recordatorios y nuevo contenido, para no perderme nada | P1 |
| US-055 | Widget de mood | Como miembro, quiero registrar mi estado de ánimo desde un widget en mi pantalla de inicio, para hacerlo rápido | P2 |

---

## 11. USE CASES

### 11.1 Use Case: Reprogramar Cita (Fase 1)

| Atributo | Valor |
|----------|-------|
| **ID** | UC-001 |
| **Nombre** | Reprogramar cita existente |
| **Actores** | Miembro (autenticado), Sistema |
| **Disparador** | Miembro selecciona "Reprogramar" en Mis Citas |
| **Precondiciones** | Miembro tiene al menos 1 cita futura con estado pending/confirmed |

**Flujo Principal:**
1. Miembro navega a /miembros/mis-citas
2. Sistema muestra lista de citas (futuras y pasadas)
3. Miembro hace clic en "Reprogramar" en una cita futura
4. Sistema abre modal con calendario de disponibilidad
5. Miembro selecciona nueva fecha y hora
6. Sistema valida disponibilidad del slot
7. Sistema ejecuta reschedule_appointment RPC
8. Sistema muestra confirmación con nuevos datos
9. Sistema envía email de confirmación a miembro
10. Sistema registra auditoría en appointment_audit_log

**Flujo Alternativo (Slot no disponible):**
- 6a. Slot ya no está disponible → Sistema muestra mensaje de error
- 6b. Sistema sugiere 3 slots alternativos cercanos
- 6c. Miembro selecciona alternativa o cancela

**Excepciones:**
- Cita no encontrada → Error 404
- Cita pasada → Botón deshabilitado
- Sin sesión → Redirect a /login
- Cita cancelada → Botón no disponible

**Validaciones:**
- La nueva fecha debe ser futura (> ahora + 1 hora)
- El nuevo slot no debe solaparse con otras citas del mismo consultor
- Solo el dueño de la cita o admin pueden reprogramar
- El slot debe estar dentro de availability_rules (con tolerancia del buffer)

**Reglas de Negocio:**
- Reprogramar una cita confirmada la regresa a "pending"
- El consultante puede reprogramar máximo 2 veces por cita
- No se puede reprogramar una cita con menos de 24h de anticipación

**KPIs:**
- Tasa de reprogramación exitosa: target >90%
- Tiempo promedio de reprogramación: target <120 segundos
- % de citas reprogramadas vs total: benchmark <20%

### 11.2 Use Case: Predecir Tendencia de Mood (Fase 4)

| Atributo | Valor |
|----------|-------|
| **ID** | UC-002 |
| **Nombre** | Predicción de tendencia negativa de bienestar |
| **Actores** | Sistema IA, Admin (notificado), Miembro (beneficiario) |
| **Disparador** | Job diario que analiza últimos 7 días de daily_reflections |
| **Precondiciones** | Miembro tiene al menos 5 registros de mood en los últimos 14 días |

**Flujo Principal:**
1. Job diario ejecuta análisis de tendencia de mood para todos los miembros activos
2. Sistema calcula media móvil de 3 días vs media de 14 días
3. Si media móvil baja >20% y hay tendencia negativa 3+ días consecutivos:
4. Sistema genera alerta en admin dashboard
5. Sistema sugiere contenido relevante (meditación, video motivacional)
6. Sistema notifica al miembro: "Notamos que tu estado de ánimo bajó estos días"

**Flujo Alternativo (Mejora consistente):**
- 3a. Media móvil sube >20% → Sistema genera insight positivo
- 3b. Sistema muestra en dashboard: "¡Tu bienestar mejoró 15% esta semana!"

**Excepciones:**
- Datos insuficientes (<5 registros) → No ejecuta predicción
- Error de API de IA → Fallback a análisis estadístico simple

**Validaciones:**
- Los datos de mood deben ser del mismo miembro (no agregados)
- La tendencia se calcula sobre datos completos (no parciales del día actual)
- No generar más de 1 alerta por semana por miembro (evitar fatiga)

**Reglas de Negocio:**
- Toda alerta generada por IA debe ser revisable por Ana
- Las sugerencias de contenido deben ser del mismo tipo que el miembro consume habitualmente
- El miembro puede desactivar las predicciones de IA en preferencias

**KPIs:**
- Precisión de predicción: target >75% (mood bajo real dentro de 48h de la alerta)
- Tasa de engagement con contenido sugerido: target >30%
- Falsos positivos: target <10%

---

## 12. CQO — VALIDACIÓN DE CALIDAD DEL PLAN MAESTRO

### 12.1 Resumen de Validación

| Dimensión | STATUS | Observaciones |
|-----------|--------|--------------|
| Funcional | ✅ PASS | Cobertura completa de todos los módulos solicitados |
| Técnico | ✅ PASS WITH OBSERVATIONS | Ver sección 12.3 |
| Arquitectura | ✅ PASS | Clean Architecture, Server Components por defecto, RLS-first |
| Seguridad | ⚠️ PASS WITH OBSERVATIONS | Ver sección 12.3 |
| UX | ✅ PASS | Customer journey definido con todas las fases |
| Rendimiento | ✅ PASS | Targets de performance definidos en cada fase |
| Escalabilidad | ⚠️ PASS WITH OBSERVATIONS | Ver sección 12.3 |
| Mantenibilidad | ✅ PASS | Documentación, tests, ADRs planificados |

### 12.2 STATUS GENERAL: ✅ PASS WITH OBSERVATIONS

### 12.3 Hallazgos

| ID | Hallazgo | Severidad | Fase | Mitigación Requerida |
|----|----------|-----------|------|---------------------|
| H-001 | El modelo de monetización asume Stripe sin validar factibilidad en LATAM (MercadoPago puede ser requisito) | 🟡 Medio | Fase 3 | Incluir MercadoPago como alternativa desde el diseño |
| H-002 | La IA terapéutica (Fase 4) no especifica qué modelo de OpenAI usar ni costos asociados | 🟡 Medio | Fase 4 | Agregar análisis de costos antes de implementar |
| H-003 | No hay plan de backup/restore de base de datos en ninguna fase | 🟡 Medio | Fase 0 | Agregar a backlog de Fase 0 |
| H-004 | La app mobile (Fase 6) no especifica estrategia de sync offline (CRDT, OT, last-write-wins) | 🟡 Medio | Fase 6 | Definir estrategia en ADR antes de implementar |
| H-005 | El plan no contempla un entorno de staging/productivo separado | 🟡 Medio | Fase 0 | Agregar infraestructura de staging |
| H-006 | No hay plan de disaster recovery ni SLA definido | 🟡 Bajo | Fase 7 | Incluir en plan de continuidad |
| H-007 | La gamificación (Fase 1) podría incentivar comportamiento adictivo no saludable | 🟡 Medio | Fase 1 | Revisar diseño con perspectiva ética |

### 12.4 Riesgos

| ID | Riesgo | Probabilidad | Impacto | Dueño |
|----|--------|-------------|---------|-------|
| R-001 | Dependencia crítica de OpenAI: cambio de precios, términos, o disponibilidad | Alta | Crítico | CTO |
| R-002 | Apple rechaza app por regulaciones de salud mental | Media | Crítico | PMO |
| R-003 | Adopción baja de IA terapéutica por desconfianza del usuario | Alta | Alto | Product Owner |
| R-004 | Costos de infraestructura superan proyecciones al escalar | Alta | Crítico | CTO |
| R-005 | Regulación de telemedicina/salud digital cambia y afecta el modelo | Media | Crítico | Legal |
| R-006 | Dependencia de un solo administrador (Ana) para contenido y comunidad | Alta | Alto | PMO |

### 12.5 Defectos (Requieren Corrección)

| ID | Defecto | Fase | Acción Correctiva |
|----|---------|------|-------------------|
| D-001 | Faltan migraciones de datos de prueba (seed data) para desarrollo | Fase 0 | Agregar seed.sql con datos de ejemplo |
| D-002 | No se especifica cómo migrar datos legacy de la tabla `availability` a `availability_rules` | Fase 0 | Incluir en migración 009 |
| D-003 | No hay plan de logging y monitoreo (Sentry/Datadog) en ninguna fase | Fase 0 | Agregar como dependencia cross-cutting |

### 12.6 Deuda Técnica Identificada

| ID | Item | Esfuerzo | Prioridad |
|----|------|----------|-----------|
| TD-001 | Types de DB manuales vs generados por Supabase CLI | 1d | Alta |
| TD-002 | Sin CI/CD pipeline más allá de Vercel deploy | 2d | Alta |
| TD-003 | Tests de componentes con jsdom pueden no reflejar browser real | 1d | Media |
| TD-004 | Sin service layer entre server components y DB queries | 5d | Media |
| TD-005 | Mezcla de estilos Tailwind v3 y v4 en algunos componentes | 2d | Baja |

### 12.7 Mejoras Recomendadas

| ID | Mejora | Impacto | Esfuerzo |
|----|--------|---------|----------|
| M-001 | Implementar feature flags (LaunchDarkly / simple) para releases graduales | Medio | 2d |
| M-002 | Dashboard público de status (status.anareiki.com) | Alto | 1d |
| M-003 | Programa de beta testers cerrado antes de Fase 1 | Alto | 3d |
| M-004 | Encuesta de satisfacción post-cita automatizada | Medio | 2d |
| M-005 | Analytics de comportamiento (Hotjar / PostHog) | Alto | 1d |
| M-006 | Plan de marketing de contenidos sincronizado con releases | Alto | 5d |

---

## 13. OPORTUNIDADES SaaS IDENTIFICADAS

### 13.1 Producto SaaS independiente

El CRM terapéutico + agenda inteligente + IA puede convertirse en un producto SaaS independiente para otros terapeutas:

**TheraOS — SaaS para terapeutas holisticos**

| Feature | Descripción | Monetización |
|---------|-------------|-------------|
| CRM de clientes con historial clínico | Fichas, notas, evolución | $29/mes por terapeuta |
| Agenda inteligente multi-sede | Booking, Google Calendar, waitlist | Incluido |
| Portal de miembros white-label | Marca propia del terapeuta | +$19/mes |
| IA de análisis predictivo | Alertas de tendencias, insights | +$9/mes |
| Teleconsulta integrada | Video, chat, notas | +$15/mes |
| Marketplace de terapeutas | Directorio público con reseñas | 10% comisión |

### 13.2 Roadmap de Expansión SaaS

- **Fase 6**: Separar CRM como módulo independiente
- **Fase 7**: White-label para primeros 5 terapeutas beta
- **Post-Fase 7**: Marketplace público multi-terapeuta

---

## 14. CONCLUSIÓN

### Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| Duración total del programa | 48 semanas (~12 meses) |
| Fases | 8 (0-7) |
| Epics | 7 |
| User Stories | 55 funcionales + 7 de fundación |
| Use Cases documentados | 2 (representativos de los 7 epics) |
| Gates GO/NO GO | 8 (G0 a G7) |
| Riesgos identificados | 6 |
| Migraciones de BD planificadas | 4 nuevas (009-012) |
| APIs externas integradas | 10 |
| Inversión estimada (infra cloud) | <$500 USD/mes target |
| TIR esperada | >150% anual (proyectado basado en suscripciones) |

### Próximo Paso Inmediato

**Session Planning — Fase 0, Sprint 1**

1. Día 1-2: Migración 009 (fix RLS content + profiles)
2. Día 3-4: Regenerar types de DB + alinear código
3. Día 5-7: Server actions de content con service_role
4. Día 8-10: Error boundaries + loading states
5. Día 11-12: Test suite crítico
6. Día 13-14: Responsive audit + fixes
7. Día 15: QA Gate 0 review

---

*Documento generado bajo el Programa de Transformación Digital Ana Reiki.*
*Responsable: Program Director / Enterprise Architect / CTO / PMO / CQO / Business Architect / Functional Analyst*
*Versión 1.0 — 2026-05-30*
