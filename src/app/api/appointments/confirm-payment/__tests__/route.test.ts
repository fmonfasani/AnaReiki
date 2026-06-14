import { describe, it, expect, vi, beforeEach } from "vitest";
import { createServiceClient } from "@/lib/supabase/service";

vi.mock("@/lib/supabase/server", () => {
  const mockUser = { id: "client-123" };
  return {
    createClient: vi.fn(() => ({
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: mockUser }, error: null })) },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { role: "consultante" }, error: null })),
          })),
        })),
      })),
    })),
  };
});
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
const mockGetPayment = vi.fn().mockResolvedValue({
  status: "approved",
  status_detail: "accredited",
  payer: { email: "test@test.com" },
  transaction_amount: 50,
  payment_method_id: "visa",
  external_reference: null,
});
vi.mock("@/lib/mercadopago", () => ({ getPayment: mockGetPayment }));
vi.mock("@/lib/email", () => ({ sendAppointmentEmail: vi.fn(), notifyAdminNewAppointment: vi.fn() }));

async function callRoute(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/appointments/confirm-payment/route");
  const req = new Request("http://localhost:3000/api/appointments/confirm-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

const mockSvc = {
  from: vi.fn(),
};

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

function buildAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: "appt-123",
    service_id: VALID_UUID,
    start_time: "2026-06-15T14:00:00.000Z",
    end_time: "2026-06-15T15:00:00.000Z",
    modality: "online",
    notes: null,
    price_cents: 5000,
    client_id: "client-123",
    payment_status: "pending_payment",
    status: "pending_payment",
    mp_payment_id: null,
    approval_status: "n/a",
    ...overrides,
  };
}

function mockSelect(singleResult: unknown) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => singleResult),
        maybeSingle: vi.fn(() => singleResult),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
  };
}

describe("POST /api/appointments/confirm-payment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceClient).mockReturnValue(mockSvc as never);

    const updateChain = { eq: vi.fn(() => Promise.resolve({ error: null })) };
    mockSvc.from.mockImplementation((table: string) => {
      if (table === "appointments") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: buildAppointment(), error: null })),
              maybeSingle: vi.fn(() => ({ data: buildAppointment(), error: null })),
            })),
          })),
          update: vi.fn(() => updateChain),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: { name: "Reiki", duration_minutes: 60 }, error: null })),
            maybeSingle: vi.fn(() => ({ data: { name: "Reiki", duration_minutes: 60 }, error: null })),
          })),
        })),
      };
    });
  });

  it("debe devolver 404 si no se encuentra el turno", async () => {
    mockSvc.from.mockReturnValue(
      mockSelect({ data: null, error: { message: "Not found" } }),
    );

    const res = await callRoute({ payment_id: "pay-123" });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Turno no encontrado");
  });

  it("debe confirmar un pago completo (pending_payment → confirmed)", async () => {
    const updateChain = { eq: vi.fn(() => Promise.resolve({ error: null })) };
    mockSvc.from.mockImplementation((table: string) => {
      if (table === "appointments") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: buildAppointment({ status: "pending_payment", approval_status: "n/a" }), error: null })),
              maybeSingle: vi.fn(() => ({ data: buildAppointment({ status: "pending_payment", approval_status: "n/a" }), error: null })),
            })),
          })),
          update: vi.fn(() => updateChain),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: vi.fn(() => ({ data: { name: "Reiki", duration_minutes: 60 }, error: null })) })),
        })),
      };
    });

    const res = await callRoute({ payment_id: "pay-123", appointment_id: "appt-123" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.newStatus).toBe("confirmed");
    expect(body.success).toBe(true);
  });

  it("debe mantener pending_approval si es un pago de depósito", async () => {
    const updateChain = { eq: vi.fn(() => Promise.resolve({ error: null })) };
    mockSvc.from.mockImplementation((table: string) => {
      if (table === "appointments") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: buildAppointment({
                status: "pending_approval", payment_status: "pending_payment", approval_status: "pending_approval",
              }), error: null })),
              maybeSingle: vi.fn(() => ({ data: buildAppointment({
                status: "pending_approval", payment_status: "pending_payment", approval_status: "pending_approval",
              }), error: null })),
            })),
          })),
          update: vi.fn(() => updateChain),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: vi.fn(() => ({ data: { name: "Reiki", duration_minutes: 60 }, error: null })) })),
        })),
      };
    });

    const res = await callRoute({ payment_id: "pay-123", appointment_id: "appt-123" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.newStatus).toBe("pending_approval");
  });

  it("debe confirmar si es un pago de balance (approved → confirmed)", async () => {
    const updateChain = { eq: vi.fn(() => Promise.resolve({ error: null })) };
    mockSvc.from.mockImplementation((table: string) => {
      if (table === "appointments") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: buildAppointment({
                status: "approved", payment_status: "pending_payment", approval_status: "approved",
              }), error: null })),
              maybeSingle: vi.fn(() => ({ data: buildAppointment({
                status: "approved", payment_status: "pending_payment", approval_status: "approved",
              }), error: null })),
            })),
          })),
          update: vi.fn(() => updateChain),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: vi.fn(() => ({ data: { name: "Reiki", duration_minutes: 60 }, error: null })) })),
        })),
      };
    });

    const res = await callRoute({
      payment_id: "pay-123",
      external_reference: JSON.stringify({ appointmentId: "appt-123", type: "balance" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.newStatus).toBe("confirmed");
  });

  it("debe devolver already_paid si ya está pago y no es pending_approval", async () => {
    mockSvc.from.mockReturnValue(
      mockSelect({ data: buildAppointment({ payment_status: "paid", status: "confirmed" }), error: null }),
    );

    const res = await callRoute({ payment_id: "pay-123", appointment_id: "appt-123" });
    const body = await res.json();
    expect(body.status).toBe("already_paid");
  });
});
