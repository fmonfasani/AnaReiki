import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendAppointmentEmail: vi.fn(), notifyAdminNewAppointment: vi.fn() }));
vi.mock("@/lib/mercadopago", () => ({
  createPaymentPreference: vi.fn().mockResolvedValue({
    id: "pref-123",
    init_point: "https://mp.com/pay/123",
  }),
}));

async function callRoute(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/appointments/route");
  const req = new Request("http://localhost:3000/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const SLOT_START = "2026-06-15T14:00:00.000Z";

function makeChain(returns: Record<string, unknown>) {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => chain),
    maybeSingle: vi.fn(() => chain),
  };
  Object.assign(chain, returns);
  return chain;
}

function ok(data: unknown) {
  return { data, error: null };
}

function err(msg: string) {
  return { data: null, error: { message: msg } };
}

describe("POST /api/appointments", () => {
  let currentUser: { id: string; email?: string };

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: "user-123", email: "test@test.com" };

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockImplementation(() => Promise.resolve({ data: { user: currentUser } })) },
    } as never);
  });

  // T1: Sin auth
  it("T1 — 401 si no está autenticado", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never);

    const res = await callRoute({});
    expect(res.status).toBe(401);
  });

  // T10: Faltan campos
  it("T10 — 400 si faltan campos requeridos", async () => {
    vi.mocked(createServiceClient).mockReturnValue({ rpc: vi.fn(), from: vi.fn() } as never);

    const res = await callRoute({ modality: "online", slot_start: SLOT_START });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Faltan campos");
  });

  // Helper para el caso feliz
  function setupHappyPath(overrides: Record<string, unknown> = {}) {
    const service = {
      name: "Reiki",
      duration_minutes: 60,
      allowed_modalities: ["online", "presencial"],
      price_cents: 5000,
      price_cents_online: 5000,
      price_cents_presencial: 5000,
      deposit_percentage: 0,
      ...overrides,
    };

    const svc: any = {
      rpc: vi.fn().mockResolvedValue(ok([{
        rule_id: VALID_UUID,
        slot_start: SLOT_START,
        slot_end: "2026-06-15T15:00:00.000Z",
        modality: "online",
        max_participants: 1,
        booked: 0,
      }])),
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "services") return makeChain({ single: vi.fn().mockResolvedValue(ok(service)) });
        if (table === "profiles") return makeChain({ maybeSingle: vi.fn().mockResolvedValue(ok({ id: "owner-123" })) });
        if (table === "appointments") return makeChain({
          single: vi.fn().mockResolvedValue(ok({ id: "appt-123", status: "pending_payment", price_cents: 5000 })),
          eq: vi.fn().mockResolvedValue(ok(null)),
        });
        return makeChain({ single: vi.fn().mockResolvedValue(ok(service)) });
      }),
    };
    vi.mocked(createServiceClient).mockReturnValue(svc);
    return svc;
  }

  it("T5 — 409 si el horario no está disponible", async () => {
    const svc: any = { rpc: vi.fn().mockResolvedValue(ok([])), from: vi.fn() };
    vi.mocked(createServiceClient).mockReturnValue(svc);

    const res = await callRoute({ service_id: VALID_UUID, modality: "online", slot_start: SLOT_START });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("ya no está disponible");
  });

  it("T6 — 409 si el slot está lleno", async () => {
    const svc: any = {
      rpc: vi.fn().mockResolvedValue(ok([{
        rule_id: VALID_UUID, slot_start: SLOT_START, slot_end: "2026-06-15T15:00:00.000Z",
        modality: "online", max_participants: 1, booked: 1,
      }])),
      from: vi.fn(),
    };
    vi.mocked(createServiceClient).mockReturnValue(svc);

    const res = await callRoute({ service_id: VALID_UUID, modality: "online", slot_start: SLOT_START });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("cupo");
  });

  it("T7 — 404 si el servicio no existe", async () => {
    const svc: any = {
      rpc: vi.fn().mockResolvedValue(ok([{
        rule_id: VALID_UUID, slot_start: SLOT_START, slot_end: "2026-06-15T15:00:00.000Z",
        modality: "online", max_participants: 1, booked: 0,
      }])),
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "services") return makeChain({ single: vi.fn().mockResolvedValue(err("Not found")) });
        return makeChain();
      }),
    };
    vi.mocked(createServiceClient).mockReturnValue(svc);

    const res = await callRoute({ service_id: VALID_UUID, modality: "online", slot_start: SLOT_START });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Servicio no encontrado");
  });

  it("T8 — 400 si la modalidad no está permitida", async () => {
    const svc: any = {
      rpc: vi.fn().mockResolvedValue(ok([{
        rule_id: VALID_UUID, slot_start: SLOT_START, slot_end: "2026-06-15T15:00:00.000Z",
        modality: "online", max_participants: 1, booked: 0,
      }])),
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "services") return makeChain({ single: vi.fn().mockResolvedValue(ok({
          name: "Reiki", duration_minutes: 60, allowed_modalities: ["presencial"],
          price_cents_online: 5000, price_cents_presencial: 5000, deposit_percentage: 0,
        })) });
        return makeChain();
      }),
    };
    vi.mocked(createServiceClient).mockReturnValue(svc);

    const res = await callRoute({ service_id: VALID_UUID, modality: "online", slot_start: SLOT_START });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Modalidad no permitida");
  });

  it("T2 — servicio free → 201 pending", async () => {
    setupHappyPath({ price_cents: 0, price_cents_online: 0, price_cents_presencial: 0 });
    const res = await callRoute({ service_id: VALID_UUID, modality: "online", slot_start: SLOT_START });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.requires_payment).toBe(false);
  });

  it("T3 — servicio paid → 201 pending_payment + mp", async () => {
    setupHappyPath({ deposit_percentage: 0 });
    const res = await callRoute({ service_id: VALID_UUID, modality: "online", slot_start: SLOT_START });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.requires_payment).toBe(true);
    expect(body.mp_init_point).toBeTruthy();
  });

  it("T4 — con depósito → 201 pending_approval + mp", async () => {
    setupHappyPath({ deposit_percentage: 50 });
    const res = await callRoute({ service_id: VALID_UUID, modality: "online", slot_start: SLOT_START });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.requires_payment).toBe(true);
    expect(body.mp_init_point).toBeTruthy();
  });

  it("S1 — ignora price_cents enviado por el cliente (siempre usa el de DB)", async () => {
    setupHappyPath({ price_cents: 5000 });
    const res = await callRoute({
      service_id: VALID_UUID, modality: "online", slot_start: SLOT_START,
      price_cents: 0, // intento de manipulación
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.price_cents).toBe(5000);
    expect(body.requires_payment).toBe(true);
  });

  it("T9 — 500 si MP falla", async () => {
    vi.mocked(createServiceClient).mockReturnValue({
      rpc: vi.fn().mockResolvedValue(ok([{
        rule_id: VALID_UUID, slot_start: SLOT_START, slot_end: "2026-06-15T15:00:00.000Z",
        modality: "online", max_participants: 1, booked: 0,
      }])),
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "services") return makeChain({ single: vi.fn().mockResolvedValue(ok({
          name: "Reiki", duration_minutes: 60, allowed_modalities: ["online"],
          price_cents: 5000, price_cents_online: 5000, price_cents_presencial: 5000, deposit_percentage: 0,
        })) });
        if (table === "profiles") return makeChain({ maybeSingle: vi.fn().mockResolvedValue(ok({ id: "owner-123" })) });
        if (table === "appointments") return makeChain({
          single: vi.fn().mockResolvedValue(ok({ id: "appt-123", status: "pending_payment", price_cents: 5000 })),
          eq: vi.fn().mockResolvedValue(ok(null)),
        });
        return makeChain();
      }),
    } as never);

    const mpModule = await import("@/lib/mercadopago");
    vi.mocked(mpModule.createPaymentPreference).mockResolvedValue({ error: "MP error" });

    const res = await callRoute({ service_id: VALID_UUID, modality: "online", slot_start: SLOT_START });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Error al crear el pago");
  });
});
