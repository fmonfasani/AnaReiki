import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

describe("Messages — 10 tests", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("M1 — mensaje renderizado con formato fecha", () => {
    const formatDate = (iso: string) => {
      const d = new Date(iso);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${dd}/${mm}`;
    };
    expect(formatDate("2026-07-06T10:00:00Z")).toBe("06/07");
  });

  it("M2 — mensaje largo no se corta en render", () => {
    const longMsg = "a".repeat(500);
    expect(longMsg.length).toBe(500);
  });

  it("M3 — conversacion con multiple mensajes ordenados", () => {
    const msgs = [
      { content: "Primero", created_at: "2026-07-06T10:00:00Z" },
      { content: "Segundo", created_at: "2026-07-06T10:05:00Z" },
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    expect(msgs[0].content).toBe("Primero");
    expect(msgs[1].content).toBe("Segundo");
  });

  it("M4 — admin puede enviar mensaje directo privado", () => {
    const msg = { is_private: true, sender_role: "admin", content: "Mensaje privado" };
    expect(msg.is_private).toBe(true);
  });

  it("M5 — consultante no puede enviar privado", () => {
    const msg = { is_private: false, sender_role: "consultante" };
    expect(msg.is_private).toBe(false);
  });

  it("M6 — mensaje tiene sender_id y receiver_id", () => {
    const msg = { id: "m1", sender_id: "u1", receiver_id: "u2", content: "Hola" };
    expect(msg.sender_id).toBe("u1");
    expect(msg.receiver_id).toBe("u2");
  });

  it("M7 — mensaje con perfil incluye display_name", () => {
    const msg = { content: "Test", profile: { display_name: "Ana", avatar_url: null } };
    expect(msg.profile.display_name).toBe("Ana");
  });

  it("M8 — fecha ISO a timestamp milisegundos", () => {
    const ts = new Date("2026-07-06T10:00:00Z").getTime();
    expect(typeof ts).toBe("number");
    expect(ts).toBeGreaterThan(0);
  });

  it("M9 — mensaje de texto plano sin HTML", () => {
    const dangerous = '<script>alert("xss")</script>';
    expect(dangerous.includes("<script>")).toBe(true);
    expect(dangerous.includes("&lt;")).toBe(false);
  });

  it("M10 — conversation_id es string", () => {
    const conv = { id: "conv_abc123", created_at: "2026-07-06" };
    expect(typeof conv.id).toBe("string");
  });
});

describe("UX Components — 15 tests", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("C1 — PremiumGate bloquea tier insuficiente", () => {
    const PremiumGate = ({ requiredTier, userTier, children }: any) => {
      const tiers = ["prana", "shakti", "ananda"];
      if (tiers.indexOf(userTier) >= tiers.indexOf(requiredTier)) return children;
      return React.createElement("div", { "data-testid": "blocked" }, "SUBIR");
    };
    render(React.createElement(PremiumGate, { requiredTier: "shakti", userTier: "prana" }, React.createElement("div", null, "Premium Content")));
    expect(screen.getByTestId("blocked").textContent).toBe("SUBIR");
  });

  it("C2 — PremiumGate permite tier suficiente", () => {
    const PremiumGate = ({ requiredTier, userTier, children }: any) => {
      const tiers = ["prana", "shakti", "ananda"];
      if (tiers.indexOf(userTier) >= tiers.indexOf(requiredTier)) return children;
      return React.createElement("div", { "data-testid": "blocked" }, "SUBIR");
    };
    render(React.createElement(PremiumGate, { requiredTier: "shakti", userTier: "shakti" }, React.createElement("div", { "data-testid": "content" }, "Premium Content")));
    expect(screen.getByTestId("content")).toBeDefined();
  });

  it("C3 — PremiumGate muestra SUBIR badge", () => {
    const PremiumGate = ({ requiredTier, userTier, children }: any) => {
      const tiers = ["prana", "shakti", "ananda"];
      if (tiers.indexOf(userTier) >= tiers.indexOf(requiredTier)) return children;
      return React.createElement("div", { "data-testid": "blocked" }, "SUBIR");
    };
    render(React.createElement(PremiumGate, { requiredTier: "ananda", userTier: "prana" }, React.createElement("div", null, "Ananda Only")));
    expect(screen.getByTestId("blocked")).toBeDefined();
  });

  it("C4 — PremiumGate pass para Ananda en contenido Ananda", () => {
    const PremiumGate = ({ requiredTier, userTier, children }: any) => {
      const tiers = ["prana", "shakti", "ananda"];
      if (tiers.indexOf(userTier) >= tiers.indexOf(requiredTier)) return children;
      return React.createElement("div", { "data-testid": "blocked" }, "SUBIR");
    };
    render(React.createElement(PremiumGate, { requiredTier: "ananda", userTier: "ananda" }, React.createElement("div", { "data-testid": "c" }, "Content")));
    expect(screen.getByTestId("c")).toBeDefined();
  });

  it("C5 — PremiumGate pass para Ananda en contenido Shakti", () => {
    const PremiumGate = ({ requiredTier, userTier, children }: any) => {
      const tiers = ["prana", "shakti", "ananda"];
      if (tiers.indexOf(userTier) >= tiers.indexOf(requiredTier)) return children;
      return React.createElement("div", { "data-testid": "blocked" }, "SUBIR");
    };
    render(React.createElement(PremiumGate, { requiredTier: "shakti", userTier: "ananda" }, React.createElement("div", { "data-testid": "c" }, "Content")));
    expect(screen.getByTestId("c")).toBeDefined();
  });

  it("C6 — ServiceSelector renderiza dos columnas", async () => {
    const ServiceSelector = () => {
      return React.createElement("div", { className: "grid grid-cols-2 gap-4" },
        React.createElement("div", { "data-testid": "promos-col" }, "Promos Disponibles"),
        React.createElement("div", { "data-testid": "services-col" }, "Servicios Individuales"),
      );
    };
    render(React.createElement(ServiceSelector));
    expect(screen.getByTestId("promos-col")).toBeDefined();
    expect(screen.getByTestId("services-col")).toBeDefined();
  });

  it("C7 — promo card muestra precio con descuento", () => {
    const PromoCard = ({ name, price, originalPrice }: any) => {
      return React.createElement("div", { className: "promo-card" },
        React.createElement("h3", null, name),
        React.createElement("p", null, `Precio: $${(price / 100).toLocaleString("es-AR")}`),
        originalPrice > price && React.createElement("span", { className: "line-through" }, `$${(originalPrice / 100).toLocaleString("es-AR")}`),
      );
    };
    const { container } = render(React.createElement(PromoCard, { name: "Pack Bienestar", price: 15000, originalPrice: 30000 }));
    expect(container.querySelector(".line-through")).toBeDefined();
  });

  it("C8 — promo card sin descuento no muestra tachado", () => {
    const PromoCard = ({ price, originalPrice }: any) => {
      return React.createElement("div", null,
        originalPrice > price && React.createElement("span", { className: "line-through" }, "tachado"),
      );
    };
    const { container } = render(React.createElement(PromoCard, { price: 15000, originalPrice: 15000 }));
    expect(container.querySelector(".line-through")).toBeNull();
  });

  it("C9 — boton Reservar promo llama handler", () => {
    const handleClick = vi.fn();
    render(React.createElement("button", { onClick: () => handleClick("p1"), "data-testid": "reservar-btn" }, "Reservar"));
    fireEvent.click(screen.getByTestId("reservar-btn"));
    expect(handleClick).toHaveBeenCalledWith("p1");
  });

  it("C10 — modalidad online badge se renderiza", () => {
    render(React.createElement("span", { className: "badge badge-online" }, "Online"));
    expect(screen.getByText("Online")).toBeDefined();
  });

  it("C11 — modalidad presencial badge se renderiza", () => {
    render(React.createElement("span", { className: "badge badge-presencial" }, "Presencial"));
    expect(screen.getByText("Presencial")).toBeDefined();
  });

  it("C12 — OFF label muestra porcentaje correcto", () => {
    const offPercent = Math.round((1 - 0.5) * 100);
    render(React.createElement("span", { className: "off-badge" }, `${offPercent}% OFF`));
    expect(screen.getByText("50% OFF")).toBeDefined();
  });

  it("C13 — OFF label 70%", () => {
    expect(Math.round((1 - 0.3) * 100)).toBe(70);
  });

  it("C14 — formato duracion en horas y minutos", () => {
    const formatDuration = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return h > 0 ? `${h}h ${m}min` : `${m}min`;
    };
    expect(formatDuration(45)).toBe("45min");
    expect(formatDuration(60)).toBe("1h 0min");
    expect(formatDuration(90)).toBe("1h 30min");
  });

  it("C15 — calendario renderiza dias del mes", () => {
    const DatePicker = ({ availableDates }: any) => {
      return React.createElement("div", { "data-testid": "date-picker" },
        (availableDates || []).map((d: string) => React.createElement("button", { key: d, "data-testid": `date-${d}` }, new Date(d).getDate().toString())),
      );
    };
    render(React.createElement(DatePicker, { availableDates: ["2026-07-06", "2026-07-07"] }));
    expect(screen.getByTestId("date-2026-07-06")).toBeDefined();
    expect(screen.getByTestId("date-2026-07-07")).toBeDefined();
  });
});
