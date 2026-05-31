import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

// Mock the mercadopago lib function that the route imports
const mockCreatePreapproval = vi.fn();
vi.mock("@/lib/mercadopago", () => ({
  createPreapproval: (...args: unknown[]) => mockCreatePreapproval(...args),
}));

async function callRoute(body: unknown): Promise<Response> {
  const { POST } = await import("@/app/api/mercadopago/create-preference/route");
  const request = new Request("http://localhost:3000/api/mercadopago/create-preference", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: "http://localhost:3000" },
    body: JSON.stringify(body),
  });
  return POST(request);
}

describe("POST /api/mercadopago/create-preference", () => {
  const mockSupabase = {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  };

  const mockUser = { id: "user-123", email: "test@test.com" };
  const mockPlan = {
    id: "plan-1", name: "Shakti Mensual", price_cents: 990000,
    interval: "month", trial_days: 7, is_active: true, currency: "ARS",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: mockPlan, error: null })),
          })),
        })),
      })),
    });
  });

  it("should return 401 if not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const res = await callRoute({ planId: "plan-1" });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("No autorizado");
  });

  it("should return 400 if planId is missing", async () => {
    const res = await callRoute({});
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Plan requerido");
  });

  it("should return 404 if plan not found", async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: { message: "Not found" } })),
          })),
        })),
      })),
    });

    const res = await callRoute({ planId: "nonexistent" });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Plan no encontrado");
  });

  it("should call createPreapproval and return result", async () => {
    mockCreatePreapproval.mockResolvedValue({
      id: "preapp-123",
      init_point: "https://mp.com/subscribe/preapp-123",
    });

    const res = await callRoute({ planId: "plan-1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: "preapp-123", init_point: "https://mp.com/subscribe/preapp-123" });
    expect(mockCreatePreapproval).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: "plan-1", planName: "Shakti Mensual", priceCents: 990000,
        interval: "month", trialDays: 7, payerEmail: "test@test.com",
      }),
    );
  });

  it("should return 500 if createPreapproval fails", async () => {
    mockCreatePreapproval.mockResolvedValue({ error: "MP error" });

    const res = await callRoute({ planId: "plan-1" });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("MP error");
  });

  it("should return 500 on unexpected error", async () => {
    mockSupabase.auth.getUser.mockRejectedValue(new Error("Unexpected"));

    const res = await callRoute({ planId: "plan-1" });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Unexpected");
  });
});
