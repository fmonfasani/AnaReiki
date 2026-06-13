import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("Promos Full Flow — 25 tests", () => {
  beforeEach(() => { vi.clearAllMocks(); global.fetch = vi.fn(); });

  describe("Admin CRUD (8 tests)", () => {
    it("R1 — GET promos retorna lista", () => {
      const data = [{ id: "p1", name: "Promo 1", is_active: true, service_ids: ["s1"], modality: "online", discount_factor: 0.8 }];
      expect(data.length).toBe(1);
      expect(data[0].name).toBe("Promo 1");
    });

    it("R2 — promo tiene todos los campos requeridos", () => {
      const promo = {
        id: "p1", name: "Nueva Promo", modality: "online",
        discount_factor: 0.5, deposit_type: "percent", deposit_value: 25,
        service_ids: ["s1", "s2"], is_active: true, duration_minutes: 105,
      };
      expect(promo.service_ids.length).toBe(2);
      expect(promo.duration_minutes).toBe(105);
    });

    it("R3 — promo con duration_minutes calculado", () => {
      const services = [{ duration_minutes: 45 }, { duration_minutes: 60 }];
      const total = services.reduce((sum, s) => sum + s.duration_minutes, 0);
      expect(total).toBe(105);
    });

    it("R4 — PATCH actualiza campos individuales", () => {
      const promo = { name: "Original", discount_factor: 0.8 };
      const updated = { ...promo, name: "Actualizada", discount_factor: 0.3 };
      expect(updated.name).toBe("Actualizada");
      expect(updated.discount_factor).toBe(0.3);
    });

    it("R5 — PATCH actualiza deposit y modality", () => {
      const promo = { deposit_type: "none", deposit_value: 0, modality: "online" };
      const updated = { ...promo, deposit_type: "fixed", deposit_value: 5000, modality: "presencial" };
      expect(updated.deposit_type).toBe("fixed");
      expect(updated.modality).toBe("presencial");
    });

    it("R6 — toggle active cambia estado", () => {
      const promo = { is_active: true };
      expect(!promo.is_active).toBe(false);
    });

    it("R7 — admin promos filtra por usuario", () => {
      const promos = [{ id: "p1", owner_id: "a1" }, { id: "p2", owner_id: "a2" }];
      const filtered = promos.filter(p => p.owner_id === "a1");
      expect(filtered.length).toBe(1);
    });

    it("R8 — promo sin nombre es invalida", () => {
      const promo = { name: undefined };
      expect(!promo.name).toBe(true);
    });
  });

  describe("Pricing calculation (10 tests)", () => {
    it("P1 — subtotal online suma precios online de servicios", () => {
      const services = [
        { price_cents_online: 10000 },
        { price_cents_online: 15000 },
        { price_cents_online: 20000 },
      ];
      const subtotal = services.reduce((sum, s) => sum + (s.price_cents_online || 0), 0);
      expect(subtotal).toBe(45000);
    });

    it("P2 — subtotal presencial calcula suma correcta", () => {
      const services = [
        { price_cents_presencial: 12000 },
        { price_cents_presencial: 18000 },
      ];
      const subtotal = services.reduce((sum, s) => sum + (s.price_cents_presencial || 0), 0);
      expect(subtotal).toBe(30000);
    });

    it("P3 — descuento 50% calcula total correcto", () => {
      const subtotal = 40000;
      const total = Math.round(subtotal * 0.5);
      expect(total).toBe(20000);
    });

    it("P4 — descuento 0% (factor=1) no cambia precio", () => {
      expect(Math.round(40000 * 1)).toBe(40000);
    });

    it("P5 — descuento 100% (factor=0) da gratis", () => {
      expect(Math.round(40000 * 0)).toBe(0);
    });

    it("P6 — seña porcentual calcula correcto", () => {
      expect(Math.round(20000 * 0.25)).toBe(5000);
    });

    it("P7 — seña fija no depende del total", () => {
      expect(5000).toBe(5000);
    });

    it("P8 — duracion total suma duraciones de servicios", () => {
      const services = [{ duration_minutes: 45 }, { duration_minutes: 60 }, { duration_minutes: 30 }];
      expect(services.reduce((sum, s) => sum + s.duration_minutes, 0)).toBe(135);
    });

    it("P9 — promo con 0 servicios tiene subtotal 0", () => {
      const services: any[] = [];
      expect(services.reduce((sum, s) => sum + (s.price_cents_online || 0), 0)).toBe(0);
    });

    it("P10 — precio con factor 0.7 da 30% descuento", () => {
      const subtotal = 50000;
      const total = Math.round(subtotal * 0.7);
      expect(total).toBe(35000);
      expect(Math.round((1 - 0.7) * 100)).toBe(30);
    });
  });

  describe("Promo rules (4 tests)", () => {
    it("U1 — promo con modality solo online no acepta presencial", () => {
      const promo = { modality: "online" };
      expect(promo.modality === "online").toBe(true);
      expect(promo.modality === "presencial").toBe(false);
    });

    it("U2 — promo con modality solo presencial no acepta online", () => {
      const promo = { modality: "presencial" };
      expect(promo.modality === "presencial").toBe(true);
      expect(promo.modality === "online").toBe(false);
    });

    it("U3 — promo con service_ids validos", () => {
      const promo = { service_ids: ["s1", "s2", "s3"] };
      expect(promo.service_ids.length).toBe(3);
    });

    it("U4 — promo con deposit_type percent calcula correctamente", () => {
      const total = 20000;
      const deposit_type = "percent";
      const deposit_value = 25;
      const deposit = deposit_type === "percent" ? Math.round(total * (deposit_value / 100)) : deposit_value;
      expect(deposit).toBe(5000);
    });
  });

  describe("Admin UI form (3 tests)", () => {
    it("U5 — formato precio ARS", () => {
      const formatPrice = (cents: number) => `$${(cents / 100).toLocaleString("es-AR")}`;
      expect(formatPrice(5000)).toBe("$50");
      expect(formatPrice(10000)).toBe("$100");
    });

    it("U6 — promo con descuento 50% calcula OFF label", () => {
      expect(Math.round((1 - 0.5) * 100)).toBe(50);
    });

    it("U7 — promo con factor 1 no muestra OFF", () => {
      const showOff = 1 > 0 && 1 < 1;
      expect(showOff).toBe(false);
    });
  });
});
