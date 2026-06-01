import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PremiumUpgrade from "@/app/consultantes/suscripciones/PremiumUpgrade";

describe("PremiumUpgrade", () => {
  it("should render page title", () => {
    render(<PremiumUpgrade />);
    expect(screen.getByText("Suscripciones")).toBeDefined();
  });

  it("should show Prana, Shakti, Ananda plan cards", () => {
    render(<PremiumUpgrade />);
    expect(screen.getByText("Prana")).toBeDefined();
    expect(screen.getByText("Shakti")).toBeDefined();
    expect(screen.getByText("Ananda")).toBeDefined();
  });

  it("should show Prana as free", () => {
    render(<PremiumUpgrade />);
    expect(screen.getByText("Gratis")).toBeDefined();
  });

  it("should show Prana features", () => {
    render(<PremiumUpgrade />);
    expect(screen.getByText("Perfil personal")).toBeDefined();
    expect(screen.getByText("Agendar citas con Ana")).toBeDefined();
    expect(screen.getByText("Comunidad (leer y participar)")).toBeDefined();
  });

  it("should show Shakti features", () => {
    render(<PremiumUpgrade />);
    expect(screen.getByText("Todo lo de Prana")).toBeDefined();
    expect(screen.getByText("Biblioteca: podcasts, meditaciones, reiki y yoga")).toBeDefined();
    expect(screen.getByText("Evolución: mood tracker básico")).toBeDefined();
  });

  it("should show Ananda features including all modules", () => {
    render(<PremiumUpgrade />);
    expect(screen.getAllByText("Chat IA ilimitado").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Mensajes directos con otros consultantes")).toBeDefined();
  });

  it("should show Shakti and Ananda as Próximamente", () => {
    render(<PremiumUpgrade />);
    const proximamente = screen.getAllByText("Próximamente");
    expect(proximamente.length).toBe(2);
  });

  it("should show Prana as Plan actual", () => {
    render(<PremiumUpgrade />);
    expect(screen.getByText("Plan actual")).toBeDefined();
  });

  it("should show pricing for paid tiers", () => {
    render(<PremiumUpgrade />);
    expect(screen.getByText("$99/mes")).toBeDefined();
    expect(screen.getByText("$199/mes")).toBeDefined();
  });

  it("should show the introductory description", () => {
    render(<PremiumUpgrade />);
    expect(
      screen.getByText(/Estás en el plan Prana/),
    ).toBeDefined();
  });
});
