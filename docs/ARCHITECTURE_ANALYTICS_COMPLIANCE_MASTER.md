# ANA REIKI — ARCHITECTURE, ANALYTICS & COMPLIANCE MASTER

> **Versión:** 1.0
> **Roles:** Software Architect / Data Architect / Security Architect / SaaS Business Analyst / FinOps Architect / Data Privacy Officer / Cloud Infrastructure Architect / Community Platform Architect / AI Solution Architect / Mobile Architect / DevOps Architect / Transformation Program Manager
> **2026-05-30**

---

## ÍNDICE

1. SOFTWARE ARCHITECTURE (C4 + Clean Architecture + DDD + Hexagonal)
2. DATA ARCHITECTURE (ERD + DDL + Índices + Particiones + RLS)
3. SECURITY ARCHITECTURE (OWASP + Threat Model + Pentest Checklist)
4. AI ARCHITECTURE (RAG + Embeddings + Guardrails + Vector DB)
5. COMMUNITY ARCHITECTURE (Groups + Gamification + Moderation)
6. MOBILE ARCHITECTURE (Offline-First + Push + Sync)
7. DEVOPS ARCHITECTURE (CI/CD + Docker + K8s + Observability)
8. CLOUD INFRASTRUCTURE (Hetzner, OVH, AWS, Azure, GCP — Private Infra)
9. SaaS BUSINESS ANALYTICS (CAC, LTV, MRR, ARR, Churn, Plans)
10. FINOPS — COST ANALYSIS (MVP → 10K Users per Provider)
11. DATA PRIVACY (GDPR + Argentina Ley 25.326)
12. QUICK WINS + ROADMAPS 12/24/36 MONTHS
13. MASTER BUILDER — BLOCKER ESCALATION

---

## 1. SOFTWARE ARCHITECTURE

