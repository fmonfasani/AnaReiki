import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveProgress, toggleFavorite, getLibraryData, updateContent, deleteContent } from "@/actions/library";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("Library Server Actions", () => {
  const mockSupabase = {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
  };

  const userId = "user-123";
  const contentId = "content-456";

  function mockChain(returnValue: unknown) {
    const chain: Record<string, unknown> = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      single: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      ...(typeof returnValue === "object" && returnValue !== null ? returnValue : {}),
    };
    return chain;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } } });
  });

  describe("saveProgress", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await saveProgress(contentId, 120)).error).toBe("No autorizado");
    });

    it("should call save_content_progress RPC", async () => {
      mockSupabase.rpc.mockResolvedValue({ error: null });
      const result = await saveProgress(contentId, 120, 600);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("save_content_progress", {
        p_user_id: userId, p_content_id: contentId, p_progress_seconds: 120, p_duration_seconds: 600,
      });
      expect(result.success).toBe(true);
    });

    it("should handle RPC error", async () => {
      mockSupabase.rpc.mockResolvedValue({ error: { message: "RPC error" } });
      expect((await saveProgress(contentId, 120)).error).toBe("RPC error");
    });
  });

  describe("toggleFavorite", () => {
    beforeEach(() => {
      const chain: Record<string, unknown> = {
        delete: vi.fn(() => chain),
        insert: vi.fn(() => ({ error: null })),
        eq: vi.fn(() => chain),
      };
      mockSupabase.from.mockReturnValue(chain);
    });

    it("should delete favorite when isFav is true", async () => {
      const result = await toggleFavorite(contentId, true);
      expect(mockSupabase.from).toHaveBeenCalledWith("content_favorites");
      expect(result.success).toBe(true);
    });

    it("should insert favorite when isFav is false", async () => {
      const result = await toggleFavorite(contentId, false);
      expect(mockSupabase.from).toHaveBeenCalledWith("content_favorites");
      expect(result.success).toBe(true);
    });
  });

  describe("getLibraryData", () => {
    it("should return empty arrays if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const result = await getLibraryData();
      expect(result).toEqual({ content: [], favorites: [], continueWatching: [] });
    });

    it("should fetch and map library data", async () => {
      const contentItem = { id: contentId, title: "Test", type: "podcast", content_categories: null, content_progress: [], content_favorites: [] };

      function buildChain(resolvedValue: unknown) {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          order: vi.fn(() => chain),
          single: vi.fn(() => chain),
          insert: vi.fn(() => chain),
          delete: vi.fn(() => chain),
        };
        chain.select.mockReturnValue(chain);
        chain.eq.mockReturnValue(chain);
        chain.order.mockResolvedValue(resolvedValue);
        return chain;
      }

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return buildChain({ data: [contentItem], error: null });
        if (callCount === 2) return buildChain({ data: [], error: null });
        return buildChain({ data: [], error: null });
      });

      const result = await getLibraryData();
      expect(result.content).toEqual([contentItem]);
      expect(result.favorites).toEqual([]);
      expect(result.continueWatching).toEqual([]);
    });
  });

  describe("updateContent", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await updateContent(contentId, { title: "New" })).error).toBe("No autorizado");
    });

    it("should update content row", async () => {
      const chain = { eq: vi.fn(() => ({ error: null })) };
      mockSupabase.from.mockReturnValue({ update: vi.fn(() => chain), ...chain });
      chain.eq.mockResolvedValue({ error: null });

      const result = await updateContent(contentId, { title: "Updated", is_premium: true });
      expect(result.success).toBe(true);
    });
  });

  describe("deleteContent", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await deleteContent(contentId)).error).toBe("No autorizado");
    });

    it("should delete content row", async () => {
      const chain = { eq: vi.fn(() => ({ error: null })) };
      mockSupabase.from.mockReturnValue({ delete: vi.fn(() => chain), ...chain });

      const result = await deleteContent(contentId);
      expect(result.success).toBe(true);
    });
  });
});
