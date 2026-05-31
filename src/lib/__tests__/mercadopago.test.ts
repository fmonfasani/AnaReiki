import { describe, it, expect, vi, beforeEach } from "vitest";

// Set env before importing
process.env.MERCADO_PAGO_ACCESS_TOKEN = "test-token-123";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import AFTER stubbing fetch
const mp = await import("@/lib/mercadopago");

describe("Mercado Pago Lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseInput = {
    planId: "plan-123",
    planName: "Shakti Mensual",
    description: "Suscripción Shakti",
    priceCents: 990000,
    backUrl: "https://anareiki.com/consultantes/suscripciones",
    notificationUrl: "https://anareiki.com/api/mercadopago/webhook",
    payerEmail: "test@test.com",
    externalReference: '{"userId":"user-1","planId":"plan-123"}',
  };

  describe("createPreference", () => {
    it("should fail if no access token", async () => {
      delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
      const result = await mp.createPreference(baseInput);
      expect(result).toEqual({ error: "Mercado Pago no configurado" });
      process.env.MERCADO_PAGO_ACCESS_TOKEN = "test-token-123";
    });

    it("should POST to /checkout/preferences with correct body", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "pref-123", init_point: "https://mp.com/pay/pref-123" }),
      });

      const result = await mp.createPreference(baseInput);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mercadopago.com/checkout/preferences",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token-123",
          }),
        }),
      );
      expect(result).toEqual({ id: "pref-123", init_point: "https://mp.com/pay/pref-123" });
    });

    it("should include back_urls in body", async () => {
      let capturedBody: string = "";
      mockFetch.mockImplementation(async (_url: string, opts: RequestInit) => {
        capturedBody = opts.body as string;
        return {
          ok: true,
          json: () => Promise.resolve({ id: "pref-1", init_point: "https://mp.com/pay/pref-1" }),
        };
      });

      await mp.createPreference(baseInput);
      const body = JSON.parse(capturedBody);
      expect(body.back_urls).toBeDefined();
      expect(body.back_urls.success).toContain("status=success");
      expect(body.items[0].unit_price).toBe(9900);
    });

    it("should return error on MP API failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: "Invalid parameter" }),
      });

      const result = await mp.createPreference(baseInput);
      expect(result).toEqual({ error: "Invalid parameter" });
    });

    it("should return error on network failure", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      const result = await mp.createPreference(baseInput);
      expect(result.error).toBe("Network error");
    });
  });

  describe("createPreapproval", () => {
    const preapprovalInput = {
      planId: "plan-123",
      planName: "Anual Ananda",
      priceCents: 18900000,
      interval: "year",
      trialDays: 7,
      backUrl: "https://anareiki.com/consultantes/suscripciones",
      payerEmail: "test@test.com",
      externalReference: '{"userId":"user-1","planId":"plan-123"}',
    };

    it("should fail if no access token", async () => {
      delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
      expect(await mp.createPreapproval(preapprovalInput)).toEqual({ error: "Mercado Pago no configurado" });
      process.env.MERCADO_PAGO_ACCESS_TOKEN = "test-token-123";
    });

    it("should POST to /preapproval with correct body (trial)", async () => {
      let capturedBody: string = "";
      mockFetch.mockImplementation(async (_url: string, opts: RequestInit) => {
        capturedBody = opts.body as string;
        return {
          ok: true,
          json: () => Promise.resolve({ id: "preapp-123", init_point: "https://mp.com/subscribe/preapp-123" }),
        };
      });

      const result = await mp.createPreapproval(preapprovalInput);
      expect(mockFetch).toHaveBeenCalledWith("https://api.mercadopago.com/preapproval", expect.objectContaining({ method: "POST" }));

      const body = JSON.parse(capturedBody);
      expect(body.payer_email).toBe("test@test.com");
      expect(body.reason).toBe("Anual Ananda");
      expect(body.auto_recurring.frequency).toBe(12); // year → 12 months
      expect(body.auto_recurring.frequency_type).toBe("months");
      expect(body.auto_recurring.transaction_amount).toBe(189000);
      expect(body.auto_recurring.free_trial).toEqual({ frequency: 7, frequency_type: "days" });
      expect(body.status).toBe("pending");
      expect(body.back_url).toBe("https://anareiki.com/consultantes/suscripciones");
      expect(result).toEqual({ id: "preapp-123", init_point: "https://mp.com/subscribe/preapp-123" });
    });

    it("should set frequency=1 for monthly interval", async () => {
      let capturedBody: string = "";
      mockFetch.mockImplementation(async (_url: string, opts: RequestInit) => {
        capturedBody = opts.body as string;
        return { ok: true, json: () => Promise.resolve({ id: "p", init_point: "https://mp.com/p" }) };
      });

      await mp.createPreapproval({ ...preapprovalInput, interval: "month" });
      const body = JSON.parse(capturedBody);
      expect(body.auto_recurring.frequency).toBe(1);
    });

    it("should NOT include free_trial when trialDays is 0", async () => {
      let capturedBody: string = "";
      mockFetch.mockImplementation(async (_url: string, opts: RequestInit) => {
        capturedBody = opts.body as string;
        return { ok: true, json: () => Promise.resolve({ id: "p", init_point: "https://mp.com/p" }) };
      });

      await mp.createPreapproval({ ...preapprovalInput, trialDays: 0 });
      const body = JSON.parse(capturedBody);
      expect(body.auto_recurring.free_trial).toBeUndefined();
    });

    it("should include back_url and status=pending in body", async () => {
      let capturedBody: string = "";
      mockFetch.mockImplementation(async (_url: string, opts: RequestInit) => {
        capturedBody = opts.body as string;
        return { ok: true, json: () => Promise.resolve({ id: "p", init_point: "https://mp.com/p" }) };
      });

      await mp.createPreapproval(preapprovalInput);
      const body = JSON.parse(capturedBody);
      expect(body.back_url).toBe("https://anareiki.com/consultantes/suscripciones");
      expect(body.status).toBe("pending");
    });

    it("should return error on MP API failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ status: "400", message: "invalid field" }),
      });
      expect(await mp.createPreapproval(preapprovalInput)).toEqual({ error: "invalid field" });
    });
  });

  describe("getPreapproval", () => {
    it("should fail if no token", async () => {
      delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
      expect(await mp.getPreapproval("preapp-1")).toEqual({ error: "No configurado" });
      process.env.MERCADO_PAGO_ACCESS_TOKEN = "test-token-123";
    });

    it("should fetch preapproval status", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: "preapp-1", status: "authorized", payer: { email: "test@test.com" },
          reason: "Ananda Mensual", external_reference: "ref-1",
          auto_recurring: { transaction_amount: 19900, frequency: 1, frequency_type: "months" },
        }),
      });

      const result = await mp.getPreapproval("preapp-1");
      expect(mockFetch).toHaveBeenCalledWith("https://api.mercadopago.com/preapproval/preapp-1", expect.any(Object));
      expect(result).toHaveProperty("status", "authorized");
    });
  });

  describe("getPayment", () => {
    it("should fail if no token", async () => {
      delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
      expect(await mp.getPayment("pay-1")).toEqual({ error: "No configurado" });
      process.env.MERCADO_PAGO_ACCESS_TOKEN = "test-token-123";
    });

    it("should fetch payment details", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: "approved", status_detail: "accredited",
          payer: { email: "test@test.com" },
          transaction_amount: 9900, payment_method_id: "visa",
        }),
      });

      const result = await mp.getPayment("pay-1");
      expect(result).toEqual({
        status: "approved", status_detail: "accredited",
        payer: { email: "test@test.com" },
        transaction_amount: 9900, payment_method_id: "visa",
      });
    });
  });
});
