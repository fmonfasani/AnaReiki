import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PremiumUpgrade from "@/app/consultantes/suscripciones/PremiumUpgrade";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const basePlans = [
  { id: "shakti-month", name: "Shakti Mensual", slug: "shakti-monthly", description: null, price_cents: 990000, currency: "ARS", interval: "month", trial_days: 7 },
  { id: "shakti-year", name: "Shakti Anual", slug: "shakti-yearly", description: null, price_cents: 8900000, currency: "ARS", interval: "year", trial_days: 0 },
  { id: "ananda-month", name: "Ananda Mensual", slug: "ananda-monthly", description: null, price_cents: 1990000, currency: "ARS", interval: "month", trial_days: 7 },
  { id: "ananda-year", name: "Ananda Anual", slug: "ananda-yearly", description: null, price_cents: 18900000, currency: "ARS", interval: "year", trial_days: 0 },
];

describe("PremiumUpgrade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPremiumState(options: {
    isPremium?: boolean;
    planTier?: string;
    subscription?: Record<string, unknown> | null;
    plans?: typeof basePlans;
    userEmail?: string;
  } = {}) {
    return render(
      <PremiumUpgrade
        isPremium={options.isPremium ?? false}
        planTier={options.planTier ?? "prana"}
        plans={options.plans ?? basePlans}
        subscription={options.subscription as any ?? null}
        userEmail={options.userEmail ?? "test@test.com"}
      />,
    );
  }

  describe("Not premium (free user)", () => {
    it("should render pricing plans", () => {
      renderPremiumState();
      expect(screen.getByText("Suscripciones")).toBeDefined();
    });

    it("should show Prana, Shakti, Ananda plan cards", () => {
      renderPremiumState();
      expect(screen.getByText("Prana")).toBeDefined();
      expect(screen.getByText("Shakti")).toBeDefined();
      expect(screen.getByText("Ananda")).toBeDefined();
    });

    it("should show Prana as free", () => {
      renderPremiumState();
      expect(screen.getByText("Gratis")).toBeDefined();
    });

    it("should show Shakti features", () => {
      renderPremiumState();
      expect(screen.getByText("Biblioteca: podcasts, meditaciones, reiki y yoga")).toBeDefined();
      expect(screen.getByText("Evolución: mood tracker básico")).toBeDefined();
      expect(screen.getByText("Todo lo de Prana")).toBeDefined();
    });

    it("should show Ananda features including all modules", () => {
      renderPremiumState();
      expect(screen.getByText("Chat IA ilimitado")).toBeDefined();
      expect(screen.getByText("Mensajes directos con otros consultantes")).toBeDefined();
    });

    it("should display monthly prices by default", () => {
      renderPremiumState();
      expect(screen.getByText("$9.900")).toBeDefined();
      expect(screen.getByText("$19.900")).toBeDefined();
    });

    it("should switch to annual prices when clicking Anual", () => {
      renderPremiumState();
      fireEvent.click(screen.getByText("Anual"));
      expect(screen.getByText("$89.000")).toBeDefined();
      expect(screen.getByText("$189.000")).toBeDefined();
    });

    it("should show monthly by default (Mensual button active)", () => {
      renderPremiumState();
      const mensualBtn = screen.getByText("Mensual");
      expect(mensualBtn.className).toContain("bg-white");
    });

    it("should call MP API on subscribe click", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ init_point: "https://mp.com/subscribe" }),
      });

      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: "" } as unknown as Location;

      renderPremiumState();
      const subscribeBtns = screen.getAllByText("Probar gratis 7 días");
      fireEvent.click(subscribeBtns[0]); // First "Probar gratis 7 días" button

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/mercadopago/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: "shakti-month" }),
        });
      });

      window.location = originalLocation;
    });

    it("should show error message on subscription failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Plan no disponible" }),
      });

      renderPremiumState();
      const subscribeBtns = screen.getAllByText("Probar gratis 7 días");
      fireEvent.click(subscribeBtns[0]);

      await waitFor(() => {
        expect(screen.getByText("Plan no disponible")).toBeDefined();
      });
    });

    it("should show 'Plan actual' for prana user on Prana card", () => {
      renderPremiumState({ planTier: "prana" });
      const pranaCards = screen.getAllByText("Plan actual");
      expect(pranaCards.length).toBe(1);
    });

    it("should NOT show 'Plan actual' for ananda user", () => {
      renderPremiumState({ planTier: "ananda" });
      expect(screen.queryByText("Plan actual")).toBeNull();
    });
  });

  describe("Premium user (isPremium=true)", () => {
    it("should show subscription status page instead of pricing", () => {
      renderPremiumState({ isPremium: true, planTier: "ananda" });
      expect(screen.getByText("Tu suscripción")).toBeDefined();
      expect(screen.queryByText("Suscripciones")).toBeNull();
    });

    it("should show plan name in premium view", () => {
      renderPremiumState({
        isPremium: true,
        planTier: "ananda",
        subscription: {
          id: "sub-1", status: "active", current_period_end: "2027-01-01",
          cancel_at_period_end: false,
          pricing_plans: { name: "Ananda", slug: "ananda-monthly" },
        },
      });
      expect(screen.getByText("Plan Ananda")).toBeDefined();
    });

    it("should show expiration date", () => {
      renderPremiumState({
        isPremium: true,
        planTier: "ananda",
        subscription: {
          id: "sub-1", status: "active", current_period_end: "2027-01-01T00:00:00.000Z",
          cancel_at_period_end: false,
          pricing_plans: { name: "Ananda", slug: "ananda-monthly" },
        },
      });
      expect(screen.getByText(/Tu plan vence el/)).toBeDefined();
    });

    it("should show link to explore content", () => {
      renderPremiumState({ isPremium: true });
      expect(screen.getByText("Explorar contenido")).toBeDefined();
    });
  });

  describe("Billing toggle", () => {
    it("should show only monthly plans by default", () => {
      renderPremiumState();
      const shaktiMonthly = screen.getAllByText("$9.900");
      const anandaMonthly = screen.getAllByText("$19.900");
      expect(shaktiMonthly.length).toBeGreaterThanOrEqual(1);
      expect(anandaMonthly.length).toBeGreaterThanOrEqual(1);
      // Yearly prices should NOT be visible
      expect(screen.queryByText("$89.000")).toBeNull();
      expect(screen.queryByText("$189.000")).toBeNull();
    });

    it("should show only annual plans after toggle", () => {
      renderPremiumState();
      fireEvent.click(screen.getByText("Anual"));
      expect(screen.getByText("$89.000")).toBeDefined();
      expect(screen.getByText("$189.000")).toBeDefined();
      // Monthly prices should NOT be visible
      expect(screen.queryByText("$9.900")).toBeNull();
    });

    it("should show 'Ahorrá 2 meses' badge", () => {
      renderPremiumState();
      expect(screen.getByText("Ahorrá 2 meses")).toBeDefined();
    });
  });
});
