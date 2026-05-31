import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMessage, markAsRead } from "@/actions/community";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("Messages Server Actions", () => {
  const mockSupabase = {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  };

  // biome-ignore lint/suspicious/noExplicitAny: mock chain
  let mockChain: any;

  function makeChain() {
    mockChain = {
      insert: vi.fn(() => ({ error: null })),
      update: vi.fn(() => mockChain),
      in: vi.fn(() => ({ error: null })),
    };
    return mockChain;
  }

  const userId = "user-123";
  const receiverId = "user-456";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } } });
    mockSupabase.from.mockReturnValue(makeChain());
  });

  describe("sendMessage", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await sendMessage({ receiverId, content: "Hello" })).error).toBe("No autorizado");
    });

    it("should insert direct_message with sender_id", async () => {
      const result = await sendMessage({ receiverId, subject: "Asunto", content: "Mensaje" });
      expect(mockSupabase.from).toHaveBeenCalledWith("direct_messages");
      expect(mockChain.insert).toHaveBeenCalledWith({
        sender_id: userId, receiver_id: receiverId, subject: "Asunto", content: "Mensaje",
      });
      expect(result.success).toBe(true);
    });

    it("should send message without subject", async () => {
      await sendMessage({ receiverId, content: "Mensaje sin asunto" });
      expect(mockChain.insert).toHaveBeenCalledWith(expect.objectContaining({ subject: null }));
    });

    it("should handle DB error", async () => {
      mockChain.insert.mockReturnValue({ error: { message: "Insert failed" } });
      expect((await sendMessage({ receiverId, content: "Test" })).error).toBe("Insert failed");
    });
  });

  describe("markAsRead", () => {
    it("should update read_at for given message IDs", async () => {
      const result = await markAsRead(["msg-1", "msg-2"]);
      expect(mockSupabase.from).toHaveBeenCalledWith("direct_messages");
      expect(result.success).toBe(true);
    });

    it("should handle DB error", async () => {
      const chain = { update: vi.fn(() => chain), in: vi.fn(() => ({ error: { message: "Update failed" } })) };
      mockSupabase.from.mockReturnValue(chain);
      expect((await markAsRead(["msg-1"])).error).toBe("Update failed");
    });
  });
});