### 1.1 Context Diagram (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ANA REIKI SYSTEM                             │
│                                                                     │
│  ┌────────────┐   ┌──────────────┐   ┌────────────┐   ┌─────────┐  │
│  │ CONSULTANT  │   │   ANA ADMIN  │   │  TERAPEUTA │   │  VISITOR │  │
│  │  (Web/Mob)  │   │   (Web/Mob)  │   │  (Web/Mob) │   │  (Web)   │  │
│  └──────┬──────┘   └──────┬───────┘   └──────┬─────┘   └────┬────┘  │
│         │                 │                   │              │       │
│         └─────────────────┼───────────────────┼──────────────┘       │
│                           ▼                   ▼                      │
│               ┌─────────────────────────────────────┐                │
│               │         ANA REIKI PLATFORM           │                │
│               │   (Next.js 16 + NestJS + Supabase)   │                │
│               └────────┬────────────┬───────────────┘                │
│                        │            │                                │
│                        ▼            ▼                                │
│               ┌────────────┐ ┌──────────────┐                        │
│               │  Supabase  │ │  External    │                        │
│               │  (Auth+DB) │ │  Services    │                        │
│               └────────────┘ └──────┬───────┘                        │
│                                     │                                │
│                    ┌────────────────┼──────────────────┐             │
│                    ▼                ▼                  ▼             │
│              ┌──────────┐   ┌──────────┐   ┌──────────────────┐     │
│              │Cloudinary│   │ Spotify  │   │Resend/Stripe/Twilio│    │
│              └──────────┘   └──────────┘   └──────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Container Diagram (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ANA REIKI CONTAINERS                            │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    WEB APPLICATION                            │    │
│  │                (Next.js 16 - App Router)                     │    │
│  │                                                              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │    │
│  │  │  Public   │  │ Members  │  │  Admin   │  │ API Routes│    │    │
│  │  │  Routes   │  │  Routes  │  │  Routes  │  │(Serverless)│    │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │    │
│  │                                                              │    │
│  │  ┌──────────────────────────────────────────────────────┐    │    │
│  │  │           SERVER COMPONENTS (React RSC)               │    │    │
│  │  ├──────────────────────────────────────────────────────┤    │    │
│  │  │           CLIENT COMPONENTS (React 19)                │    │    │
│  │  └──────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   BACKEND SERVICES                           │    │
│  │               (NestJS - Microservices)                      │    │
│  │                                                              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │    │
│  │  │  Auth    │ │  Agenda  │ │  Content │ │  Community│       │    │
│  │  │  Service │ │  Service │ │  Service │ │  Service  │       │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │    │
│  │  │   AI     │ │  Payment │ │  Notif.  │                    │    │
│  │  │  Service │ │  Service │ │  Service │                    │    │
│  │  └──────────┘ └──────────┘ └──────────┘                    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    DATA LAYER                                │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │    │
│  │  │PostgreSQL│  │  Redis   │  │   S3-    │  │ pgvector │    │    │
│  │  │(Supabase)│  │ (Cache)  │  │ Compatible│  │(Embeddings)│    │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Component Diagram (C4 Level 3) — Members Module

```
┌─────────────────────────────────────────────────────────────────────┐
│                 MEMBERS MODULE — COMPONENT VIEW                      │
│                                                                     │
│                         ┌────────────────────┐                      │
│                         │  Members Layout    │                      │
│                         │  (Auth Guard)      │                      │
│                         └────────┬───────────┘                      │
│                                  │                                  │
│          ┌───────────────────────┼───────────────────────┐          │
│          ▼                       ▼                       ▼          │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │  Dashboard   │    │   Sidebar Nav    │    │  Mobile Bottom   │   │
│  │  (RSC)       │    │   (Server)       │    │  Nav (Client)    │   │
│  └──────┬───────┘    └──────────────────┘    └──────────────────┘   │
│         │                                                           │
│  ┌──────┴──────────────────────────────────────────────────┐        │
│  │                     DASHBOARD COMPONENTS                 │        │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │        │
│  │  │  Mood    │ │  Streak  │ │  Oracle  │ │ Next App.│   │        │
│  │  │  Tracker │ │  Display │ │  Card    │ │  Card    │   │        │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │        │
│  │  ┌─────────────────────────────────────────────────┐    │        │
│  │  │  Quick Actions Grid (Clases, Podcast, Evolución)│    │        │
│  │  └─────────────────────────────────────────────────┘    │        │
│  │  ┌─────────────────────────────────────────────────┐    │        │
│  │  │  Recently Added (Content preview)               │    │        │
│  │  └─────────────────────────────────────────────────┘    │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   SHARED COMPONENTS                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │    │
│  │  │ Video    │ │ Podcast  │ │ Booking  │ │ MisCitas │       │    │
│  │  │ Player   │ │ Player   │ │ Calendar │ │ Client   │       │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐    │    │
│  │  │ Logout   │ │ Admin    │ │ MoodGraph (Recharts)     │    │    │
│  │  │ Button   │ │ LayoutUI │ │ (NEW for Phase 1)        │    │    │
│  │  └──────────┘ └──────────┘ └──────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.4 Clean Architecture + DDD + Hexagonal — Layer Mapping

```
┌────────────────────────────────────────────────────────────────────┐
│                    CLEAN ARCHITECTURE LAYERS                        │
│                    (Aplicado a NestJS Microservices)                │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PRESENTATION LAYER (Delivery Mechanisms)                    │   │
│  │                                                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │   │
│  │  │ Controllers │  │  GraphQL   │  │  WebSockets│             │   │
│  │  │  (REST)     │  │  Resolvers │  │  (Events)  │             │   │
│  │  └────────────┘  └────────────┘  └────────────┘             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  APPLICATION LAYER (Use Cases / Ports)                       │   │
│  │                                                              │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                  │   │
│  │  │  CreateAppointment│  │  CancelAppointment │                │   │
│  │  │  UseCase          │  │  UseCase           │                │   │
│  │  └────────┬─────────┘  └────────┬─────────┘                  │   │
│  │           │                     │                             │   │
│  │  ┌────────▼─────────────────────▼─────────────────────────┐   │   │
│  │  │  Input Ports (Abstract Interfaces / Repositories)       │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  DOMAIN LAYER (Entities / Value Objects / Domain Events)     │   │
│  │                                                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │Appointment│  │  User   │  │  Content │  │  Service │    │   │
│  │  │(Aggregate)│  │(Aggregate)│ │(Aggregate)│ │(Value Obj)│    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  Domain Services: AppointmentService, BillingService  │    │   │
│  │  │  Domain Events: AppointmentCreated, MoodAlertDetected │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  INFRASTRUCTURE LAYER (Adapters / Output Ports)              │   │
│  │                                                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │Supabase  │  │  Redis   │  │  OpenAI  │  │  Resend  │    │   │
│  │  │Adapter   │  │  Adapter │  │  Adapter │  │  Adapter │    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

### 1.5 SOLID Application

| Principle | Application |
|-----------|-------------|
| **S** — Single Responsibility | Cada microservicio tiene UNA razón de cambio (Auth, Agenda, Content, etc.) |
| **O** — Open/Closed | Agregar nuevos providers (ej: Stripe → MercadoPago) sin modificar use cases |
| **L** — Liskov Substitution | Todos los adaptadores implementan interfaces de puerto |
| **I** — Interface Segregation | Interfaces pequeñas por capacidad (Readable, Writtable, Searchable) |
| **D** — Dependency Inversion | Use cases dependen de interfaces, no de implementaciones concretas |

### 1.6 DDD — Bounded Contexts

| Bounded Context | Ubicación | Aggregates | Domain Events |
|----------------|-----------|------------|---------------|
| **Auth** | `services/auth/` | User, Session | UserRegistered, UserLoggedIn |
| **Agenda** | `services/agenda/` | Appointment, AvailabilityRule, Service | AppointmentCreated, AppointmentCancelled |
| **Content** | `services/content/` | ContentItem, Category | ContentPublished, ContentViewed |
| **Mood** | `services/mood/` | DailyReflection, MoodTrend | MoodLogged, AlertTriggered |
| **Community** | `services/community/` | Post, Comment, Group, Challenge | PostCreated, BadgeAwarded |
| **AI** | `services/ai/` | Recommendation, Insight | InsightGenerated, AlertRaised |
| **Payment** | `services/payment/` | Invoice, Transaction, Subscription | PaymentReceived, SubscriptionExpired |
| **Notification** | `services/notification/` | Notification, Template, Delivery | NotificationSent |

---

## 2. DATA ARCHITECTURE

### 2.1 Complete ERD (Conceptual + Physical)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ANA REIKI — COMPLETE ERD                          │
│                                                                     │
│  ┌────────────┐    ┌────────────────┐    ┌──────────────────┐       │
│  │   auth.users│    │   profiles    │    │ user_preferences  │       │
│  │────────────│    │────────────────│    │──────────────────│       │
│  │ id (PK)    │───▶│ id (PK,FK)     │───▶│ id (PK,FK)       │       │
│  │ email      │    │ email          │    │ notifications_on │       │
│  │ encrypted  │    │ full_name      │    │ email_frequency  │       │
│  │ password   │    │ avatar_url     │    │ theme            │       │
│  └────────────┘    │ role           │    │ language         │       │
│                    │ is_premium     │    │ privacy_level    │       │
│                    │ created_at     │    └──────────────────┘       │
│                    │ updated_at     │                                │
│                    └───────┬────────┘                                │
│                            │                                         │
│         ┌──────────────────┼───────────────┐                        │
│         ▼                  ▼                ▼                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ appointments │  │ daily_       │  │ session_     │               │
│  │              │  │ reflections  │  │ notes        │               │
│  │──────────────│  │──────────────│  │──────────────│               │
│  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │               │
│  │ service_id(FK)│  │ user_id (FK) │  │ user_id (FK) │               │
│  │ consultant_id│  │ mood_score   │  │ admin_id (FK)│               │
│  │ client_id(FK)│  │ intention    │  │ appointment  │               │
│  │ start_time   │  │ created_at   │  │ _id (FK)     │               │
│  │ end_time     │  │ UNIQUE(u,dt) │  │ content      │               │
│  │ status       │  └──────────────┘  │ is_private   │               │
│  │ notes        │                    │ created_at   │               │
│  │ cancelled_*  │                    └──────────────┘               │
│  │ confirmed_*  │                                                   │
│  │ created_at   │    ┌────────────────┐                             │
│  │ updated_at   │    │  notifications │                             │
│  └──────┬───────┘    │────────────────│                             │
│         │            │ id (PK)        │                             │
│  ┌──────┴───────┐    │ user_id (FK)   │                             │
│  │ appointment_ │    │ type           │                             │
│  │ audit_log    │    │ title          │                             │
│  │──────────────│    │ body           │                             │
│  │ id (PK)      │    │ read_at        │                             │
│  │ appointment  │    │ created_at     │                             │
│  │ _id (FK)     │    └────────────────┘                             │
│  │ actor_id     │                                                   │
│  │ action       │    ┌────────────────┐                             │
│  │ from_status  │    │ goals          │                             │
│  │ to_status    │    │────────────────│                             │
│  │ old_start    │    │ id (PK)        │                             │
│  │ new_start    │    │ user_id (FK)   │                             │
│  │ metadata     │    │ title          │                             │
│  │ created_at   │    │ target_date    │                             │
│  └──────────────┘    │ status         │                             │
│                      │ created_at     │                             │
│  ┌──────────────┐    └────────────────┘                             │
│  │ services     │                                                   │
│  │──────────────│    ┌────────────────┐                             │
│  │ id (PK)      │    │ goal_progress  │                             │
│  │ slug         │    │────────────────│                             │
│  │ name         │    │ id (PK)        │                             │
│  │ duration_min │    │ goal_id (FK)   │                             │
│  │ buffer_min   │    │ progress_val   │                             │
│  │ is_active    │    │ note           │                             │
│  │ created_at   │    │ created_at     │                             │
│  └──────┬───────┘    └────────────────┘                             │
│         │                                                            │
│  ┌──────┴───────────────┐   ┌─────────────────────────┐             │
│  │  availability_rules  │   │ availability_exceptions │             │
│  │──────────────────────│   │─────────────────────────│             │
│  │ id (PK)              │   │ id (PK)                 │             │
│  │ consultant_id (FK)   │   │ consultant_id (FK)      │             │
│  │ service_id (FK)      │   │ service_id (FK)         │             │
│  │ day_of_week          │   │ exception_date          │             │
│  │ start_time / end_time│   │ start_time / end_time   │             │
│  │ is_active            │   │ is_available            │             │
│  └──────────────────────┘   │ reason                  │             │
│                             └─────────────────────────┘             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ CONTENT MODULE                                              │        │
│  │  ┌──────────────┐    ┌──────────────────┐                │        │
│  │  │   content    │    │ content_service  │                │        │
│  │  │──────────────│    │──────────────────│                │        │
│  │  │ id (PK)      │    │ content_id (FK)  │                │        │
│  │  │ title        │    │ service_id (FK)  │                │        │
│  │  │ description  │    │ relevance_score  │                │        │
│  │  │ type         │    │ is_featured      │                │        │
│  │  │ external_id  │    └──────────────────┘                │        │
│  │  │ thumbnail_url│                                         │        │
│  │  │ duration     │    ┌──────────────────┐                │        │
│  │  │ is_premium   │    │  content_views   │                │        │
│  │  │ published_at │    │──────────────────│                │        │
│  │  │ created_at   │    │ id (PK)          │                │        │
│  │  │ updated_at   │    │ content_id (FK)  │                │        │
│  │  └──────────────┘    │ user_id (FK)     │                │        │
│  │                      │ viewed_at        │                │        │
│  └──────────────────────┴──────────────────┘                │        │
│                                                              │        │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ COMMUNITY MODULE                                            │        │
│  │  ┌──────────────┐   ┌──────────────┐   ┌────────────┐    │        │
│  │  │   posts      │   │  comments    │   │  groups    │    │        │
│  │  │──────────────│   │──────────────│   │────────────│    │        │
│  │  │ id (PK)      │   │ id (PK)      │   │ id (PK)    │    │        │
│  │  │ user_id (FK) │◀──│ post_id (FK) │   │ name       │    │        │
│  │  │ group_id (FK)│   │ user_id (FK) │   │ description│    │        │
│  │  │ title        │   │ body         │   │ created_by │    │        │
│  │  │ body         │   │ created_at   │   │ is_private │    │        │
│  │  │ created_at   │   │ updated_at   │   └─────┬──────┘    │        │
│  │  │ updated_at   │   └──────────────┘         │           │        │
│  │  │ is_pinned    │                    ┌───────┴───────┐   │        │
│  │  │ is_reported  │                    │ group_members │   │        │
│  │  └──────┬───────┘                    │──────────────│   │        │
│  │         │                            │ group_id (FK)│   │        │
│  │  ┌──────┴───────┐   ┌────────────┐  │ user_id (FK) │   │        │
│  │  │   likes      │   │ challenges │  │ role         │   │        │
│  │  │──────────────│   │────────────│  │ joined_at    │   │        │
│  │  │ post_id (FK) │   │ id (PK)    │  └──────────────┘   │        │
│  │  │ user_id (FK) │   │ title      │                      │        │
│  │  │ created_at   │   │ start_date │   ┌────────────┐    │        │
│  │  └──────────────┘   │ end_date   │   │ badges     │    │        │
│  │                      │ created_by │   │────────────│    │        │
│  │  ┌──────────────┐   └─────┬──────┘   │ id (PK)    │    │        │
│  │  │ user_badges  │         │          │ name       │    │        │
│  │  │──────────────│  ┌──────┴──────┐   │ criteria   │    │        │
│  │  │ user_id (FK) │  │ challenge_  │   │ icon_url   │    │        │
│  │  │ badge_id (FK)│  │ participants│   └────────────┘    │        │
│  │  │ awarded_at   │  │─────────────│                      │        │
│  │  └──────────────┘  │ challenge_id│                      │        │
│  │                     │ user_id (FK)│                      │        │
│  │                     │ progress    │                      │        │
│  │                     │ completed_at│                      │        │
│  │                     └─────────────┘                      │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                     │
│  LEGACY (to be deprecated):                                         │
│  ┌──────────────┐                                                    │
│  │ availability │  ← datos migrados a availability_rules/exceptions │
│  │ (LEGACY)     │    Eliminar en migration 013                      │
│  └──────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Migration Plan (009-013)

| Migration | Descripción | Dependencia | Estado |
|-----------|-------------|-------------|--------|
| 009 | Fix RLS content (service_role → admin), fix profiles update policy | 008 | PENDIENTE |
| 010 | `notifications`, `user_preferences`, `goals`, `goal_progress`, `content_service`, `content_views` | 009 | PENDIENTE |
| 011 | `session_notes` ADD appointment_id FK, ALTER constraints | 010 | PENDIENTE |
| 012 | Community tables: `posts`, `comments`, `likes`, `groups`, `group_members`, `challenges`, `challenge_participants`, `badges`, `user_badges` | 010 | PENDIENTE |
| 013 | Drop legacy `availability`, cleanup deprecated policies, add partitions | 012 | PENDIENTE |

### 2.3 Index Strategy

```sql
-- Performance Critical Indexes (Phase 0)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_client_status 
  ON appointments (client_id, status) WHERE status IN ('pending', 'confirmed');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_consultant_date 
  ON appointments (consultant_id, start_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_reflections_user_date 
  ON daily_reflections (user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_type_premium 
  ON content (type, is_premium, published_at DESC);

-- Full Text Search Indexes (Phase 1)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_search 
  ON profiles USING gin(to_tsvector('spanish', coalesce(full_name,'') || ' ' || email));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_search 
  ON content USING gin(to_tsvector('spanish', title || ' ' || coalesce(description,'')));

-- Time-series Indexes (Phase 2)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_created_month 
  ON appointments (date_trunc('month', created_at));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_reflections_week 
  ON daily_reflections (user_id, date_trunc('week', created_at));

-- Community Indexes (Phase 5)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_group_date 
  ON posts (group_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post 
  ON comments (post_id, created_at ASC);
```

### 2.4 Partitioning Strategy

```sql
-- Partition appointments by month (for 10K+ users)
CREATE TABLE appointments (
  id UUID NOT NULL,
  service_id UUID NOT NULL,
  consultant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE appointments_2026_01 PARTITION OF appointments
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE appointments_2026_02 PARTITION OF appointments
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ... monthly partitions
-- +1 future partition + default partition for safety
```

### 2.5 Data Retention Policy

| Tabla | Retención | Acción | Job |
|-------|-----------|--------|-----|
| appointment_audit_log | 5 años | Archive → Delete | Cron anual |
| daily_reflections | 2 años | Keep (valor terapéutico) | — |
| session_notes | 5 años post-última cita | Archive → Anonymize | Cron trimestral |
| appointments | 3 años post-completed | Anonymize → Keep | Cron trimestral |
| notifications | 90 días | Delete | Cron mensual |
| community_posts | Indefinido | Keep | — |
| community_comments | Indefinido | Keep | — |
| auth.users (inactivos) | 1 año sin login | Soft-delete → Hard-delete | Cron trimestral |
| content_views | 6 meses | Aggregate → Delete raw | Cron semanal |

### 2.6 RLS Complete Matrix

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | OWNER / ADMIN | OWNER | OWNER (except role/premium) | ADMIN |
| appointments | OWNER / ADMIN / CONSULTANT | OWNER (future only, slot available) | OWNER (cancel only) + ADMIN (all) | ADMIN |
| daily_reflections | OWNER / ADMIN | OWNER (once/day) | OWNER | OWNER |
| session_notes | OWNER / ADMIN (public) / OWNER (private) | ADMIN | ADMIN | ADMIN |
| content | AUTHENTICATED | ADMIN (via service_role RPC) | ADMIN (via service_role RPC) | ADMIN |
| services | AUTHENTICATED | ADMIN | ADMIN | ADMIN |
| availability_rules | AUTHENTICATED | ADMIN | ADMIN | ADMIN |
| availability_exceptions | AUTHENTICATED | ADMIN | ADMIN | ADMIN |
| appointment_audit_log | ADMIN | TRIGGER (no direct insert) | — | ADMIN |
| notifications | OWNER | SYSTEM | OWNER (mark read) | OWNER |
| goals | OWNER / ADMIN | OWNER | OWNER | OWNER |
| posts | AUTHENTICATED (public) / MEMBER (private group) | MEMBER | OWNER / MODERATOR | MODERATOR / ADMIN |
| comments | Same as post | MEMBER | OWNER | MODERATOR / ADMIN |
| groups | AUTHENTICATED (public) / MEMBER (private) | ADMIN | ADMIN | ADMIN |
| group_members | SELF | INVITE/REQUEST | — | ADMIN |

---

## 3. SECURITY ARCHITECTURE

### 3.1 OWASP Top 10 — Coverage Matrix

| OWASP | Riesgo | Mitigación en Ana Reiki | Estado |
|-------|--------|------------------------|--------|
| A01:2021 | Broken Access Control | RLS en todas las tablas, RBAC en server actions, admin check en layouts | ✅ |
| A02:2021 | Cryptographic Failures | Auth SSR con cookies HTTP-only, HTTPS forzado (Vercel), passwords hasheadas por Supabase | ✅ |
| A03:2021 | Injection | Supabase parameterized queries, Server Actions validan input, RLS evita SQL injection | ✅ |
| A04:2021 | Insecure Design | Server Components por defecto, no exponer service_role key al cliente | ⚠️ Content insert roto |
| A05:2021 | Security Misconfiguration | Migraciones gestionadas, env vars por Vercel | ⚠️ Admin routes sin middleare |
| A06:2021 | Vulnerable Components | npm audit, dependencias actualizadas (React 19, Next 16) | ⚠️ Sin CI/CD security scan |
| A07:2021 | Auth Failures | Supabase Auth SSR con refresh automático | ✅ |
| A08:2021 | Data Integrity Failures | Exclusion constraint en appointments, triggers de validación | ✅ |
| A09:2021 | Logging Failures | appointment_audit_log implementado | ⚠️ Sin logging centralizado |
| A10:2021 | SSRF | No hacemos fetch a URLs de usuario (solo Spotify embed) | ✅ |

### 3.2 Threat Model (STRIDE)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THREAT MODEL — ANA REIKI                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  THREAT: User escalates to admin via profiles UPDATE                │
│  ─────────────────────────────────────────────────────────────      │
│  STRIDE Category: Elevation of Privilege                            │
│  Component: profiles table RLS policy (Migration 001)               │
│  Risk: CRITICAL → MITIGATED IN MIGRATION 007                       │
│  Residual Risk: LOW (policy now restricts role/premium changes)     │
│  Verification: UPDATE profiles SET role='admin' ROLE=authenticated  │
│                 → debe FALLAR                                       │
│                                                                     │
│  THREAT: Unauthenticated booking create                             │
│  ─────────────────────────────────────────────────────────────      │
│  STRIDE Category: Spoofing                                          │
│  Component: appointments INSERT RLS policy                          │
│  Risk: CRITICAL → MITIGATED                                        │
│  Verification: client_id = auth.uid() forzado en RLS + RPC         │
│                                                                     │
│  THREAT: Double-booking race condition                              │
│  ─────────────────────────────────────────────────────────────      │
│  STRIDE Category: Repudiation                                       │
│  Component: appointments table (concurrent inserts)                 │
│  Risk: HIGH → MITIGATED                                            │
│  Mitigation: exclusion constraint (gist) + trigger validation       │
│                                                                     │
│  THREAT: Admin content upload fails (anon key vs service_role)      │
│  ─────────────────────────────────────────────────────────────      │
│  STRIDE Category: Denial of Service (functionality)                 │
│  Component: admin/contenido/page.tsx + content RLS                  │
│  Risk: CRITICAL → UNMITIGATED                                       │
│  Impact: Admin cannot publish content                               │
│  Fix: Move to server action with service_role client               │
│                                                                     │
│  THREAT: AI hallucination in therapeutic context                    │
│  ─────────────────────────────────────────────────────────────      │
│  STRIDE Category: Information Disclosure / Tampering                │
│  Component: AI Service (Phase 4)                                    │
│  Risk: CRITICAL → MITIGATION PLANNED                                │
│  Mitigation: Guardrails + disclaimer + human review loop            │
│                                                                     │
│  THREAT: User accesses admin panel directly via URL                 │
│  ─────────────────────────────────────────────────────────────      │
│  STRIDE Category: Elevation of Privilege                            │
│  Component: /admin routes in middleware                             │
│  Risk: MEDIUM → UNMITIGATED                                         │
│  Impact: Layout guard runs server-side, but URL is reachable        │
│  Fix: Add admin check to middleware.ts                              │
│                                                                     │
│  THREAT: Personal health data leaked via API                        │
│  ─────────────────────────────────────────────────────────────      │
│  STRIDE Category: Information Disclosure                            │
│  Component: All APIs with PII (session_notes, daily_reflections)    │
│  Risk: CRITICAL → MITIGATED (RLS)                                   │
│  Residual Risk: LOW (RLS policy granular por tabla)                 │
│                                                                     │
│  THREAT: Unauthorized notification send (email/SMS)                 │
│  ─────────────────────────────────────────────────────────────      │
│  STRIDE Category: Spoofing / Tampering                              │
│  Component: Notification service, Resend/Twilio adapters            │
│  Risk: HIGH → MITIGATION PLANNED                                    │
│  Mitigation: Rate limiting + admin-only endpoints + audit log       │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 RBAC Matriz (Role-Based Access Control)

| Módulo | Recurso | VISITOR (anon) | MEMBER (free) | MEMBER (premium) | TERAPEUTA | ADMIN | SYSTEM |
|--------|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| Landing | Páginas públicas | R | R | R | R | R | — |
| Auth | Registro/Login | R | — | — | — | — | — |
| Content | Videos free | — | R | R | R | CRUD | — |
| Content | Videos premium | — | — | R | R | CRUD | — |
| Content | Podcasts | — | R | R | R | CRUD | — |
| Mood | Daily reflections | — | CRUD | CRUD | CRUD | R | — |
| Mood | Gráficas | — | R | R | R | R | — |
| Agenda | Mis citas | — | R | CRUD(own) | CRUD(own) | CRUD(all) | — |
| Agenda | Availability | — | — | — | CRUD(own) | CRUD(all) | — |
| Agenda | All appointments | — | — | — | R(all) | CRUD(all) | — |
| Community | Posts/Comments | — | R | CRUD | CRUD | CRUD | — |
| Community | Groups | — | R | R (join) | R (create) | CRUD | — |
| Community | Moderation | — | — | — | — | CRUD | — |
| AI | Chat | — | — | R | R | R | R |
| AI | Insights | — | — | R | R | R | R |
| Admin | Dashboard | — | — | — | — | R | — |
| Admin | CRM | — | — | — | — | CRUD | — |
| Admin | Content upload | — | — | — | — | CRUD | — |
| Admin | Users | — | — | — | — | CRUD | — |

### 3.4 Pentest Checklist

```
── PENTEST CHECKLIST — ANA REIKI ──────────────────────────────────────

[AUTH]
□ SQL Injection en login/registro (email field)
□ JWT token manipulation (exp, role, app_metadata)
□ Session fixation: robar cookie y reutilizar
□ CSRF en auth endpoints (POST /api/auth/logout)
□ Password policy: mínimo 8 chars, complejidad
□ Rate limiting en login (10 intentos/5 min)
□ Account enumeration (diferente error si email existe)

[RLS & AUTHORIZATION]
□ UPDATE profiles SET role='admin' (debe FALLAR)
□ UPDATE profiles SET is_premium=true (debe FALLAR)
□ GET /admin/* sin auth (debe REDIRECT)
□ POST /api/appointments con client_id de otro usuario (debe FALLAR)
□ Cancelar cita de otro usuario (debe FALLAR)
□ Reprogramar cita pasada (debe FALLAR)
□ Acceder a contenido premium sin membresía (debe FALLAR)

[API & SERVER ACTIONS]
□ Server Action sin auth (llamar directamente)
□ Server Action con parámetros inválidos (XSS, SQLi)
□ Mass assignment en profiles (enviar campos extra)
□ IDOR: cambiar UUID de cita/contenido/usuario
□ Rate limiting en server actions (booking spam)

[COMMUNITY] (Phase 5+)
□ XSS en posts/comentarios (titulo, body)
□ HTML injection en rich text
□ CSRF en create/delete post
□ Privilege escalation en mod roles
□ Spam / flooding prevention

[INFRASTRUCTURE]
□ HTTP headers security (HSTS, CSP, X-Frame-Options)
□ TLS 1.3 configuration
□ Subdomain takeover (si aplica)
□ Open ports scan (si self-hosted)
□ Dependency scan (npm audit, Snyk)
□ Docker image vulnerabilities (si aplica)

[AI] (Phase 4+)
□ Prompt injection en chat IA
□ Data leakage via embeddings
□ Hallucination en contexto terapéutico
□ PII exposure in AI responses
```

### 3.5 Risk Classification

| Risk | Severity | Category | Phase | Owner | Mitigation |
|------|----------|----------|-------|-------|------------|
| RLS content insert broken | CRÍTICO | Security | F0 | CTO | Server action with service_role |
| Admin routes exposed | ALTO | Security | F0 | CTO | Add admin check to middleware |
| No rate limiting | ALTO | Security | F0 | CTO | Implement rate limiting middleware |
| No centralized logging | ALTO | Observability | F0 | DevOps | Sentry + logging service |
| AI hallucination (health) | CRÍTICO | AI Safety | F4 | AI Architect | Guardrails + human review |
| Data privacy compliance | CRÍTICO | Legal | F0 | DPO | Consent + retention policies |
| Offline sync conflicts | ALTO | Mobile | F6 | Mobile Arch | CRDT strategy required |
| Stripe LATAM complexity | ALTO | Payment | F3 | PM | MercadoPago fallback |
| Single point of failure (Ana) | ALTO | Business | ALL | PM | Multi-admin training |
| Cost overrun at scale | MEDIO | FinOps | F7 | CTO | Budget alerts + reserved instances |

---

## 4. AI ARCHITECTURE

### 4.1 RAG Pipeline Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                   ANA REIKI — RAG PIPELINE                           │
│                                                                     │
│  USER QUERY                                                         │
│      │                                                              │
│      ▼                                                              │
│  ┌─────────────────────────────────────┐                            │
│  │         QUERY ENRICHMENT            │                            │
│  │  ┌──────────┐  ┌─────────────────┐  │                            │
│  │  │ Current  │  │ User Context    │  │                            │
│  │  │ Question │  │ (mood, history, │  │                            │
│  │  │          │  │  preferences)   │  │                            │
│  │  └──────────┘  └─────────────────┘  │                            │
│  └────────────────┬────────────────────┘                            │
│                   │                                                 │
│                   ▼                                                 │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                  RETRIEVAL PIPELINE                         │     │
│  │                                                             │     │
│  │  ┌────────────┐   ┌────────────┐   ┌────────────┐         │     │
│  │  │ Embedding  │──▶│ pgvector   │──▶│ Similarity │         │     │
│  │  │ Model      │   │ (Supabase) │   │ Search     │         │     │
│  │  │ (text-     │   │            │   │ (cosine)   │         │     │
│  │  │ embedding  │   │            │   │ LIMIT 5    │         │     │
│  │  │ -3-small)  │   │            │   │            │         │     │
│  │  └────────────┘   └────────────┘   └────────────┘         │     │
│  │                                                             │     │
│  │  KNOWLEDGE BASES:                                           │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │     │
│  │  │Content   │ │Mood      │ │Session   │ │Therapy   │     │     │
│  │  │Transcripts│ │Patterns  │ │Notes     │ │Library   │     │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │     │
│  └──────────────────────────┬─────────────────────────────────┘     │
│                             │                                      │
│                             ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    GENERATION PIPELINE                      │     │
│  │                                                             │     │
│  │  ┌────────────┐   ┌────────────────────────────────────┐    │     │
│  │  │ System     │──▶│  Context + Retrieved Docs + Query  │    │     │
│  │  │ Prompt     │   │  → GPT-4o-mini (cost-optimized)    │    │     │
│  │  └────────────┘   └────────────────┬───────────────────┘    │     │
│  │                                   │                         │     │
│  │  ┌────────────────────────────────▼────────────────────┐    │     │
│  │  │                GUARDRAILS LAYER                      │    │     │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │     │
│  │  │  │No medical│  │Anonymize │  │"Revisado│          │    │     │
│  │  │  │diagnosis │  │PII       │  │por Ana" │          │    │     │
│  │  │  └──────────┘  └──────────┘  └──────────┘          │    │     │
│  │  └─────────────────────────────────────────────────────┘    │     │
│  └──────────────────────────┬─────────────────────────────────┘     │
│                             │                                      │
│                             ▼                                      │
│                    ┌──────────────────┐                             │
│                    │  FINAL RESPONSE  │                             │
│                    │  + Disclaimer    │                             │
│                    └──────────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Vector Database Schema (pgvector)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS content_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- text-embedding-3-small
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_vector 
  ON content_embeddings 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

CREATE TABLE IF NOT EXISTS user_context_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN ('mood_pattern', 'preference', 'goal')),
  context_data JSONB NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_context_user 
  ON user_context_embeddings (user_id, context_type);
