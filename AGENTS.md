## Goal
Construir y deployar plataforma SaaS completa de Ana Reiki: landing, CRM terapéutico, área de consultantes, agenda inteligente, sistema de citas v2, suscripciones, admin full, con reingeniería de roles y turnos planificada.

## Constraints & Preferences
- UX en español (es-AR).
- DB migrations numeradas (001→022, próxima 023).
- Sin SDK externo de pagos — MP vía API directa.
- 3 tiers: Prana (free), Shakti ($99/mes), Ananda ($199/mes).
- Roles actuales: `owner`, `admin`, `gerente`, `consultante`.
- RLS con `is_admin_user()` (admin+owner) e `is_owner_user()` (solo owner) SECURITY DEFINER.
- Deploy: VPS Hetzner, Docker + nginx host + Let's Encrypt, `anamurat.online`.
- OAuth MP para multi-cliente escalable (única app developer, cada cliente autoriza).

## Progress
### Done
- **Notificaciones email**: `src/lib/email.ts` con templates HTML (confirmación, cancelación, reprogramación, notificación admin). Integrado en POST, cancel y reschedule de appointments. **Pendiente**: verificar dominio Resend (DNS Namecheap) para entrega.
- **Auth hardening**: `src/lib/supabase/middleware.ts` verifica rol admin/owner en rutas `/admin`.
- **Reminders automáticos**: `/api/reminders` refactorizado — usa `CRON_SECRET` + service_role + `expire_old_approvals()`. Cron job en VPS activo cada 8 AM.
- **Tests**: 165 tests, 0 failing.
- **Deploy en producción**: Código en GitHub → build + deploy automático en VPS. Site live `anamurat.online` (HTTP 200).
- **MP OAuth configurado**: `MP_CLIENT_ID=8753327212563967` y `MP_CLIENT_SECRET=2ZIeh15jCv05t3X5NlLTPZ3zLU7PDtPz` verificados en container.
- **Migration 020** (`mp_credentials`): Ejecutada en Supabase Dashboard.
- **Migration 021** (`pending_approvals` + rol `gerente`): Ejecutada en Supabase Dashboard.
- **Roles TypeScript**: `isAdmin()` retorna true para admin y owner. Nueva función `isOwner()`. Admin layout bug corregido. check-role route actualizado.
- **Owner asignado**: `fmonfasani@gmail.com` rol cambiado de admin a owner.
- **MP OAuth button UI**: Banner "Conectar Mercado Pago" en `/admin/pagos`.
- **Agenda reingeniería (Fase 1)**: Migration 022 `availability_rules_v2` + slot generation functions (`get_available_slots_v2`, `count_available_slots_v2`, `get_available_dates_v2`) + data migration desde v1. Sin breaking changes (strangler fig).
- **Agenda reingeniería (Fase 2)**: API CRUD admin para `availability_rules_v2` (`GET/POST /api/admin/availability/rules`, `PUT/DELETE /api/admin/availability/rules/[id]`).
- **Agenda reingeniería (Fase 3)**: `GET /api/availability` migrado a `get_available_slots_v2()` con soporte `from`/`to` para DatePicker.
- **Agenda reingeniería (Fase 4)**: `POST /api/appointments` ya no requiere `slot_id` — acepta `slot_start` + `rule_id`, valida vía RPC. BookingWizard, TimeSlots, BookingConfirm, BookingConfirmation actualizados al nuevo Slot type (`slot_start`, `slot_end`, `rule_id`, `max_participants`, `booked`).
- **Directorio consultantes mejorado**: Checkboxes para selección múltiple, botón "Copiar emails" al portapapeles, "Exportar CSV", columna de tags y rol visibles.
- **Email Marketing mejorado**: Filtro por tags en formulario de envío, historial de campañas con dashboard de estadísticas en `/admin/email-marketing`.
- **Sistema de Promos**: Migration 023 (`promotions`, `promotion_sessions`, `promo_purchases`, `email_campaigns`). Admin UI en `/admin/promos` con CRUD, activar/desactivar, filtro por tiers. Sidebar actualizado.

