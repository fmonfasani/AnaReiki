# Booking Matrix — Reserva de Turnos

## Variables

| Variable | Opciones | Impacto |
|----------|----------|---------|
| **Auth** | logged_in / not_logged_in | Redirige a login si no auth |
| **Servicios** | 1 solo / múltiples | Modo simple auto-skips si hay 1 |
| **Modalidad** | online / presencial / ambas | Modo simple auto-skips si hay 1 |
| **Precio** | free / paid / deposit | Determina flujo de pago y estado |
| **Depósito** | 0% / 50% / 100% | 0 → pago completo, 50% → seña + saldo, 100% → pago total como depósito sin aprobación |
| **Disponibilidad** | hay slots / no hay slots / slot lleno | Bloquea fecha/horario |
| **Regla** | rule_id presente / ausente | Asigna consultant_id distinto |
| **Pago** | success / failure / pending | Callback de MP |
| **Modo UI** | normal / simple | Solo cambia frontend |
| **Notas** | con notas / sin notas | Campo opcional |

## Matriz de Combinaciones

### 1. Autenticación
```
                    ┌─ logged_in ──→ flujo normal
Usuario ────────────┤
                    └─ not_logged_in → middleware → /login?redirect=...
```

### 2. Selección de Servicio
```
                    ┌─ 1 servicio ──→ auto-select (modo simple)
Servicios ──────────┤
                    └─ múltiples ──→ step de selección
```

### 3. Selección de Modalidad
```
                    ┌─ 1 modalidad ──→ auto-select (modo simple)
Modalidad ──────────┤
                    └─ 2 modalidades → step de selección
```

### 4. Pricing → Status Flow (la más importante)

```
                  ┌─ price = 0 ─────────────────────→ status: "pending" → confirmed
                  │                                    (sin pago, confirmación directa)
                  │
price_cents ──────┼─ deposit = 0% ──────────────────→ status: "pending_payment" → confirmed
                  │                                    (pago completo, MP callback)
                  │
                  └─ deposit > 0% ─────┬── deposit < 100% → status: "pending_approval"
                                        │                     (seña pagada, espera aprobación)
                                        │                     approval: "pending_approval"
                                        │                     balance > 0
                                        │
                                        └── deposit = 100% → status: "pending_approval"
                                              (depósito = pago total)
                                              balance = 0
                                              ¿needsApproval? → false si balance = 0
```

### 5. Flujo Completo de Estados

```
FREE:     pending ───→ confirmed (email automático)
          (sin pago)

PAID:     pending_payment ───→ MP callback success ──→ confirmed (email automático)
          (pago completo)
          
DEPOSIT:  pending_approval ───→ deposit paid (MP) ──→ pending_approval (espera)
                │                                          payment_status: "paid"
                │
                ├── owner aprueba ──→ approved ──→ client paga balance ──→ confirmed
                │                      (balance_cents > 0)     (MP callback type "balance")
                │
                ├── owner rechaza (refund) ──→ cancelled + refund_processed
                │
                └── owner rechaza (reschedule) ──→ cancelled (reprogramar)
                
OVERDUE:  approved ───→ cutoff_at passed ──→ cancelled (cron reminders)
          (no pagó el balance a tiempo)
```

### 6. Flujo de Pago (MP)

```
                ┌── success ──→ POST /api/appointments/confirm-payment
                │                 ├── full payment → status: confirmed
                │                 ├── deposit → status: pending_approval (mismo)
MP callback ────┼── failure ──→ status: pending_payment (reintentar)
                │
                └── pending ──→ status: pending_payment (esperar webhook)
```

### 7. Validaciones