```

### 4.3 Prompt Engineering — System Prompt Template

```
# SYSTEM PROMPT — ASISTENTE ANA REIKI IA

Eres un asistente de bienestar que apoya a los consultantes de Ana Murat Reiki.
Tu función es ACOMPAÑAR, no reemplazar el juicio de la terapeuta.

## REGLAS ABSOLUTAS (GUARDRAILS):
1. NUNCA hagas un diagnóstico médico o de salud mental
2. NUNCA recomiendes suspender un tratamiento médico
3. NUNCA prescribas dosis, remedios, o suplementos
4. Si el usuario menciona ideación suicida, autolesión, o crisis: 
   → RESPUESTA AUTOMÁTICA con línea de crisis + derívación a Ana
5. Si no estás segura: di "No tengo suficiente información" y deriva

## CONTEXTO DEL USUARIO:
- Nombre: {user_name}
- Membresía: {plan}
- Mood actual (últimos 7 días): {mood_trend}
- Próxima cita: {next_appointment}
- Último contenido visto: {last_content}
- Metas activas: {goals}

## FORMATO DE RESPUESTA:
- Sea cálida pero profesional
- Use lenguaje español neutral
- Mencione contenido relevante cuando aplique
- Siempre termine con una pregunta o invitación a la acción
- Si es relevante: sugiera agendar una cita con Ana