### Resolved (prev. Blocked)
- ~~**MP OAuth connect**: El endpoint `/api/mercadopago/oauth/link` devuelve error "MP OAuth no configurado".~~ → **Resuelto**. Era del build anterior (commit pre-`809f968`). Verificado: `MP_CLIENT_ID` y `MP_CLIENT_SECRET` seteados, 5 tokens activos en DB, expiración Dic 2026, auth URL generada correctamente. El owner (Ana) ya conectó con éxito.

## Key Decisions
- **OAuth sobre token directo**: Escalable multi-cliente. Una app developer, cada cliente autoriza vía link. Token refrescable (180 días).
- **4 roles definitivos**: `consultante`, `gerente` (negocio, sin borrar), `admin` (técnico, cambios sensibles requieren owner), `owner` (control total).
- **Disponibilidad por reglas**: `availability_rules_v2` reemplaza `availability_slots`. Reglas semanales (day_of_week) o específicas (specific_date) con modality, session_type, duration. Slots generados dinámicamente por `get_available_slots_v2()`.
- **Strangler fig pattern**: Tablas viejas (`availability_slots`, `availability_rules` v1, `availability_exceptions`, `availability`) siguen funcionando junto a `availability_rules_v2`. Se deprecarán en migration futura.
- **Permisos en código TypeScript**: `isAdmin()` y `isOwner()` desde `@/lib/auth/roles`.
- **Promos**: Tablas `promotions` + `promotion_sessions` + `promo_purchases`. Pago único vía MP preference. Filtro por `allowed_tiers`.

## Next Steps
1. Separar DM de Comunidad (tablas + API + migración de datos existentes).
2. Sistema de Foros (categorías, temas, posts, likes, bookmarks).
3. Sistema de Comentarios polimórfico (biblioteca, podcast, videos, clases).
4. Sidebar Admin y Consultante reorganizados.
5. Agenda reingeniería Fase 5: Admin RuleManager UI.
6. Agenda reingeniería Fase 6: Cleanup tablas viejas.
7. User: verificar dominio Resend en Namecheap.
8. User: testear checkout MP con cuenta diferente.

## Deploy — VPS Hetzner

### Conexión SSH
```bash
Host/IP: 89.167.96.239
User: root
Port: 22
Key (local): C:\Users\fmonfasani\.ssh\id_ed25519_anareiki
Connect: ssh root@89.167.96.239
Config local (C:\Users\fmonfasani\.ssh\config):
  Host 89.167.96.239
    IdentityFile ~/.ssh/id_ed25519_anareiki
    User root
```

### Repositorio en VPS
```bash
Path: /infra/projects/0008-anareiki
Origin: https://github.com/fmonfasani/AnaReiki.git
Branch: main
```

### Containers (Docker Compose)
```bash
Compose file: /infra/projects/0008-anareiki/docker-compose.yml
Network: anareiki-network (bridge)

Services:
  web:   anareiki-web (0008-anareiki-web:latest)
         Port: 127.0.0.1:31008 → 3000
         Limits: 0.5 CPU / 256M
         Env: .env.production
  nginx: anareiki-nginx (nginx:alpine)
         Port: 80:80, 443:443
         NOTA: Actualmente lo maneja Coolify, no este compose.
         Si hay que deployar cambios de nginx, ver Coolify primero.
  certbot: anareiki-certbot (certbot/certbot)
         NOTA: También lo maneja Coolify.
```

### Ambiente
- **Dominio**: anamurat.online
- **SSL**: Let's Encrypt (vía Coolify)
- **DB**: Supabase (no local)
- **Uploads**: Docker volume `anareiki_uploads`
- **Coolify**: Corre en el mismo VPS (puerto 8080) y maneja nginx+SSL global

