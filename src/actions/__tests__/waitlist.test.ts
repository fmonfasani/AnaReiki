import { describe, it, expect, vi, beforeEach } from "vitest";
import { joinWaitlist, cancelWaitlist, getMyWaitlist } from "@/actions/waitlist";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("Waitlist Server Actions", () => {
  const mockSupabase = {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  };

  const userId = "user-123";
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";

  function buildChain(resolvedValue: unknown) {
    const chain = {
      insert: vi.fn(() => chain),
      select: vi.fn(() => chain),
      update: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      single: vi.fn(() => chain),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.single.mockResolvedValue(resolvedValue);
    chain.insert.mockReturnValue(chain);
    chain.update.mockReturnValue(chain);
    return chain;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } } });
  });

  describe("joinWaitlist", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const result = await joinWaitlist({
        consultantId: validUUID, serviceId: validUUID,
        preferredDate: "2026-06-15", preferredStartTime: "10:00", preferredEndTime: "11:00",
      });
      expect(result.error).toBe("No autorizado");
    });

    it("should insert into waitlist", async () => {
      const chain = buildChain({ data: { id: "waitlist-1" }, error: null });
      chain.insert.mockReturnValue(chain);
      mockSupabase.from.mockReturnValue(chain);

      const result = await joinWaitlist({
        consultantId: validUUID, serviceId: validUUID,
        preferredDate: "2026-06-15", preferredStartTime: "10:00", preferredEndTime: "11:00",
      });
      expect(mockSupabase.from).toHaveBeenCalledWith("waitlist");
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: "waitlist-1" });
    });

    it("should handle DB error", async () => {
      const chain = buildChain({ data: null, error: { message: "Insert failed" } });
      chain.insert.mockReturnValue(chain);
      mockSupabase.from.mockReturnValue(chain);

      expect((await joinWaitlist({
        consultantId: validUUID, serviceId: validUUID,
        preferredDate: "2026-06-15", preferredStartTime: "10:00", preferredEndTime: "11:00",
      })).error).toBe("Insert failed");
    });
  });

  describe("cancelWaitlist", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await cancelWaitlist(validUUID)).error).toBe("No autorizado");
    });

    it("should update status to cancelled for current user", async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ error: null })),
          })),
        })),
      });

      const result = await cancelWaitlist(validUUID);
      expect(mockSupabase.from).toHaveBeenCalledWith("waitlist");
      expect(result.success).toBe(true);
    });
  });

  describe("getMyWaitlist", () => {
    it("should return empty array if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect(await getMyWaitlist()).toEqual([]);
    });

    it("should fetch waiting entries for current user", async () => {
      const chain = buildChain({ data: [{ id: "w-1" }], error: null });
      chain.select.mockReturnValue(chain);
      chain.eq.mockReturnValue(chain);
      chain.order.mockResolvedValue({ data: [{ id: "w-1" }], error: null });
      mockSupabase.from.mockReturnValue(chain);

      const result = await getMyWaitlist();
      expect(result).toEqual([{ id: "w-1" }]);
    });
  });
});