## DERIVACIÓN:
Cuando detectes que el usuario necesita apoyo humano:
"Esta es una conversación importante. Te recomiendo agendar 
una sesión con Ana para abordarlo en profundidad. ¿Te ayudo 
a buscar un horario disponible?"
```

### 4.4 Guardrails Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GUARDRAILS LAYER — ANTI-HARM                      │
│                                                                     │
│  INPUT GATE:                                                        │
│  ┌──────────────────────────────────────────────────────┐           │
│  │  □ PII detection (emails, phones, DNI) → redact      │           │
│  │  □ Crisis keywords → trigger + derivate              │           │
│  │  □ Medical claims → block + explain                  │           │
│  │  □ Rate limit: 30 msg/hora por usuario               │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                     │
│  OUTPUT GATE:                                                       │
│  ┌──────────────────────────────────────────────────────┐           │
│  │  □ Medical disclaimer appended to every response      │           │
│  │  □ No definitive statements about health conditions   │           │
│  │  □ "Revisado por Ana" tag when clinically relevant    │           │
│  │  □ Toxicity filter (moderation API)                   │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                     │
│  AUDIT GATE:                                                        │
│  ┌──────────────────────────────────────────────────────┐           │
│  │  □ Every conversation logged for Ana's review         │           │
│  │  □ Weekly AI conversation quality report              │           │
│  │  □ User feedback (thumbs up/down) on each response    │           │
│  │  □ Escalation alerts (if user rejects AI advice 3x)   │           │
│  └──────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. COMMUNITY ARCHITECTURE

### 5.1 Gamification System

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GAMIFICATION — POINTS & LEVELS                    │
│                                                                     │
│  ACTIONS → POINTS:                                                  │
│  ┌──────────────────────────────────────────────┐                   │
│  │  Daily login                →  5 pts          │                   │
│  │  Log mood                   →  10 pts         │                   │
│  │  Watch video                →  15 pts         │                   │
│  │  Listen podcast             →  10 pts         │                   │
│  │  Complete weekly challenge  →  50 pts         │                   │
│  │  Attend session             →  100 pts        │                   │
│  │  Post in community          →  20 pts         │                   │
│  │  Comment on post            →  5 pts          │                   │
│  │  Get 5 likes on post        →  25 pts         │                   │
│  │  Refer a friend             →  200 pts        │                   │
│  └──────────────────────────────────────────────┘                   │
│                                                                     │
│  LEVELS:                                                             │
│  ┌──────────┬──────────┬──────────────┬──────────────────────┐      │
│  │ LEVEL    │  POINTS   │  TITLE       │  BENEFIT              │      │
│  ├──────────┼──────────┼──────────────┼──────────────────────┤      │
│  │ 1 (Seed) │ 0-99     │ Semilla      │ Perfil básico        │      │
│  │ 2 (Sprout)│ 100-499 │ Brote        │ Badge en perfil       │      │
│  │ 3 (Bloom)│ 500-1999 │ Flor         │ Descuento 10% próx   │      │
│  │ 4 (Tree) │ 2000-4999│ Árbol        │ Contenido exclusivo  │      │
│  │ 5 (Forest)│ 5000+   │ Bosque       │ 1 sesión gratis/año  │      │
│  └──────────┴──────────┴──────────────┴──────────────────────┘      │
│                                                                     │
│  BADGES:                                                             │
│  ┌──────────────────────────────┬──────────────────────────┐        │
│  │  BADGE                       │  CRITERIA                 │        │
│  ├──────────────────────────────┼──────────────────────────┤        │
│  │  🌅 Mañanera                 │ 7 registros de mood AM   │        │
│  │  🔥 Racha de 7 días          │ Login 7 días seguidos    │        │
│  │  🔥🔥 Racha de 30 días       │ Login 30 días seguidos   │        │
│  │  🔥🔥🔥 Racha de 100 días    │ Login 100 días seguidos  │        │
│  │  📖 Estudiante               │ 10 videos vistos          │        │
│  │  🧘 Yogui                    │ 5 sesiones de yoga       │        │
│  │  💬 Corazón abierto          │ 10 comentarios en foro   │        │
│  │  👑 Embajador                │ 5 referidos exitosos     │        │
│  │  🌟 Primer año               │ 12 meses de membresía    │        │
│  └──────────────────────────────┴──────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Moderation System

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTENT MODERATION FLOW                           │
│                                                                     │
│  USER POSTS                                                         │
│      │                                                              │
│      ▼                                                              │
│  ┌─────────────────────────────────────────────────────┐            │
│  │          AUTOMATED FILTER (AI + Rules)               │            │
│  │                                                     │            │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │            │
│  │  │ Toxicity │  │ Spam     │  │ PII      │          │            │
│  │  │ Check    │──▶ Check   │──▶ Scanner  │          │            │
│  │  │(Moderate)│  │(rate+link)│  │(regex)  │          │            │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘          │            │
│  │       │              │              │                │            │
│  │       ▼              ▼              ▼                │            │
│  │  ┌────┴──────────────┴──────────────┴────┐          │            │
│  │  │  ALL CLEAR → Published                │          │            │
│  │  │  FLAGGED → Pending mod review         │          │            │
│  │  │  BLOCKED → Rejected + user notified  │          │            │
│  │  └───────────────────────────────────────┘          │            │
│  └──────────────────────────┬──────────────────────────┘            │
│                             │                                      │
│                             ▼                                      │
│  ┌─────────────────────────────────────────────────────┐            │
│  │                 MANUAL REVIEW QUEUE                  │            │
│  │  Ana recibe notificación → revisa → approve/reject  │            │
│  │  SLA: <4h hábiles para contenido reportado          │            │
│  └─────────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 KPI Dashboard (Community)

| KPI | Fórmula | Target | Frecuencia |
|-----|---------|--------|------------|
| MAU (Community) | Usuarios únicos que participan/mes | >40% de miembros | Mensual |
| Posts per user | Total posts / MAU | >2/mes | Mensual |
| Reply rate | Posts con al menos 1 reply / Total posts | >60% | Semanal |
| Time to first response | Tiempo promedio hasta reply | <30 min | Semanal |
| Moderation actions | Posts blocked/flagged / Total posts | <5% | Semanal |
| Active groups | Grupos con actividad en 7 días | >80% | Semanal |
| Challenge completion | Completados / Iniciados | >40% | Por challenge |
| User-reported content | Reportes / Total posts | <1% | Mensual |

---

## 6. MOBILE ARCHITECTURE

### 6.1 Offline-First Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OFFLINE-FIRST ARCHITECTURE                        │
│                                                                     │
│  ┌─────────────────────────────────────────────────┐                │
│  │              PRESENTATION LAYER                   │                │
│  │  (React Native Screens — Expo Router)            │                │
│  └─────────────────────┬───────────────────────────┘                │
│                        │                                           │
│  ┌─────────────────────▼───────────────────────────┐                │
│  │               STATE MANAGEMENT                    │                │
│  │  ┌───────────────────────────────────────────┐   │                │
│  │  │   Zustand + TanStack Query (React Query)   │   │                │
│  │  │   → Offline cache via AsyncStorage         │   │                │
│  │  │   → Optimistic updates for mutations       │   │                │
│  │  │   → Background sync when online            │   │                │
│  │  └───────────────────────────────────────────┘   │                │
│  └─────────────────────┬───────────────────────────┘                │
│                        │                                           │
│  ┌─────────────────────▼───────────────────────────┐                │
│  │              SYNC ENGINE                          │                │
│  │                                                   │                │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  │                │
│  │  │ Local DB  │  │ Sync Queue │  │ Conflict   │  │                │
│  │  │(SQLite via │  │(pending    │  │ Resolution │  │                │
│  │  │ expo-sqlite)│  │ mutations) │  │(LWW + CRDT)│  │                │
│  │  └────────────┘  └────────────┘  └────────────┘  │                │
│  │                                                   │                │
│  │  Sync Triggers:                                    │                │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │                │
│  │  │ App      │ │ Periodic │ │ Pull-to- │          │                │
│  │  │ Foreground│ │ (15 min) │ │ Refresh  │          │                │
│  │  └──────────┘ └──────────┘ └──────────┘          │                │
│  └─────────────────────┬───────────────────────────┘                │
│                        │                                           │
│  ┌─────────────────────▼───────────────────────────┐                │
│  │              NETWORK LAYER                        │                │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  │                │
│  │  │ REST API  │  │ WebSocket  │  │ HTTP Cache │  │                │
│  │  │ (NestJS)  │  │ (Real-time)│  │ (ETag)     │  │                │
│  │  └────────────┘  └────────────┘  └────────────┘  │                │
│  └─────────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Push Notification Architecture

```
┌─────────────────────────────────────────────┐
│           NOTIFICATION SERVICE               │
│                                              │
│  TRIGGERS:                                   │
│  ┌─────────────────────────────────────────┐│
│  │  Appointment reminder (24h before)      ││
│  │  New content published                  ││
│  │  Mood streak milestone                  ││
│  │  Community reply                        ││
│  │  Challenge reminder                     ││
│  │  Session feedback request               ││
│  └─────────────────────────────────────────┘│
│                                              │
│  CHANNELS:                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    ││
│  │  Expo    │ │  Email   │ │  SMS     │    ││
│  │  Push    │ │  (Resend)│ │  (Twilio)│    ││
│  └──────────┘ └──────────┘ └──────────┘    ││
│                                              │
│  DELIVERY RULES:                             │
│  ┌─────────────────────────────────────────┐│
│  │  Push: 09:00-21:00 (user timezone)      ││
│  │  Email: 1/day digest or instant          ││
│  │  SMS: Only critical (appointment 1h)    ││
│  │  Max 5 push/day per user                ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