### Comando de deploy manual
```bash
cd /infra/projects/0008-anareiki
git pull origin main
docker compose build web
docker compose up -d --no-deps web
sleep 10
curl -sf http://localhost:3000/api/health
```

### Deploy automático (GitHub Actions)
- **Workflow**: `.github/workflows/deploy.yml`
- **Trigger**: Push a `main`
- **Action**: appleboy/ssh-action con secrets:
  - `SSH_HOST`: 89.167.96.239
  - `SSH_USER`: root
  - `SSH_PRIVATE_KEY`: clave github-actions en authorized_keys
- **Script remoto**: git pull → build web → up -d --no-deps web

### Variables de entorno (producción)
Archivo: `/infra/projects/0008-anareiki/.env.production`
```env
NEXT_PUBLIC_SUPABASE_URL=<set>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<set>
SUPABASE_SERVICE_ROLE_KEY=<set>
RESEND_API_KEY=<set>
MERCADO_PAGO_ACCESS_TOKEN=<set>
MP_CLIENT_ID=8753327212563967
MP_CLIENT_SECRET=2ZIeh15jCv05t3X5NlLTPZ3zLU7PDtPz
OPENAI_API_KEY=<set>
NEXT_PUBLIC_SITE_URL=https://anamurat.online
CRON_SECRET=<set>
```

### Health check
```bash
curl -sI https://anamurat.online/api/health
curl -sI http://localhost:31008/api/health
```

### Logs
```bash
docker compose logs web --tail 50 -f
docker compose logs nginx --tail 50
```

### Procedimiento rápido (decime "deployalo")
Cuando el usuario pida deployar:
1. Verificar que los cambios están commiteados y pusheados a `origin/main`
2. SSH a la VPS
3. Ejecutar el deploy manual
4. Verificar health endpoint
5. Confirmar al usuario

## Relevant Files
- `supabase/migrations/022_availability_rules.sql`: Tabla `availability_rules_v2`, enums extendidos, funciones de slot generation, data migration desde v1.
- `src/app/api/admin/availability/rules/route.ts`: GET (list rules), POST (create rule)
- `src/app/api/admin/availability/rules/[id]/route.ts`: PUT (update), DELETE (solo owner)
- `src/app/api/availability/route.ts`: Endpoint público — usa `get_available_slots_v2()` / `get_available_dates_v2()`.
- `src/app/api/appointments/route.ts`: POST sin slot_id — acepta `slot_start` + `rule_id`, valida vía RPC.
- `src/app/consultantes/reservar/BookingWizard.tsx`: Slot type actualizado, POST con `slot_start`.
- `src/app/consultantes/reservar/TimeSlots.tsx`: Slot type actualizado, filtro por `booked < max_participants`.
- `src/app/consultantes/reservar/BookingConfirm.tsx`: Slot type actualizado con `startLabel`/`endLabel`.
- `src/app/consultantes/reservar/BookingConfirmation.tsx`: Slot type actualizado.
- `supabase/migrations/020_mp_oauth.sql`: Tabla `mp_credentials` + RLS
- `supabase/migrations/021_pending_approvals.sql`: Tabla `pending_approvals` + funciones + rol `gerente`
- `src/lib/mercadopago-oauth.ts`: OAuth utilities
- `src/app/api/mercadopago/oauth/link/route.ts`: GET → redirect a MP auth
- `src/app/api/mercadopago/oauth/callback/route.ts`: GET code → token → guarda en DB
- `src/app/api/mercadopago/oauth/status/route.ts`: GET → { connected, mp_user_id, is_expired }
- `src/app/api/reminders/route.ts`: Cron job + `expire_old_approvals()`
- `src/lib/auth/roles.ts`: `isAdmin()` (admin+owner) + `isOwner()`
- `src/app/api/auth/check-role/route.ts`: Endpoint reconoce owner como admin
- `docs/proposal/PROPUESTA_REINGENIERIA.md`: Propuesta completa RBAC + turnos + promos
