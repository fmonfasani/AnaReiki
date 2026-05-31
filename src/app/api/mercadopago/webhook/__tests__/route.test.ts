import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const mockGetPreapproval = vi.fn();
const mockGetPayment = vi.fn();
vi.mock("@/lib/mercadopago", () => ({
  getPreapproval: (...args: unknown[]) => mockGetPreapproval(...args),
  getPayment: (...args: unknown[]) => mockGetPayment(...args),
}));

async function callRoute(body: unknown): Promise<Response> {
  const { POST } = await import("@/app/api/mercadopago/webhook/route");
  const request = new Request("http://localhost:3000/api/mercadopago/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(request);
}

describe("POST /api/mercadopago/webhook", () => {
  const mockSupabase = {
    from: vi.fn(),
    rpc: vi.fn(),
  };

  const mockPreapproval = {
    id: "preapp-123",
    status: "authorized",
    payer: { email: "ana@test.com" },
    reason: "Shakti Mensual",
    external_reference: JSON.stringify({ userId: "user-1", planId: "plan-1" }),
    auto_recurring: { transaction_amount: 9900, frequency: 1, frequency_type: "months" },
  };

  const mockPlan = {
    id: "plan-1",
    name: "Shakti Mensual",
    slug: "shakti-mensual",
    interval: "month",
    price_cents: 990000,
    trial_days: 7,
    currency: "ARS",
  };

  function mockSupabaseChain(data: unknown, error: unknown = null) {
    const chainable = {
      select: vi.fn(() => chainable),
      insert: vi.fn(() => chainable),
      update: vi.fn(() => chainable),
      delete: vi.fn(() => chainable),
      eq: vi.fn(() => chainable),
      single: vi.fn(() => ({ data, error })),
      order: vi.fn(() => chainable),
      limit: vi.fn(() => chainable),
    };
    mockSupabase.from.mockReturnValue(chainable);
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    return chainable;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });

  describe("subscription_preapproval", () => {
    it("should return 200 when no preapproval ID", async () => {
      const res = await callRoute({
        type: "subscription_preapproval",
        data: {},
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ received: true });
    });

    it("should return 200 when getPreapproval fails", async () => {
      mockGetPreapproval.mockResolvedValue({ error: "MP error" });

      const res = await callRoute({
        type: "subscription_preapproval",
        data: { id: "preapp-123" },
      });
      expect(res.status).toBe(200);
    });

    it("should create subscription and update profile on authorized status", async () => {
      mockGetPreapproval.mockResolvedValue(mockPreapproval);
      const chain = mockSupabaseChain(null);
      chain.single = vi.fn().mockResolvedValueOnce({ data: mockPlan, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const res = await callRoute({
        type: "subscription_preapproval",
        data: { id: "preapp-123" },
        action: "created",
      });
      expect(res.status).toBe(200);

      expect(mockSupabase.from).toHaveBeenCalledWith("subscriptions");
      expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
      expect(mockSupabase.from).toHaveBeenCalledWith("pricing_plans");
    });

    it("should not create subscription if one already exists", async () => {
      mockGetPreapproval.mockResolvedValue(mockPreapproval);
      const chain = mockSupabaseChain(null);
      chain.single = vi.fn()
        .mockResolvedValueOnce({ data: mockPlan, error: null })
        .mockResolvedValueOnce({ data: { id: "sub-1" }, error: null });

      const res = await callRoute({
        type: "subscription_preapproval",
        data: { id: "preapp-123" },
        action: "created",
      });
      expect(res.status).toBe(200);
      expect(mockSupabase.from).not.toHaveBeenCalledWith("profiles");
    });

    it("should set ananda plan tier for ananda slugs", async () => {
      mockGetPreapproval.mockResolvedValue({
        ...mockPreapproval,
        external_reference: JSON.stringify({ userId: "user-1", planId: "plan-ananda" }),
      });
      const chain = mockSupabaseChain(null);
      const anandaPlan = { ...mockPlan, slug: "ananda-mensual", name: "Ananda Mensual" };
      chain.single = vi.fn()
        .mockResolvedValueOnce({ data: anandaPlan, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const res = await callRoute({
        type: "subscription_preapproval",
        data: { id: "preapp-123" },
        action: "created",
      });
      expect(res.status).toBe(200);
    });

    it("should handle cancelled preapproval", async () => {
      mockGetPreapproval.mockResolvedValue({
        ...mockPreapproval,
        status: "cancelled",
      });
      const chain = mockSupabaseChain(null);
      chain.single = vi.fn().mockResolvedValueOnce({ data: mockPlan, error: null });

      const res = await callRoute({
        type: "subscription_preapproval",
        data: { id: "preapp-123" },
      });
      expect(res.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith("pricing_plans");
      expect(mockSupabase.from).toHaveBeenCalledWith("subscriptions");
    });

    it("should handle invalid external_reference JSON gracefully", async () => {
      mockGetPreapproval.mockResolvedValue({
        ...mockPreapproval,
        external_reference: "not-json",
      });

      const res = await callRoute({
        type: "subscription_preapproval",
        data: { id: "preapp-123" },
        action: "created",
      });
      expect(res.status).toBe(200);
      expect(mockSupabase.from).not.toHaveBeenCalledWith("pricing_plans");
    });
  });

  describe("preapproval (alias)", () => {
    it("should handle 'preapproval' type (alias)", async () => {
      mockGetPreapproval.mockResolvedValue(mockPreapproval);
      const chain = mockSupabaseChain(null);
      chain.single = vi.fn()
        .mockResolvedValueOnce({ data: mockPlan, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const res = await callRoute({
        type: "preapproval",
        data: { id: "preapp-123" },
        action: "created",
      });
      expect(res.status).toBe(200);
    });
  });

  describe("payment", () => {
    const mockPayment = {
      status: "approved",
      status_detail: "accredited",
      payer: { email: "ana@test.com" },
      transaction_amount: 9900,
      payment_method_id: "visa",
    };

    it("should return 200 when no payment ID", async () => {
      const res = await callRoute({
        type: "payment",
        data: {},
      });
      expect(res.status).toBe(200);
      expect((await res.json())).toEqual({ received: true });
    });

    it("should return 200 when getPayment fails", async () => {
      mockGetPayment.mockResolvedValue({ error: "MP error" });

      const res = await callRoute({
        type: "payment",
        data: { id: "pay-123" },
      });
      expect(res.status).toBe(200);
    });

    it("should call handle_payment_success on approved payment", async () => {
      mockGetPayment.mockResolvedValue(mockPayment);
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          external_reference: JSON.stringify({ userId: "user-1", planId: "plan-1" }),
        }),
      });
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const res = await callRoute({
        type: "payment",
        data: { id: "pay-123" },
      });
      expect(res.status).toBe(200);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("handle_payment_success", {
        p_user_id: "user-1",
        p_plan_id: "plan-1",
        p_amount_cents: 990000,
        p_mp_payment_id: "pay-123",
        p_mp_preference_id: "",
        p_payment_method: "visa",
      });
    });

    it("should fallback to payments table when no external_reference", async () => {
      mockGetPayment.mockResolvedValue(mockPayment);
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
      const chain = mockSupabaseChain(null);
      chain.single = vi.fn().mockResolvedValue({
        data: { user_id: "user-1", plan_id: "plan-1" },
        error: null,
      });

      const res = await callRoute({
        type: "payment",
        data: { id: "pay-123" },
      });
      expect(res.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith("payments");
    });

    it("should not call RPC on non-approved payment", async () => {
      mockGetPayment.mockResolvedValue({
        ...mockPayment,
        status: "rejected",
      });

      const res = await callRoute({
        type: "payment",
        data: { id: "pay-123" },
      });
      expect(res.status).toBe(200);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should return 200 on invalid JSON body", async () => {
      const { POST } = await import("@/app/api/mercadopago/webhook/route");
      const request = new Request("http://localhost:3000/api/mercadopago/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });
      const res = await POST(request);
      expect(res.status).toBe(200);
    });

    it("should return 200 on unexpected error from supabase", async () => {
      mockGetPreapproval.mockResolvedValue(mockPreapproval);
      mockSupabase.from.mockImplementation(() => { throw new Error("DB crash"); });

      const res = await callRoute({
        type: "subscription_preapproval",
        data: { id: "preapp-123" },
        action: "created",
      });
      expect(res.status).toBe(200);
    });
  });
});
