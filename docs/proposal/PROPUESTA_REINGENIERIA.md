# Propuesta Reingeniería — Sistema de Turnos + RBAC

## 1. Roles (4 perfiles)

| Rol | Descripción | Puede borrar | Aprueba cambios sensibles |
|-----|-------------|:------------:|:-------------------------:|
| **usuario** | Consultante final. Reserva turnos, accede a contenido | ❌ | ❌ |
| **gerente** | Manejo del negocio: servicios, disponibilidad, promos, turnos | ❌ | ❌ (solicita a owner) |
| **admin** | Técnico super admin. Acceso completo a todo | ✅ | ❌ (turnos/pagos requieren owner) |
| **owner** | Dueño. Control total, sin restricciones | ✅ | ✅ (único que aprueba) |

Cambios considerados **sensibles** (requieren aprobación del owner):
- Modificar/eliminar turnos ya confirmados
- Cambiar precios de servicios o promos
- Reembolsos/cancelaciones con devolución
- Modificar roles de usuarios

## 2. Sistema de Disponibilidad (reemplaza `availability_slots`)

### Tabla: `availability_rules`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | |
| day_of_week | INT | 0=Domingo..6=Sábado, o null para fecha específica |
| specific_date | DATE | Para excepciones / fechas puntuales |
| start_time | TIME | Inicio de la franja (ej: 10:00) |
| end_time | TIME | Fin de la franja (ej: 15:00) |
| duration_minutes | INT | Duración de cada sesión (ej: 60) |
| modality | ENUM | `'online'`, `'presencial'`, `'both'`, `'mixta'` |
| session_type | ENUM | `'individual'`, `'group'`, `'both'` |
| max_participants | INT | Cupo máximo (para grupales) |
| max_online | INT | Cupo online (para mixta) |
| max_presencial | INT | Cupo presencial (para mixta) |
| service_id | UUID FK | null = usuario elige libremente |
| is_active | BOOL | |
| created_by | UUID FK | Quien creó la regla |

**Generación automática de slots:** Cuando el usuario pide turnos para una fecha, el sistema:
1. Busca reglas para ese día (day_of_week o specific_date)
2. Calcula cantidad de slots: `(end_time - start_time) / duration_minutes`
3. Para cada slot, verifica si ya hay turnos ocupados
4. Devuelve solo los slots libres

### Flujo de reserva (simplificado):

```
1. Seleccionar FECHA
2. Sistema muestra franjas disponibles (ej: 10:00, 11:00, 14:00, 15:00)
3. Seleccionar FRANJA → sistema muestra config de esa regla:
   - Modalidades disponibles (online/presencial/ambas)
   - Tipo (individual/grupal)
4. Si es INDIVIDUAL:
   - Elegir SERVICIO (si la regla no lo bloquea)
   - Elegir MODALIDAD
5. Si es GRUPAL:
   - Elegir SERVICIO (si no está bloqueado)
   - Elegir MODALIDAD
   - Indicar cantidad de participantes (≤ max)
6. Confirmar reserva
```

## 3. Promociones

### Tabla: `promotions`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | |
| name | TEXT | "6x4 Reiki + Yoga Online" |
| description | TEXT | |
| total_sessions | INT | Ej: 6 |
| paid_sessions | INT | Ej: 4 |
| price_cents | INT | Precio total en centavos |
| allowed_tiers | TEXT[] | `['prana']`, `['shakti']`, `['ananda']`, `['shakti','ananda']`, `['all']` |
| is_active | BOOL | |
| created_at | TIMESTAMPTZ | |

### Tabla: `promotion_sessions`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | |
| promotion_id | UUID FK | |
| day_of_week | INT | Día de la semana (0-6) |
| start_time | TIME | Horario |
| duration_minutes | INT | |
| service_id | UUID FK | Servicio asignado a esta sesión |
| modality | ENUM | `'online'`, `'presencial'`, `'mixta'` |
| session_type | ENUM | `'individual'`, `'group'` |
| max_participants | INT | |