---

## 7. DEVOPS ARCHITECTURE

### 7.1 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE — ANA REIKI                        │
│                                                                     │
│  GITHUB PUSH                                                        │
│      │                                                              │
│      ▼                                                              │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  CI — GitHub Actions                                       │        │
│  │                                                             │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │        │
│  │  │  Lint    │──▶│  Type   │──▶│  Unit    │──▶│  Build   │  │        │
│  │  │  (ESLint)│  │  Check  │  │  Tests   │  │  (Next)  │  │        │
│  │  └──────────┘  └──────────┘  └──────────┘  └────┬─────┘  │        │
│  │                                                   │        │        │
│  │  ┌────────────────────────────────────────────────▼────┐   │        │
│  │  │  Security Scan (npm audit + Snyk + Trivy)           │   │        │
│  │  └─────────────────────────────────────────────────────┘   │        │
│  └──────────────────────────┬──────────────────────────────────┘        │
│                             │                                       │
│                             ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  CD — Vercel (Web) + Docker Registry (Services)            │        │
│  │                                                             │        │
│  │  GIT TAG                                                   │        │
│  │      │                                                     │        │
│  │      ├── v*.*.* → PRODUCTION                              │        │
│  │      │   ├── Web: Vercel Production Deploy                 │        │
│  │      │   ├── Services: K8s apply production manifests      │        │
│  │      │   └── Migrations: Supabase migration apply          │        │
│  │      │                                                     │        │
│  │      └── develop → STAGING                                 │        │
│  │          ├── Web: Vercel Preview Deploy                    │        │
│  │          ├── Services: K8s apply staging manifests         │        │
│  │          └── Migrations: Supabase migration apply (dry-run)│        │
│  └─────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Docker Compose (Local Development)

```yaml
version: '3.8'
services:
  nextjs:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    env_file: .env.local
    depends_on:
      - postgres
      - redis

  nestjs-auth:
    build:
      context: .
      dockerfile: services/auth/Dockerfile
    ports:
      - "4001:4000"
    depends_on:
      - postgres
      - redis

  nestjs-agenda:
    build:
      context: .
      dockerfile: services/agenda/Dockerfile
    ports:
      - "4002:4000"

  nestjs-ai:
    build:
      context: .
      dockerfile: services/ai/Dockerfile
    ports:
      - "4003:4000"

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: anareiki
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: anareiki

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

### 7.3 Kubernetes Production Manifests (Structure)

```
k8s/
├── base/
│   ├── namespaces/
│   │   └── anareiki.yaml
│   ├── configmaps/
│   │   └── app-config.yaml
│   └── secrets/
│       └── app-secrets.yaml (via SealedSecrets / External Secrets)
├── services/
│   ├── web/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   ├── hpa.yaml (min: 3, max: 20, CPU: 70%)
│   │   └── pdb.yaml (minAvailable: 2)
│   ├── auth-service/
│   ├── agenda-service/
│   ├── content-service/
│   ├── community-service/
│   ├── ai-service/
│   ├── notification-service/
│   └── payment-service/
├── infra/
│   ├── postgres/
│   │   └── statefulset.yaml (3 replicas with Patroni)
│   ├── redis/
│   │   └── statefulset.yaml (3 replicas Sentinel)
│   └── rabbitmq/
│       └── statefulset.yaml (for async events)
└── overlays/
    ├── staging/
    │   └── kustomization.yaml
    └── production/
        └── kustomization.yaml (replicas: 5, resources: 2x)
