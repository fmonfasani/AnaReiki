import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BibliotecaClient from "@/app/consultantes/biblioteca/BibliotecaClient";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <div data-testid="mock-image">{alt}</div>,
}));

vi.mock("@/actions/library", () => ({
  toggleFavorite: vi.fn(),
}));

vi.mock("@/components/PremiumGate", () => ({
  default: ({ children, isPremium }: { children: React.ReactNode; isPremium: boolean }) =>
    isPremium ? <>{children}</> : <div data-testid="premium-gate">{children}</div>,
}));

// Mock fetch for AI recommendations
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const sampleContent = [
  {
    id: "v-1", title: "Clase de Reiki", description: "Aprende reiki",
    type: "video" as const, external_id: "ext-1", thumbnail_url: null,
    duration: 1800, is_premium: false, published_at: "2026-01-01",
    content_categories: { name: "Reiki", slug: "reiki" },
  },
  {
    id: "p-1", title: "Podcast Meditación", description: "Medita conmigo",
    type: "podcast" as const, external_id: "ext-2", thumbnail_url: null,
    duration: 3600, is_premium: true, published_at: "2026-01-02",
    content_categories: { name: "Meditación", slug: "meditacion" },
  },
];

const sampleCategories = [
  { id: "c-1", name: "Reiki", slug: "reiki", icon: "self_improvement", sort_order: 1 },
  { id: "c-2", name: "Meditación", slug: "meditacion", icon: "spa", sort_order: 2 },
];

describe("BibliotecaClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ recommendations: [] }),
    });
  });

  function renderClient(options: {
    content?: typeof sampleContent;
    categories?: typeof sampleCategories;
    planTier?: string;
    isPremium?: boolean;
  } = {}) {
    return render(
      <BibliotecaClient
        content={options.content ?? sampleContent}
        categories={options.categories ?? sampleCategories}
        favoriteIds={new Set()}
        progressMap={new Map()}
        isPremium={options.isPremium ?? false}
        planTier={options.planTier ?? "ananda"}
      />,
    );
  }

  it("should render title and subtitle", () => {
    renderClient();
    expect(screen.getByText("Biblioteca Digital")).toBeDefined();
    expect(screen.getByText("Todo el contenido disponible para vos.")).toBeDefined();
  });

  it("should show all content for ananda plan", () => {
    renderClient({ planTier: "ananda" });
    expect(screen.getByText("Clase de Reiki")).toBeDefined();
    expect(screen.getByText("Podcast Meditación")).toBeDefined();
  });

  it("should filter out videos for shakti plan", () => {
    renderClient({ planTier: "shakti" });
    expect(screen.queryByText("Clase de Reiki")).toBeNull();
    expect(screen.getByText("Podcast Meditación")).toBeDefined();
  });

  it("should hide Videos filter button for shakti plan", () => {
    renderClient({ planTier: "shakti" });
    expect(screen.queryByText("Videos")).toBeNull();
    expect(screen.getByText("Podcasts")).toBeDefined();
  });

  it("should show Videos filter button for ananda plan", () => {
    renderClient({ planTier: "ananda" });
    expect(screen.getByText("Videos")).toBeDefined();
  });

  it("should show empty state when no content matches filters", async () => {
    renderClient({ content: [], planTier: "ananda" });
    expect(screen.getByText("No hay contenido en esta sección.")).toBeDefined();
  });

  it("should render premium gate for premium content when not premium", () => {
    renderClient({ isPremium: false });
    const premiumGates = screen.getAllByTestId("premium-gate");
    expect(premiumGates.length).toBe(1); // only the podcast is premium
  });

  it("should NOT render premium gate for premium content when user IS premium", () => {
    renderClient({ isPremium: true });
    expect(screen.queryByTestId("premium-gate")).toBeNull();
  });

  it("should show tabs: Todo, Seguir viendo, Favoritos", () => {
    renderClient();
    expect(screen.getByText("Todo")).toBeDefined();
    expect(screen.getByText("Seguir viendo")).toBeDefined();
    expect(screen.getByText("Favoritos")).toBeDefined();
  });

  it("should show category filter buttons", () => {
    renderClient();
    const reikiElements = screen.getAllByText("Reiki");
    expect(reikiElements.length).toBeGreaterThanOrEqual(1);
    const medElements = screen.getAllByText("Meditación");
    expect(medElements.length).toBeGreaterThanOrEqual(1);
  });

  it("should call fetch for AI recommendations on mount", async () => {
    renderClient();
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/ai/recommendations");
    });
  });

  it("should show AI loading state", async () => {
    // Don't resolve fetch yet
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderClient();
    expect(screen.getByText("Recomendando contenido para vos...")).toBeDefined();
  });

  it("should show AI recommendations when available", async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        recommendations: [{ id: "v-1", reason: "Perfecto para empezar" }],
      }),
    });

    renderClient();
    await waitFor(() => {
      expect(screen.getByText("Perfecto para empezar")).toBeDefined();
    });
  });

  it("should render continue watching section when progress exists", () => {
    const progressMap = new Map<string, { progress_seconds: number; completed: boolean; last_watched_at: string }>();
    progressMap.set("v-1", { progress_seconds: 300, completed: false, last_watched_at: "2026-01-15" });

    render(
      <BibliotecaClient
        content={sampleContent}
        categories={sampleCategories}
        favoriteIds={new Set()}
        progressMap={progressMap}
        isPremium={false}
        planTier="ananda"
      />,
    );
    expect(screen.getByText("Continuar viendo")).toBeDefined();
  });

  it("should toggle favorites on button click", async () => {
    renderClient();
    const favButtons = screen.getAllByText("favorite_border");
    fireEvent.click(favButtons[0]);

    // Import the actual mock
    const { toggleFavorite } = await import("@/actions/library");
    expect(toggleFavorite).toHaveBeenCalledWith("v-1", false);
  });
});
