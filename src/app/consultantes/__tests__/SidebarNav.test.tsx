import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SidebarNav from "@/app/consultantes/SidebarNav";

vi.mock("next/link", () => ({
  default: ({ children, href, onClick, className }: { children: React.ReactNode; href: string; onClick?: (e: React.MouseEvent) => void; className?: string }) => (
    <a href={href} onClick={onClick} className={className}>{children}</a>
  ),
}));

const ALL_ITEMS = [
  { id: "inicio", name: "Inicio", href: "/consultantes", icon: "home", locked: false },
  { id: "suscripciones", name: "Suscripciones", href: "/consultantes/suscripciones", icon: "diamond", locked: false },
  { id: "biblioteca", name: "Biblioteca", href: "/consultantes/biblioteca", icon: "library_books", locked: false },
  { id: "clases", name: "Clases", href: "/consultantes/clases", icon: "video_library", locked: false },
  { id: "podcast", name: "Podcast", href: "/consultantes/podcast", icon: "podcasts", locked: false },
  { id: "comunidad", name: "Comunidad", href: "/consultantes/comunidad", icon: "forum", locked: false },
  { id: "mensajes", name: "Mensajes", href: "/consultantes/mensajes", icon: "chat", locked: false },
  { id: "chat-buda", name: "Chat Buda", href: "/consultantes/chat-buda", icon: "psychiatry", locked: false },
  { id: "evolucion", name: "Evolución", href: "/consultantes/evolucion", icon: "spa", locked: false },
  { id: "mis-citas", name: "Mi Agenda", href: "/consultantes/mis-citas", icon: "calendar_month", locked: false },
  { id: "perfil", name: "Mi Perfil", href: "/consultantes/perfil", icon: "person", locked: false },
];

function mapItems(planAccess: string[]): typeof ALL_ITEMS {
  return ALL_ITEMS.map((item) => ({
    ...item,
    locked: !planAccess.includes(item.id),
  }));
}

describe("SidebarNav", () => {
  it("should render all items for ananda plan (unlocked)", () => {
    const items = mapItems(["inicio", "suscripciones", "biblioteca", "clases", "podcast", "comunidad", "mensajes", "chat-buda", "evolucion", "mis-citas", "perfil"]);
    render(<SidebarNav items={items} planTier="ananda" />);

    ALL_ITEMS.forEach((item) => {
      expect(screen.getByText(item.name)).toBeDefined();
    });
    expect(screen.queryAllByText("PRO").length).toBe(0);
  });

  it("should lock chat-buda for shakti plan", () => {
    const shaktiAccess = ["inicio", "suscripciones", "biblioteca", "podcast", "comunidad", "evolucion", "mis-citas", "mensajes", "perfil"];
    const items = mapItems(shaktiAccess);
    render(<SidebarNav items={items} planTier="shakti" />);

    expect(screen.getByText("Chat Buda").closest("a")?.className).toContain("cursor-not-allowed");
    expect(screen.getByText("Biblioteca").closest("a")?.className).not.toContain("cursor-not-allowed");
  });

  it("should lock biblioteca, clases, podcast, evolucion, chat-buda for prana plan", () => {
    const pranaAccess = ["inicio", "suscripciones", "mis-citas", "comunidad", "mensajes", "perfil"];
    const items = mapItems(pranaAccess);
    render(<SidebarNav items={items} planTier="prana" />);

    expect(screen.getByText("Biblioteca").closest("a")?.className).toContain("cursor-not-allowed");
    expect(screen.getByText("Clases").closest("a")?.className).toContain("cursor-not-allowed");
    expect(screen.getByText("Inicio").closest("a")?.className).not.toContain("cursor-not-allowed");
    expect(screen.getByText("Comunidad").closest("a")?.className).not.toContain("cursor-not-allowed");
    expect(screen.getByText("Mensajes").closest("a")?.className).not.toContain("cursor-not-allowed");
  });

  it("should show SUBIR badge for locked items", () => {
    const items = [
      { id: "biblioteca", name: "Biblioteca", href: "/consultantes/biblioteca", icon: "library_books", locked: true },
    ];
    render(<SidebarNav items={items} planTier="prana" />);
    expect(screen.getByText("Suscribir")).toBeDefined();
  });

  it("should show lock toast when clicking a locked item", () => {
    const items = [
      { id: "chat-buda", name: "Chat Buda", href: "/consultantes/chat-buda", icon: "psychiatry", locked: true },
    ];
    render(<SidebarNav items={items} planTier="shakti" />);

    const link = screen.getByText("Chat Buda").closest("a")!;
    fireEvent.click(link);

    expect(screen.getByText(/Necesitás el plan Ananda/)).toBeDefined();
    expect(screen.getByText("Ver planes disponibles")).toBeDefined();
  });

  it("should not show toast when clicking unlocked item", () => {
    const items = [
      { id: "inicio", name: "Inicio", href: "/consultantes", icon: "home", locked: false },
    ];
    render(<SidebarNav items={items} planTier="ananda" />);

    fireEvent.click(screen.getByText("Inicio").closest("a")!);
    expect(screen.queryByText(/Necesitás el plan/)).toBeNull();
  });

  it("should render mobile variant when mobile=true", () => {
    const items = [
      { id: "inicio", name: "Inicio", href: "/consultantes", icon: "home", locked: false },
    ];
    render(<SidebarNav items={items} planTier="prana" mobile />);
    expect(screen.getByText("Inicio")).toBeDefined();
  });

  it("should return null for mobile with empty items", () => {
    const { container } = render(<SidebarNav items={[]} planTier="prana" mobile />);
    expect(container.innerHTML).toBe("");
  });

  it("should show lock icon for locked items", () => {
    const items = [
      { id: "clases", name: "Clases", href: "/consultantes/clases", icon: "video_library", locked: true },
    ];
    render(<SidebarNav items={items} planTier="shakti" />);
    expect(screen.getByText("lock")).toBeDefined();
  });

  it("should show item icon for unlocked items", () => {
    const items = [
      { id: "inicio", name: "Inicio", href: "/consultantes", icon: "home", locked: false },
    ];
    render(<SidebarNav items={items} planTier="prana" />);
    expect(screen.getByText("home")).toBeDefined();
  });
});