```

### 7.4 Observability Stack

| Component | Herramienta | Propósito |
|-----------|-------------|-----------|
| Metrics | Prometheus + Grafana | CPU, memory, request rate, error rate, latency |
| Logging | Loki + Promtail | Logs centralizados con búsqueda |
| Tracing | OpenTelemetry + Jaeger | Trazas distribuidas entre microservicios |
| Errors | Sentry | Error tracking con source maps |
| Uptime | Checkly / UptimeRobot | Monitor de disponibilidad externo |
| Analytics | Vercel Analytics + PostHog | UX analytics, funnels, heatmaps |
| Alerts | Grafana Alerting + PagerDuty | Notificar en Slack + SMS si hay incidente |
| Dashboards | Grafana | 1 dashboard general + 1 por servicio |

### 7.5 SLA Targets

| Componente | Disponibilidad Objetivo | RPO | RTO |
|------------|------------------------|-----|-----|
| Web App | 99.9% (8.76h downtime/año) | — | 5 min |
| API Services | 99.95% (4.38h downtime/año) | 5 min | 15 min |
| Database | 99.99% (52min downtime/año) | 1 min (sync) | 5 min |
| AI Service | 99.5% (43h downgrade/año) | — | 30 min |
| CDN Assets | 99.99% | — | — |

---

## 8. CLOUD INFRASTRUCTURE

### 8.1 Private Infrastructure Design (Zero External Dependency)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NETWORK TOPOLOGY — PRIVATE INFRA                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │                  PUBLIC INTERNET                          │        │
│  └────────────────────────┬────────────────────────────────┘        │
│                           │                                        │
│  ┌────────────────────────▼────────────────────────────────┐        │
│  │                    CLOUDFLARE                             │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │        │
│  │  │  DNS     │  │  WAF     │  │  CDN     │  │  DDoS    │  │        │
│  │  │  (CNAME) │  │  (OWASP) │  │  (Cache) │  │  Protect │  │        │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │        │
│  └────────────────────────┬────────────────────────────────┘        │
│                           │                                        │
│                           ▼                                        │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │               DMZ (Hetzner / OVH / AWS)                   │        │
│  │                                                           │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐       │        │
│  │  │  Reverse  │  │  VPN     │  │  Bastion Host    │       │        │
│  │  │  Proxy    │  │  (Wire   │  │  (SSO + MFA)     │       │        │
│  │  │  (Caddy/  │  │  Guard)  │  │                  │       │        │
│  │  │  Traefik) │  │          │  │                  │       │        │
│  │  └──────────┘  └──────────┘  └──────────────────┘       │        │
│  └───────────────────────┬─────────────────────────────────┘        │
│                          │                                         │
│                          ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │              PRIVATE NETWORK (10.0.0.0/8)                 │        │
│  │                                                           │        │
│  │  ┌─────────────────────────────────────────────────┐     │        │
│  │  │  KUBERNETES CLUSTER (RKE2 / K3s)                  │     │        │
│  │  │                                                   │     │        │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │     │        │
│  │  │  │  Web     │  │  API     │  │  AI      │        │     │        │
│  │  │  │  Pods    │  │  Pods    │  │  Pods    │        │     │        │
│  │  │  └──────────┘  └──────────┘  └──────────┘        │     │        │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │     │        │
│  │  │  │  Community│  │  Queue   │  │  Jobs    │        │     │        │
│  │  │  │  Pods    │  │  (Rabbit)│  │  (Cron)  │        │     │        │
│  │  │  └──────────┘  └──────────┘  └──────────┘        │     │        │
│  │  └─────────────────────────────────────────────────┘     │        │
│  │                                                           │        │
│  │  ┌─────────────────────────────────────────────────┐     │        │
│  │  │  DATA LAYER                                       │     │        │
│  │  │                                                   │     │        │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │     │        │
│  │  │  │PostgreSQL│  │  Redis   │  │  S3-     │        │     │        │
│  │  │  │(Patroni) │  │(Sentinel)│  │ Compatible│        │     │        │
│  │  │  └──────────┘  └──────────┘  └──────────┘        │     │        │
│  │  │                                                   │     │        │
│  │  │  ┌───────────────────────────────────────────┐    │     │        │
│  │  │  │  Backup Node (Cron + Offsite replication)  │    │     │        │
│  │  │  └───────────────────────────────────────────┘    │     │        │
│  │  └─────────────────────────────────────────────────┘     │        │
│  └─────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Provider Comparison

| Aspecto | Hetzner | OVH | AWS | Azure | GCP |
|---------|---------|-----|-----|-------|-----|
| **3 nodes (4 vCPU, 16GB RAM, 160GB SSD)** | €90/mes | €120/mes | €450/mes | €500/mes | €475/mes |
| **Managed PostgreSQL** | €35/mes | €50/mes | €200/mes | €220/mes | €190/mes |
| **S3-compatible Storage (1TB)** | €10/mes | €15/mes | €23/mes | €25/mes | €20/mes |
| **Bandwidth (10TB)** | Incluido | Incluido | €90/mes | €85/mes | €80/mes |
| **Load Balancer** | €15/mes | €18/mes | €25/mes | €25/mes | €20/mes |
| **Total estimado mensual** | **~€150** | **~€203** | **~€788** | **~€855** | **~€785** |
| **Total anual** | **~€1,800** | **~€2,436** | **~€9,456** | **~€10,260** | **~€9,420** |
| **Data centers LATAM** | ❌ No | ✅ SP | ✅ BR/SP | ✅ BR | ✅ BR/SP |
| **Kubernetes managed** | ❌ No (RKE2) | ✅ (Managed) | ✅ (EKS) | ✅ (AKS) | ✅ (GKE) |
| **Setup complexity** | Media (DIY K8s) | Baja | Alta | Alta | Media |
| **Support** | Community | 24/7 Business | 24/7 Enterprise | 24/7 Enterprise | 24/7 Enterprise |
| **Best for** | MVP + Scale (cost) | LATAM users | Enterprise | Enterprise | Enterprise |

**RECOMENDACIÓN: Hetzner + Cloudflare**

| Fase | Infraestructura | Costo/mes | Justificación |
|------|-----------------|-----------|--------------|
| MVP (F0-F1) | 1 Hetzner VPS (CX51) + Supabase | ~€50 | Todo en un servidor + Supabase managed |
| 100 users (F2-F3) | 3 Hetzner VPS (K3s cluster) + Supabase | ~€150 | K8s para servicios, Supabase para DB |
| 1K users (F4-F5) | 5 Hetzner VPS + Managed DB | ~€350 | Separar servicios + escalar DB |
| 10K users (F6-F7) | 10 Hetzner VPS + Patroni + Redis cluster | ~€800 | Alta disponibilidad + sharding |

### 8.3 Services that MUST stay internal vs OPTIONAL external

```
── MUST BE PRIVATE (Self-hosted) ──────────────────────────────────────
□ PostgreSQL (data sovereignty + GDPR)
□ Redis (cache + rate limiting)
□ MinIO (S3-compatible storage for content)
□ RabbitMQ (async messaging)
□ Monitoring stack (Prometheus + Grafana + Loki)

── CAN BE EXTERNAL (SaaS) ────────────────────────────────────────────
■ Supabase Auth (replaceable with NextAuth/Auth0)
□ Supabase DB (replaceable with self-hosted PostgreSQL)
□ Cloudinary (replaceable with MinIO + FFmpeg)
□ Vercel (replaceable with self-hosted Next.js)
□ Resend (replaceable with self-hosted Mailpit → SMTP)
□ OpenAI (replaceable with local LLM — Mistral, Llama)
□ Stripe (replaceable with MercadoPago)
□ Twilio (replaceable with local SMS gateway)
□ Vercel Analytics (replaceable with PostHog self-hosted)

── OPTIONAL ENHANCEMENTS ─────────────────────────────────────────────
■ Spotify embed (alternativa: self-hosted audio)
■ Google Calendar API (alternativa: CalDAV)
■ Google Fonts (alternativa: self-hosted)
```

### 8.4 Zero Trust Model

```
── ZERO TRUST ARCHITECTURE ────────────────────────────────────────────

NEVER TRUST, ALWAYS VERIFY:

1. Every request → Authenticate (MFA for admin)
2. Every request → Authorize (RBAC check)
3. Every request → Encrypt (mTLS between services)
4. Every request → Audit (log + trace ID)
5. Every access → Least privilege (just-in-time for admin)

── NETWORK SEGMENTATION ─────────────────────────────────────────────

ZONE 1 (PUBLIC):        DMZ — Reverse proxy, WAF, CDN
ZONE 2 (APPLICATION):   K8s cluster — Web pods, API pods, AI pods
ZONE 3 (DATA):          Database nodes, Redis, Storage
ZONE 4 (MANAGEMENT):    Bastion, CI/CD runners, Monitoring
ZONE 5 (BACKUP):        Backup server (air-gapped, encrypted)

── FIREWALL RULES ────────────────────────────────────────────────────

□ Zone 1 → Zone 2: Allow 443 (reverse proxy → ingress)
□ Zone 1 → Zone 2: Allow 22 (bastion → management, strict IP)
□ Zone 2 → Zone 3: Allow 5432 (api → postgres)
□ Zone 2 → Zone 3: Allow 6379 (api → redis)
□ Zone 3 → Zone 4: Allow 9100 (postgres → monitoring)
□ Zone 1 → Zone 4: DENY ALL
□ Zone 5 → All: DENY ALL (backup only initiates outbound)
□ All zones → Internet: Allow outbound (restricted by policy)
```

---

## 9. SaaS BUSINESS ANALYTICS

### 9.1 Unit Economics

```
── UNIT ECONOMICS — ANA REIKI ─────────────────────────────────────────

CAC (Customer Acquisition Cost):

┌─────────────────────────────────────┬────────────┬──────────┐
│ Canal                               │ CPA/Lead   │ Conv.%   │ CAC      │
├─────────────────────────────────────┼────────────┼──────────┼──────────┤
│ Instagram orgánico                  │ $0.00      │ 15%      │ $0.00    │
│ WhatsApp referral                   │ $0.00      │ 40%      │ $0.00    │
│ Google Ads (branded)                │ $2.50      │ 8%       │ $31.25   │
│ Meta Ads (lookalike)                │ $3.00      │ 6%       │ $50.00   │
│ SEO orgánico                        │ $0.00      │ 3%       │ $0.00    │
│ Influencer/terapeuta referral       │ $50.00     │ 50%      │ $100.00  │
├─────────────────────────────────────┼────────────┼──────────┼──────────┤
│ BLENDED CAC                         │            │          │ ~$35     │
└─────────────────────────────────────┴────────────┴──────────┴──────────┘

LTV (Lifetime Value) por Plan:

┌────────────────────┬────────┬──────────┬─────────┬───────────────┐
│ Plan               │ ARPU   │ Churn/Mo │ Avg Life│ LTV           │
├────────────────────┼────────┼──────────┼─────────┼───────────────┤
│ Free               │ $0     │ 30%      │ 3.3 mo  │ $0            │
│ Basic ($9.99)      │ $9.99  │ 8%       │ 12.5 mo │ $124.87       │
│ Premium ($19.99)   │ $19.99 │ 5%       │ 20 mo   │ $399.80       │
│ VIP ($49.99)       │ $49.99 │ 3%       │ 33 mo   │ $1,649.67     │
│ Avg blended        │ $14.99 │ 6%       │ 16.6 mo │ ~$250         │
└────────────────────┴────────┴──────────┴─────────┴───────────────┘

LTV/CAC Ratio: $250 / $35 = 7.1x ✅ (Saludable: >3x es bueno)

MRR Projection:

┌──────────┬────────┬────────┬─────────┬──────────────┐
│ Mes      │ Usuarios│ Free   │ Basic   │ Premium/VIP  │ MRR       │
├──────────┼────────┼────────┼─────────┼──────────────┼──────────┤
│ Month 1  │ 50     │ 35     │ 10      │ 5            │ $200      │
│ Month 3  │ 200    │ 130    │ 50      │ 20           │ $899      │
│ Month 6  │ 500    │ 300    │ 140     │ 60           │ $2,598    │
│ Month 12 │ 1,500  │ 800    │ 450     │ 250          │ $8,998    │
│ Month 18 │ 3,000  │ 1,500  │ 950     │ 550          │ $20,490   │
│ Month 24 │ 5,000  │ 2,300  │ 1,600   │ 1,100        │ $40,490   │
│ Month 36 │ 10,000 │ 4,000  │ 3,300   │ 2,700        │ $100,980  │
└──────────┴────────┴────────┴─────────┴──────────────┴──────────┘

ARR (Annual Recurring Revenue):

