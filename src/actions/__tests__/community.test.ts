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

  // biome-ignore lint/suspicious/noExplicitAny: mock chain
  let mockTable: any;

  const validUUID = "550e8400-e29b-41d4-a716-446655440000";
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } } });
    mockTable = {
      insert: vi.fn(() => ({ error: null })),
      update: vi.fn(() => mockTable),
      delete: vi.fn(() => mockTable),
      eq: vi.fn(() => mockTable),
    };
    // For single .eq() calls, the last eq returns { error: null }
    // We handle this by making eq return mockTable for chaining,
    // and "await" on the final call resolves via the insert/update/delete mock
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
      expect(mockTable.insert).toHaveBeenCalledWith({
        title: "Mi tema", content: "Contenido", author_id: userId, category: "reiki",
      });
      expect(result.success).toBe(true);
    });

    it("should handle DB error", async () => {
      mockTable.insert.mockReturnValue({ error: { message: "Insert failed" } });
      expect((await createTopic({ title: "T", content: "C", category: "general" })).error).toBe("Insert failed");
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
      expect(mockTable.insert).toHaveBeenCalledWith({
        topic_id: validUUID, parent_id: null, author_id: userId, content: "Mi respuesta",
      });
      expect(result.success).toBe(true);
    });

    it("should insert reply with parent_id when provided", async () => {
      await createReply({ topicId: validUUID, content: "Nested", parentId: "parent-123" });
      expect(mockTable.insert).toHaveBeenCalledWith(expect.objectContaining({ parent_id: "parent-123" }));
    });
  });

  describe("closeTopic", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await closeTopic(validUUID)).error).toBe("No autorizado");
    });

    it("should update topic as closed where author matches", async () => {
      const result = await closeTopic(validUUID);
      expect(mockSupabase.from).toHaveBeenCalledWith("discussion_topics");
      expect(mockTable.update).toHaveBeenCalledWith({ is_closed: true });
      expect(mockTable.eq).toHaveBeenCalledWith("id", validUUID);
      expect(mockTable.eq).toHaveBeenCalledWith("author_id", userId);
      expect(result.success).toBe(true);
    });
  });

  describe("pinTopic", () => {
    it("should update is_pinned", async () => {
      const result = await pinTopic(validUUID, true);
      expect(mockTable.update).toHaveBeenCalledWith({ is_pinned: true });
      expect(mockTable.eq).toHaveBeenCalledWith("id", validUUID);
      expect(result.success).toBe(true);
    });
  });

  describe("deleteTopic", () => {
    it("should delete topic", async () => {
      const result = await deleteTopic(validUUID);
      expect(mockSupabase.from).toHaveBeenCalledWith("discussion_topics");
      expect(mockTable.delete).toHaveBeenCalled();
      expect(mockTable.eq).toHaveBeenCalledWith("id", validUUID);
      expect(result.success).toBe(true);
    });
  });

  describe("deleteReply", () => {
    it("should delete reply", async () => {
      const result = await deleteReply("reply-123");
      expect(mockSupabase.from).toHaveBeenCalledWith("discussion_replies");
      expect(mockTable.delete).toHaveBeenCalled();
      expect(mockTable.eq).toHaveBeenCalledWith("id", "reply-123");
      expect(result.success).toBe(true);
    });
  });

  describe("addComment", () => {
    it("should insert content_comment", async () => {
      const result = await addComment(validUUID, "Great content!");
      expect(mockSupabase.from).toHaveBeenCalledWith("content_comments");
      expect(mockTable.insert).toHaveBeenCalledWith({
        content_id: validUUID, user_id: userId, text: "Great content!",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("deleteComment", () => {
    it("should delete content comment", async () => {
      const result = await deleteComment("comment-123");
      expect(mockSupabase.from).toHaveBeenCalledWith("content_comments");
      expect(mockTable.delete).toHaveBeenCalled();
      expect(mockTable.eq).toHaveBeenCalledWith("id", "comment-123");
      expect(result.success).toBe(true);
    });
  });
});