| # | Validación | Input | Expected |
|---|-----------|-------|----------|
| 1 | Sin auth | user=null | 401 |
| 2 | Falta service_id | {} | 400 |
| 3 | Falta modality | {service_id} | 400 |
| 4 | Falta slot_start | {service_id, modality} | 400 |
| 5 | Service_id inválido (no UUID) | "bad" | 400 |
| 6 | Slot start inválido | "bad-date" | depende de validación |
| 7 | Slot no disponible (otro horario) | slot_start no exists | 409 |
| 8 | Slot completo | booked >= max | 409 |
| 9 | Servicio no existe | service_id random | 404 |
| 10 | Modalidad no permitida | modality wrong | 400 |
| 11 | MP preference falla | createPaymentPreference error | 500 |
| 12 | Éxito servicio free | price=0 | 201 + status:pending |
| 13 | Éxito servicio paid | price>0 | 201 + status:pending_payment + mp_init_point |
| 14 | Éxito con depósito | deposit>0 | 201 + status:pending_approval + mp_init_point |
| 15 | Con rule_id | rule_id provided | consultant_id from rule |
| 16 | Sin rule_id | rule_id null | consultant_id from owner |
| 17 | Con notas | notes provided | saved in DB |
| 18 | Sin notas | notes null/undefined | NULL in DB |

### 8. Matriz de Cobertura de Tests

| Test Case | Auth | Price | Deposit | Slots | Expected Status | Priority |
|-----------|------|-------|---------|-------|-----------------|----------|
| T1 | No | - | - | - | 401 | 🔴 crítica |
| T2 | Sí | 0 | 0% | available | 201 pending | 🔴 crítica |
| T3 | Sí | >0 | 0% | available | 201 pending_payment + mp | 🔴 crítica |
| T4 | Sí | >0 | 50% | available | 201 pending_approval + mp | 🟡 alta |
| T5 | Sí | any | any | no slots | 409 | 🟡 alta |
| T6 | Sí | any | any | full | 409 | 🟡 alta |
| T7 | Sí | any | any | - | 404 service | 🟡 alta |
| T8 | Sí | any | any | - | 400 modality | 🟢 media |
| T9 | Sí | any | any | - | 500 mp fail | 🟢 media |
| T10 | - | - | - | - | 400 missing fields | 🟢 media |

### 9. E2E Scenarios

| # | Escenario | Pasos | Expected |
|---|-----------|-------|----------|
| E1 | Usuario nuevo reserva servicio free | 1. Registro → 2. Ir a reservar → 3. Elegir servicio → 4. Elegir fecha → 5. Elegir horario → 6. Confirmar | Turno confirmado, email recibido |
| E2 | Usuario reserva servicio pagado | 1. Login → 2. Seleccionar servicio pago → 3. Fecha → 4. Horario → 5. Pagar con MP | Redirige a MP, vuelve, turno confirmado |
| E3 | Usuario sin cuenta intenta reservar | 1. Click "Reservá tu turno" → 2. Login/Registro | Redirige a login, después a booking |
| E4 | Modo Simple: 1 servicio | 1. Login → 2. Activar Modo Simple → 3. Elegir fecha → 4. Elegir horario → 5. Confirmar | 3-4 clicks total |
| E5 | Slot se llena antes de confirmar | 1. Elegir horario → 2. Esperar → 3. Confirmar | Error "Ya no está disponible" |
| E6 | Depósito: flujo completo | 1. Reservar con depósito → 2. Pagar seña → 3. Admin aprueba → 4. Pagar saldo | Turno confirmado |
| E7 | Depósito: admin rechaza | 1. Reservar con depósito → 2. Pagar seña → 3. Admin rechaza con refund | Turno cancelado, devolución |
| E8 | Cutoff de saldo | 1. Reserva aprobada → 2. No pagar saldo → 3. Pasa cutoff | Turno cancelado automático |
| E9 | Pago falla | 1. Pagar con MP → 2. Cancelar en MP → 3. Volver | Turno en pending_payment, botón reintentar |
| E10 | Reprogramar | 1. Turno confirmado → 2. Reprogramar → 3. Nueva fecha/hora | Turno actualizado, email enviado |