┌──────────┬───────────┐
│ Año 1    │ ~$60,000  │
│ Año 2    │ ~$360,000 │
│ Año 3    │ ~$1,200,000 │
└──────────┴───────────┘
```

### 9.2 Feature-to-Plan Mapping

| Módulo | Función | Free | Basic | Premium | VIP |
|--------|---------|:----:|:-----:|:-------:|:---:|
| **Auth** | Registro/login | ✅ | ✅ | ✅ | ✅ |
| **Perfil** | Datos básicos | ✅ | ✅ | ✅ | ✅ |
| **Mood** | Tracker básico | ✅ | ✅ | ✅ | ✅ |
| **Mood** | Gráficas de tendencia | ❌ | ✅ | ✅ | ✅ |
| **Mood** | IA predictiva | ❌ | ❌ | ✅ | ✅ |
| **Content** | 1 clase muestra | ✅ | ✅ | ✅ | ✅ |
| **Content** | Biblioteca completa | ❌ | ✅ | ✅ | ✅ |
| **Content** | Contenido premium exclusivo | ❌ | ❌ | ✅ | ✅ |
| **Content** | Cursos avanzados | ❌ | ❌ | $ | ✅ |
| **Agenda** | Ver disponibilidad | ❌ | ✅ | ✅ | ✅ |
| **Agenda** | Reservar cita | ❌ | ✅ (1/mes) | ✅ (2/mes) | ✅ (ilimitado) |
| **Agenda** | Reprogramar | ❌ | ✅ | ✅ | ✅ |
| **Notif** | Email recordatorio | ❌ | ✅ | ✅ | ✅ |
| **Notif** | Push notifications | ❌ | ❌ | ✅ | ✅ |
| **Notif** | SMS recordatorio | ❌ | ❌ | ❌ | ✅ |
| **IA** | Chat terapéutico | ❌ | ❌ | ✅ | ✅ |
| **IA** | Plan semanal personalizado | ❌ | ❌ | ✅ | ✅ |
| **IA** | Insights dashboard | ❌ | ❌ | ❌ | ✅ |
| **Comunidad** | Leer foros | ✅ | ✅ | ✅ | ✅ |
| **Comunidad** | Publicar/Comentar | ❌ | ❌ | ✅ | ✅ |
| **Comunidad** | Grupos privados | ❌ | ❌ | ❌ | ✅ |
| **Comunidad** | Eventos en vivo | ❌ | ❌ | $ | ✅ |
| **Mobile** | App nativa | ✅ | ✅ | ✅ | ✅ |
| **Mobile** | Offline downloads | ❌ | ❌ | ✅ | ✅ |
| **Mobile** | Widget mood | ❌ | ✅ | ✅ | ✅ |
| **Sesiones** | Sesión 1:1 | $ | $ | 1/mes incl. | 4/mes incl. |
| **Soporte** | Prioridad | ❌ | ❌ | ❌ | ✅ (24h) |

### 9.3 Revenue Optimization Levers

| Palanca | Impacto | Implementación | Timeline |
|---------|---------|----------------|----------|
| Free → Basic conversion | +20% MRR | Email nurturing sequence | Fase 1 |
| Basic → Premium upgrade | +15% MRR | Content gating + prompt | Fase 1 |
| Annual plan discount (20%) | +30% LTV | Annual billing option | Fase 2 |
| Referral program | -40% CAC | "Invita y gana 1 mes" | Fase 1 |
| Session upsell post-mood dip | +10% revenue | AI trigger | Fase 4 |
| Corporate plan | +25% MRR | Sales outreach | Fase 3 |
| Marketplace commissions | +10% revenue | Phase 7 | Fase 7 |

---

## 10. FINOPS — COST ANALYSIS

### 10.1 Cost by Provider and Scale

```
── COST COMPARISON: HETZNER + CLOUDFLARE (RECOMMENDED) ──────────────

COMPONENT            MVP (50u)    100 users    1K users    10K users
──────────────────────────────────────────────────────────────────────
Compute (K8s)         €40          €90          €250        €600
PostgreSQL            €35          €70          €120        €240
Redis                 Included     €15          €30         €60
Storage (S3/MinIO)    €5           €10          €25         €60
Bandwidth             Included     Included     Included    €30
Load Balancer         €5           €10          €20         €40
Cloudflare (Pro)      $20          $20          $20         $200
CDN (Cloudflare)      Included     Included     Included    Included

Subtotal (Hetzner)    ~€100        ~€210        ~€460       ~€1,220
                       + $20 CF     + $20 CF     + $20 CF    + $200 CF

── COST COMPARISON: AWS (ALTERNATIVE) ────────────────────────────────

COMPONENT            MVP (50u)    100 users    1K users    10K users
──────────────────────────────────────────────────────────────────────
EC2 (3 x t3a.medium)  ~$110        ~$110        ~$220        ~$440
EKS control plane     $0           $0           $73          $73
RDS PostgreSQL        $15          $30          $110         $650
ElastiCache Redis     $15          $30          $60          $150
S3 + CloudFront       $5           $10          $25          $60
ALB                   $20          $20          $25          $30
DataTransfer           ~$5          ~$10         ~$50         ~$200

Subtotal (AWS)        ~$170        ~$210        ~$563        ~$1,603

── COST COMPARISON: OVH (LATAM-FRIENDLY) ─────────────────────────────

COMPONENT            MVP (50u)    100 users    1K users    10K users
──────────────────────────────────────────────────────────────────────
Compute                €50          €120         €280         €650
Managed DB             €45          €90          €150         €300
Redis                  €10          €15          €30          €60
Storage                €5           €10          €25          €50
Bandwidth              Included     Included     Included      €25
Load Balancer          €10          €15          €25          €40

Subtotal (OVH)        ~€120        ~€250        ~€510        ~€1,125

── EXTERNAL SERVICES (ALL PROVIDERS) ─────────────────────────────────

SERVICE               MVP          100 users    1K users     10K users
──────────────────────────────────────────────────────────────────────
OpenAI (GPT-4o-mini)   $5           $20          $100         $500
Cloudinary             $0 (free)    $89 (Basic)  $249 (Plus)  $499 (Adv)
Resend                 $0 (free)    $30 (Pro)    $100 (Team)  $250 (Scale)
Twilio                 $0 (test)    $50          $200         $500
Sentry                 $0 (free)    $26 (Team)   $80 (Busi)   $160 (Ent)

Subtotal ext.          ~$5          ~$215        ~$729        ~$1,909

── TOTAL MONTHLY COST ────────────────────────────────────────────────

SCALE          HETZNER+CF       OVH+CF       AWS+CF
─────────────  ──────────────   ──────────   ───────
MVP (50u)      ~$125/mes        ~$145/mes     ~$195/mes
100 users      ~$445/mes        ~$485/mes     ~$445/mes  ← AWS competitive here
1K users       ~$1,209/mes      ~$1,259/mes   ~$1,312/mes
10K users      ~$3,349/mes      ~$3,254/mes   ~$3,732/mes ← OVH wins LATAM

── RECOMMENDATION ─────────────────────────────────────────────────────

PHASE 0-2 (MVP → 100 users):  Hetzner + Cloudflare + Supabase
  → Total: ~$150-250/mes
  → Fastest setup, lowest cost

PHASE 3-4 (100 → 1K users):    Hetzner + Cloudflare (self-host DB)
  → Total: ~$600-800/mes
  → K3s cluster + Patroni PostgreSQL

PHASE 5-7 (1K → 10K users):    OVH (LATAM DC) + Cloudflare
  → Total: ~$2,000-3,500/mes
  → Latency matters + OVH has SBG/MXP data centers
```

### 10.2 Cost Distribution Diagram

```
COST DISTRIBUTION — 10K USERS (Hetzner + Cloudflare + External)

                    ┌─────────────────────────────────┐
                    │  TOTAL: ~$3,349/mes              │
                    ├─────────────────────────────────┤
                    │                                 │
                    │  ██████████████░░ 40% External   │  ($1,909)
                    │    Services (API costs)          │
                    │                                 │
                    │  ██████████░░░░ 26% Compute      │  ($1,220)
                    │    (K8s nodes + DB)              │
                    │                                 │
                    │  ████████░░░░░░ 20% Data         │  ($960)
                    │    (PostgreSQL, Redis, Storage)  │
                    │                                 │
                    │  ██░░░░░░░░░░░░ 9% Network      │  ($300)
                    │    (Bandwidth, LB, DNS, CDN)     │
                    │                                 │
                    │  █░░░░░░░░░░░░░ 5% Monitoring   │  ($80)
                    │    (Sentry, Grafana, Prometheus) │
                    └─────────────────────────────────┘

COST OPTIMIZATION LEVERS:
┌──────────────────────────────────────────────────────────────┐
│  1. Reserved instances (Hetzner: 30% off on 1yr commit)     │
│  2. Spot instances for AI batch jobs                         │
│  3. Cache hit ratio > 80% on Cloudflare CDN                 │
│  4. PostgreSQL read replicas for analytics (not prod)       │
│  5. Content compression + WebP/AVIF for video thumbnails    │
│  6. Archive old data to cold storage (S3 Glacier)          │
│  7. GPT-4o-mini → fine-tuned model after 6mo of data       │
│     (est: reduce AI costs by 60%)                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. DATA PRIVACY

### 11.1 Regulatory Framework

```
── REGULATORY SCOPE ───────────────────────────────────────────────────

PRIMARY (binding):
  □ Argentina — Ley 25.326 de Protección de Datos Personales
  □ Argentina — Disposición 10/2008 (medidas de seguridad)
  □ LATAM — Marco Civil da Internet (Brasil, si aplica)

SECONDARY (best effort):
  □ GDPR (UE) — Si hay usuarios europeos
  □ LGPD (Brasil) — Si hay usuarios brasileños
  □ CCPA (California) — Si hay usuarios de California

── DATA CLASSIFICATION ────────────────────────────────────────────────

CATEGORY A — IDENTIDAD (Retención: 2 años post-cierre)
  □ DNI / Pasaporte
  □ Dirección física
  □ Fecha de nacimiento
  □ Teléfono
  □ Email
  → Nivel de protección: ALTO

CATEGORY B — TERAPÉUTICOS (Retención: 5 años post-última sesión)
  □ Notas de sesión clínica
  □ Registros de mood (daily_reflections)
  □ Intenciones diarias
  □ Historial de citas y diagnósticos referidos
  □ Conversaciones con IA
  → Nivel de protección: MÁXIMO (datos sensibles)

CATEGORY C — USO (Retención: 6 meses agregado, 24 meses raw)
  □ Contenido visto (content_views)
  □ Tiempo en plataforma
  □ Interacciones en comunidad
  □ Historial de login
  → Nivel de protección: BAJO (anonimizable)

── DATA FLOW MAP ──────────────────────────────────────────────────────

CONSENTIMIENTO:
  □ Registro: "Acepto términos y política de privacidad" (check obligatorio)
  □ Cookies: Banner con opciones (necesarias, analytics, marketing)
  □ Datos terapéuticos: Consentimiento explícito separado al crear perfil
  □ Marketing: Opt-in separado (no por defecto)

TRAZABILIDAD:
  □ Cada acceso a datos personales → audit_log
  □ Cada exportación → audit_log + notificación al usuario
  □ Cada modificación de datos sensibles → audit_log + registro de quién
  □ Las tablas de categoría A+B tienen updated_at + updated_by

ANONIMIZACIÓN:
  □ Datos de uso (Categoría C) → anonimizar después de 24 meses
  □ Datos para ML → solo datos agregados, nunca PII
  □ Reportes públicos → siempre agregados, N>5 para publicar
```

