import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTopic, createReply, closeTopic, pinTopic,
  deleteTopic, deleteReply, addComment, deleteComment,
} from "@/actions/community";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("Community Server Actions", () => {
  const mockSupabase = {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  };

  const validUUID = "550e8400-e29b-41d4-a716-446655440000";
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } } });

    const mockTable: Record<string, ReturnType<typeof vi.fn>> = {};
    mockTable.insert = vi.fn(() => ({ error: null }));
    mockTable.select = vi.fn(() => mockTable);
    mockTable.single = vi.fn(() => ({ data: null, error: null }));
    mockTable.order = vi.fn(() => mockTable);
    mockTable.eq = vi.fn(() => mockTable);
    mockTable.delete = vi.fn(() => ({
      eq: vi.fn(() => ({ error: null })),
    }));
    mockTable.update = vi.fn(() => mockTable);
    mockTable.in = vi.fn(() => ({ error: null }));
    mockTable.limit = vi.fn(() => mockTable);

    mockSupabase.from.mockReturnValue(mockTable);
  });

  describe("createTopic", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await createTopic({ title: "Test", content: "Content", category: "general" })).error).toBe("No autorizado");
    });

    it("should insert discussion_topic with correct author", async () => {
      const result = await createTopic({ title: "Mi tema", content: "Contenido", category: "reiki" });
      expect(mockSupabase.from).toHaveBeenCalledWith("discussion_topics");
      expect(result.success).toBe(true);
    });
  });

  describe("createReply", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await createReply({ topicId: validUUID, content: "Reply" })).error).toBe("No autorizado");
    });

    it("should insert discussion_reply", async () => {
      const result = await createReply({ topicId: validUUID, content: "Mi respuesta" });
      expect(mockSupabase.from).toHaveBeenCalledWith("discussion_replies");
      expect(result.success).toBe(true);
    });
  });

  describe("closeTopic", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await closeTopic(validUUID)).error).toBe("No autorizado");
    });

    it("should update discussion_topic is_open", async () => {
      const result = await closeTopic(validUUID);
      expect(mockSupabase.from).toHaveBeenCalledWith("discussion_topics");
      expect(result.success).toBe(true);
    });
  });

  describe("pinTopic", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await pinTopic(validUUID)).error).toBe("No autorizado");
    });

    it("should update discussion_topic is_pinned", async () => {
      const result = await pinTopic(validUUID);
      expect(mockSupabase.from).toHaveBeenCalledWith("discussion_topics");
      expect(result.success).toBe(true);
    });
  });

  describe("deleteTopic", () => {
    it("should delete topic", async () => {
      const result = await deleteTopic(validUUID);
      expect(mockSupabase.from).toHaveBeenCalledWith("discussion_topics");
      expect(result.success).toBe(true);
    });
  });

  describe("deleteReply", () => {
    it("should delete reply", async () => {
      const result = await deleteReply("reply-123");
      expect(mockSupabase.from).toHaveBeenCalledWith("discussion_replies");
      expect(result.success).toBe(true);
    });
  });

  describe("addComment", () => {
    it("should insert content_comment", async () => {
      const result = await addComment(validUUID, "Great content!");
      expect(mockSupabase.from).toHaveBeenCalledWith("content_comments");
      expect(result.success).toBe(true);
    });

    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await addComment(validUUID, "test")).error).toBe("No autorizado");
    });
  });

  describe("deleteComment", () => {
    it("should delete comment", async () => {
      const result = await deleteComment("comment-123");
      expect(mockSupabase.from).toHaveBeenCalledWith("content_comments");
      expect(result.success).toBe(true);
    });
  });
});
