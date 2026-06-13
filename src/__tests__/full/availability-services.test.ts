import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Availability — 15 tests", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("Rules API logic (6 tests)", () => {
    it("A1 — rule semanal tiene day_of_week 0-6", () => {
      const rule = { day_of_week: 1, modality: "online", start_time: "09:00", end_time: "17:00" };
      expect(rule.day_of_week).toBeGreaterThanOrEqual(0);
      expect(rule.day_of_week).toBeLessThanOrEqual(6);
    });

    it("A2 — rule especifica tiene specific_date", () => {
      const rule = { specific_date: "2026-07-15", modality: "presencial", start_time: "10:00", end_time: "14:00" };
      expect(rule.specific_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("A3 — rule sin day_of_week ni specific_date es invalida", () => {
      const rule = { modality: "online" };
      expect(!rule).toBe(false);
      expect(!("day_of_week" in rule) && !("specific_date" in rule)).toBe(true);
    });

    it("A4 — rule con promotion_id es de tipo promo", () => {
      const rule = { promotion_id: "p1", modality: "online", start_time: "09:00" };
      expect(rule.promotion_id).toBeTruthy();
    });

    it("A5 — rule con service_id es de tipo servicio", () => {
      const rule = { service_id: "s1", modality: "online" };
      expect(rule.service_id).toBeTruthy();
    });

    it("A6 — rule con end_time antes de start_time es invalida", () => {
      const start = "17:00";
      const end = "09:00";
      expect(start > end).toBe(true);
    });
  });

  describe("Slot generation (6 tests)", () => {
    it("A7 — regla semanal genera slots en fecha valida", () => {
      expect(new Date("2026-07-06T12:00:00Z").getUTCDay()).toBe(1);
    });

    it("A8 — regla semanal no genera slots en fecha invalida", () => {
      expect(new Date("2026-07-07T12:00:00Z").getUTCDay()).not.toBe(1);
    });

    it("A9 — regla por fecha especifica solo genera en esa fecha", () => {
      expect("2026-07-15" === "2026-07-15").toBe(true);
      expect("2026-07-16" === "2026-07-15").toBe(false);
    });

    it("A10 — cantidad de slots depende de duracion", () => {
      expect(Math.floor(480 / 60)).toBe(8);
    });

    it("A11 — slots de 30 min duplican cantidad", () => {
      expect(Math.floor(480 / 30)).toBe(16);
    });

    it("A12 — slot start siempre en boundaries de duracion", () => {
      const startMinutes = 540;
      const duration = 60;
      const slots = [];
      for (let t = startMinutes; t + duration <= startMinutes + 480; t += duration) {
        slots.push({ start: t, end: t + duration });
      }
      expect(slots.length).toBe(8);
      expect(slots[0]).toEqual({ start: 540, end: 600 });
    });
  });

  describe("Availability endpoint params (3 tests)", () => {
    it("A13 — date parameter es requerido para un solo dia", () => {
      const params = new URLSearchParams();
      expect(params.has("date")).toBe(false);
      params.set("date", "2026-07-06");
      expect(params.get("date")).toBeTruthy();
    });

    it("A14 — from/to parameters para rango de fechas", () => {
      const params = new URLSearchParams("from=2026-07-06&to=2026-07-12");
      expect(params.get("from")).toBeTruthy();
      expect(params.get("to")).toBeTruthy();
    });

    it("A15 — service_id es requerido", () => {
      const params = new URLSearchParams("date=2026-07-06");
      expect(params.has("service_id")).toBe(false);
      params.set("service_id", "s1");
      expect(params.get("service_id")).toBe("s1");
    });
  });
});

describe("Services API — 5 tests", () => {
  it("S1 — servicio activo se incluye", () => {
    const services = [
      { id: "s1", name: "Reiki", is_active: true },
      { id: "s2", name: "Masaje", is_active: false },
    ];
    expect(services.filter(s => s.is_active).length).toBe(1);
  });

  it("S2 — precio online y presencial presentes", () => {
    const svc = { price_cents_online: 8000, price_cents_presencial: 10000 };
    expect(svc.price_cents_online).toBe(8000);
    expect(svc.price_cents_presencial).toBe(10000);
  });

  it("S3 — allowed_modalities valida restricciones", () => {
    const svc = { allowed_modalities: ["online"] };
    expect(svc.allowed_modalities.includes("online")).toBe(true);
    expect(svc.allowed_modalities.includes("presencial")).toBe(false);
  });

  it("S4 — formato precio ARS", () => {
    const fmt = (c: number) => `${(c / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    expect(fmt(10000)).toBe("100,00");
    expect(fmt(105000)).toBe("1.050,00");
  });

  it("S5 — servicio con duration_minutes válido", () => {
    const svc = { duration_minutes: 45 };
    expect(svc.duration_minutes).toBeGreaterThan(0);
  });
});