### 11.2 Consentimiento y Políticas

```
── CONSENT FORM — REGISTRO ────────────────────────────────────────────

"Al crear tu cuenta en Ana Reiki aceptas:
1. [OBLIGATORIO] Términos de Servicio
2. [OBLIGATORIO] Política de Privacidad (incluye tratamiento de datos personales y terapéuticos)
3. [OPCIONAL] Recibir emails semanales con contenido de bienestar
4. [OPCIONAL] Participar en estudios de efectividad terapéutica (datos agregados y anonimizados)

Puedes revocar tu consentimiento en cualquier momento desde Configuración > Privacidad."

── RETENTION SCHEDULE ─────────────────────────────────────────────────

| Data Type        | Active    | Archive     | Delete       | Anonymize  |
|------------------|-----------|-------------|--------------|------------|
| Personal data    | While user| +2 years    | After archive| —          |
| Therapeutic data | While user| +5 years    | After archive| —          |
| Usage data (raw) | 24 months | —           | After 24mo   | After 6mo  |
| Audit logs       | 12 months | +4 years    | After 5yr    | After 12mo |
| Community posts  | Indefinite| —           | On user req  | —          |
| Chat history     | 12 months | +3 years    | After 4yr    | After 6mo  |

── USER RIGHTS (subject access request) ───────────────────────────────

□ RIGHT TO KNOW: "Qué datos tienen sobre mí?" → Dashboard export (CSV/JSON)
□ RIGHT TO RECTIFY: Editar perfil, solicitar corrección de notas
□ RIGHT TO DELETE: "Olvídenme" → Anonymize or delete (except legal hold)
□ RIGHT TO PORT: Exportar todos mis datos (incluyendo notes, reflections)
□ RIGHT TO WITHDRAW: Revocar consentimiento de datos terapéuticos

SLA for SAR: 10 días hábiles (Argentina Law 25.326: 10 días)
```

---

## 12. ROADMAPS + QUICK WINS

### 12.1 Roadmap 12 meses (Fase 0 → Fase 3)

```
MES 1-2:    FUNDACIÓN (Sprint 1-2)
  ├── Fix RLS + seguridad → Day 1-5
  ├── Types alineados → Day 3-7
  ├── Error boundaries → Day 5-10
  ├── Quick Win: Admin sube contenido ✅ (semana 1)
  ├── Quick Win: Fix logout + stalls ✅ (semana 2)
  └── Test suite setup → Day 10-14

MES 3-4:    PANEL CLIENTES 2.0 (Sprint 3-5)
  ├── Quick Win: Reprogramar citas (backend listo, solo UI) ✅ (semana 1)
  ├── Quick Win: Gráfica de mood (datos ya existen) ✅ (semana 2)
  ├── Perfil de usuario → Semana 2-3
  └── Timeline unificado → Semana 4-6

MES 5-6:    CRM TERAPÉUTICO (Sprint 6-8)
  ├── Quick Win: Dashboard admin con KPIs ✅ (semana 1)
  ├── Quick Win: Ficha consultante (datos ya existen) ✅ (semana 2)
  ├── Notas de sesión vinculadas → Semana 2-4
  └── Email marketing → Semana 5-6

MES 7-8:    AGENDA INTELIGENTE (Sprint 9-11)
  ├── Quick Win: Pasarela de pago ✅ (semana 1 - MVP con Stripe)
  ├── Multi-consultante → Semana 2-4
  ├── Google Calendar sync → Semana 4-6
  └── Waitlist + Recordatorios → Semana 6-8

MES 9-12:   REVENUE GROWTH (Sprint 12-24 se extiende)
  ├── Onboarding automation
  ├── Email nurturing sequences
  ├── Referral program
  └── Analytics dashboard + reporting
```

### 12.2 Roadmap 24 meses (Fase 4 → Fase 6)

```
MES 13-16:  IA TERAPÉUTICA (Sprint 12-15)
  ├── pgvector setup + embeddings → Semana 1-2
  ├── Chat IA básico → Semana 3-6
  ├── Predicción de tendencia → Semana 5-8
  └── Plan personalizado semanal → Semana 7-8

MES 17-19:  COMUNIDAD (Sprint 16-18)
  ├── Foros + comentarios → Semana 1-3
  ├── Gamificación básica → Semana 3-5
  └── Eventos en vivo → Semana 5-6

MES 20-22:  APPS MÓVILES (Sprint 19-22)
  ├── Expo setup + auth → Semana 1-2
  ├── Dashboard + Mood → Semana 2-4
  ├── Push notifications → Semana 4-5
  └── App Store + Play Store → Semana 7-8

MES 23-24:  INTEGRACIÓN Y RETENCIÓN
  ├── Offline mode completo
  ├── Widgets + watch app
  ├── Annual billing push
  └── Enterprise plan pilot
```

### 12.3 Roadmap 36 meses (Fase 7 + Expansión)

```
MES 25-28:  ESCALA Y OPTIMIZACIÓN
  ├── Performance audit + tuning
  ├── Infra migration to OVH Latam
  ├── Test coverage >80%
  └── Penetration test + DRP

MES 29-32:  MARKETPLACE TERAPEUTA
  ├── White-label CRM for therapists
  ├── Multi-terapeuta onboarding
  ├── Payments split (Ana + terapeuta)
  └── Terapeuta directory + reviews

MES 33-36:  PLATAFORMA GLOBAL
  ├── English/Portuguese version
  ├── B2B Corporate wellness
  ├── API pública para integraciones
  └── IPO prep / Series A fundraising
```

### 12.4 Quick Wins — Impact/Effort Matrix

```
HIGH IMPACT / LOW EFFORT → DO NOW (Semana 1-2):

┌─────────────────────────────────────────────────────────────────────┐
│  QW │ Acción                          │ Impacto      │ Esfuerzo     │
│─────┼─────────────────────────────────┼──────────────┼──────────────│
│  1  │ Fix content insert (RLS bug)    │ Admin funciona│ 1 día        │
│  2  │ Reprogramar citas UI            │ Feature completa│ 2 días     │
│  3  │ Gráfica de mood (datos existen)  │ Engagement +30%│ 2 días     │
│  4  │ Regenerar types de DB            │ +100% accuracy│ 1 día       │
│  5  │ Error boundaries (5 rutas)      │ UX +50%       │ 2 días       │
│  6  │ Perfil de usuario (edit name/av)│ Feature nueva │ 2 días       │
│  7  │ Dashboard admin KPIs            │ Admin visibilidad│ 2 días    │
│  8  │ Email recordatorio de cita      │ Churn -10%    │ 3 días       │
└─────────────────────────────────────────────────────────────────────┘

HIGH IMPACT / HIGH EFFORT → PLAN (Sprint 3+):

┌─────────────────────────────────────────────────────────────────────┐
│  QW │ Acción                          │ Impacto      │ Esfuerzo     │
│─────┼─────────────────────────────────┼──────────────┼──────────────│
│  9  │ Timeline unificado              │ Retención +20%│ 5 días       │
│ 10  │ Chat IA básico                  │ Premium conv  │ 10 días      │
│ 11  │ Stripe/MercadoPago pagos        │ Revenue +100% │ 8 días       │
│ 12  │ Push notifications mobile       │ Engagement    │ 8 días       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 13. MASTER BUILDER — BLOCKER ESCALATION

### 13.1 Staff Engineer: Status Check

```
── MASTER BUILDER — READINESS CHECK ───────────────────────────────────

RELEASE MANAGER STATUS: ❌ NOT READY (Score: 34%)

BLOCKERS IDENTIFIED:
  1. OPERATIONAL: Documents exist but implementation 0%
  2. CONTRADICTION: "Never write code" vs "Build the system"
     → Resolver: ¿Autoriza escritura de código o solo planificación?
  3. MISSING: OpenAPI 3.1 spec (6 modules) — diseño de APIs
  4. MISSING: Wireframes/Design System — experiencia de usuario validada
  5. MISSING: Infrastructure provisioned — sin servidores

── PREREQUISITES FOR BUILDING ─────────────────────────────────────────

BEFORE WRITING CODE, CONFIRM:

□ 1. ¿Se autoriza escritura de código? (Contradicción con "Nunca programar")
□ 2. ¿Se parte de la base existente (Next.js 16) o se migra a NestJS?
□ 3. ¿Supabase es definitivo o se migrará a PostgreSQL self-hosted?
□ 4. ¿Vercel es definitivo o se migrará a Hetzner/OVH?
□ 5. ¿Se implementa con Server Components existentes o se reescribe?
□ 6. Prioridad: ¿Estabilizar (Fase 0) o nuevas features (Fase 1)?

── PLAN DE CONSTRUCCIÓN (SI SE AUTORIZA) ──────────────────────────────

MÓDULOS AUTOCONTENIDOS:

services/                    packages/              apps/
├── auth/                    ├── shared/            ├── web/
│   ├── src/                 │   ├── types/         │   ├── src/
│   │   ├── domain/          │   ├── utils/         │   │   ├── app/
│   │   ├── application/     │   └── validators/    │   │   ├── components/
│   │   ├── infrastructure/  └── contracts/         │   │   └── lib/
│   │   └── interface/                              └── mobile/
├── agenda/                                           └── (Expo app)
├── content/
├── community/
├── ai/
├── payment/
└── notification/

CADA MÓDULO INCLUYE:
  □ Domain (entities, value objects, domain events)
  □ Application (use cases, ports, DTOs)
  □ Infrastructure (adapters, repositories, external APIs)
  □ Interface (controllers, request/response schemas)
  □ Tests (unit, integration, e2e)
  □ Migration (DB changes if needed)
  └── Dockerfile (self-contained container)

── REQUEST FOR DECISION ───────────────────────────────────────────────

Se requiere decisión sobre:
  1. ¿Código autorizado? (Y/N)
  2. ¿Stack definitivo? (Current Next.js-only vs NestJS microservices)
  3. ¿Infra target? (Vercel vs Hetzner vs OVH)
  4. ¿Arrancar con Fase 0? (Yes — recommended)

── FIRMA ──────────────────────────────────────────────────────────────

Staff Engineer Full Stack
2026-05-30
Status: BLOCKED — Awaiting decision on contradictory instructions
```