### Tabla: `promo_purchases`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK | Quién compró |
| promotion_id | UUID FK | |
| remaining_sessions | INT | Sesiones restantes (decrementa al usar) |
| status | ENUM | `'active'`, `'completed'`, `'cancelled'` |
| mp_preference_id | TEXT | ID de MP |
| payment_status | ENUM | `'pending'`, `'approved'`, `'rejected'` |
| created_at | TIMESTAMPTZ | |

## 4. Permisos RBAC

```
                    usuario   gerente   admin    owner
──────────────────────────────────────────────────────
TURNOS
  crear propio        ✅        ✅       ✅       ✅
  ver propios         ✅        ✅       ✅       ✅
  ver todos           ❌        ✅       ✅       ✅
  cancelar propio     ✅        ✅       ✅       ✅
  cancelar/editar     ❌        ❌       ⚠️(apr)  ✅
  confirmar           ❌        ✅       ✅       ✅
  completar           ❌        ✅       ✅       ✅

DISPONIBILIDAD
  crear reglas        ❌        ✅       ⚠️(apr)  ✅
  editar reglas       ❌        ✅       ⚠️(apr)  ✅
  eliminar reglas     ❌        ❌       ❌       ✅

SERVICIOS
  ver                 ✅        ✅       ✅       ✅
  crear               ❌        ✅       ✅       ✅
  editar              ❌        ✅       ✅       ✅
  eliminar            ❌        ❌       ✅       ✅

PROMOCIONES
  crear               ❌        ✅       ⚠️(apr)  ✅
  editar              ❌        ✅       ⚠️(apr)  ✅
  eliminar            ❌        ❌       ❌       ✅
  comprar             ✅        ✅       ✅       ✅

PERFILES
  ver propio          ✅        ✅       ✅       ✅
  editar propio       ✅        ✅       ✅       ✅
  ver todos           ❌        ✅       ✅       ✅
  cambiar rol         ❌        ❌       ❌       ✅

PASARELA DE PAGOS
  configurar          ❌        ❌       ❌       ✅
  ver transacciones   ❌        ✅       ✅       ✅
  reembolsar          ❌        ❌       ⚠️(apr)  ✅

⚠️(apr) = requiere aprobación del owner
```

## 5. Implementación RBAC: `checkAccess()`

Una sola función en `src/lib/auth/permissions.ts`:

```ts
checkAccess(userId: string, resource: string, action: string): Promise<boolean>
```

Usada en:
- API routes (via middleware o inline)
- Server actions
- Layouts/páginas (Server Components)
- Middleware

**Sin tabla extra** — los permisos se definen en código (TypeScript Map). Así es mantenible, tipado, y no requiere joins a DB por cada check.

## 6. Pasarela de Pagos

| Feature | Descripción |
|---------|-------------|
| Suscripciones | MP `preapproval` — Prana (gratis), Shakti ($99), Ananda ($199) |
| Promos sueltas | MP `preference` (pago único) — cualquier usuario puede comprar |
| Promos exclusivas | Filtro por `allowed_tiers`: si comprador no tiene la suscripción requerida, se rechaza |
| Control acceso | User compra promo → se crea `promo_purchases`. Al reservar, si la sesión es parte de una promo comprada, descuenta de `remaining_sessions` |

---

## Próximos pasos si aprobás

1. Migration 020: tablas `availability_rules`, `promotions`, `promotion_sessions`, `promo_purchases` + tipos enum
2. Feature flag: desactivar `availability_slots` viejo, activar nuevo sistema
3. API REST: CRUD rules, promos, promo_purchases
4. Wizard de reserva: adaptado al nuevo flujo
5. Admin: RuleManager, PromoManager
6. Refactor permisos: `checkAccess()` + reemplazar todos los `isAdmin/checkAdmin/checkOwner`
7. Pasarela: integración MP para promos
