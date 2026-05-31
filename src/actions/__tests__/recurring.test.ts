import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRecurringTemplate, cancelRecurringTemplate, getMyRecurringTemplates } from "@/actions/recurring";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("Recurring Templates Server Actions", () => {
  const mockSupabase = {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  };

  const userId = "user-123";
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } } });
  });

  describe("createRecurringTemplate", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await createRecurringTemplate({
        consultantId: validUUID, serviceId: validUUID,
        dayOfWeek: 1, startTime: "10:00", endTime: "11:00", frequency: "weekly",
      })).error).toBe("No autorizado");
    });

    it("should insert recurring template", async () => {
      const chain = { insert: vi.fn(() => ({ error: null })) };
      mockSupabase.from.mockReturnValue(chain);

      const result = await createRecurringTemplate({
        consultantId: validUUID, serviceId: validUUID,
        dayOfWeek: 1, startTime: "10:00", endTime: "11:00", frequency: "weekly",
      });
      expect(mockSupabase.from).toHaveBeenCalledWith("recurring_templates");
      expect(result.success).toBe(true);
    });

    it("should include endDate when provided", async () => {
      let captured: Record<string, unknown> = {};
      mockSupabase.from.mockReturnValue({
        insert: vi.fn((data: unknown) => { captured = data as Record<string, unknown>; return { error: null }; }),
      });

      await createRecurringTemplate({
        consultantId: validUUID, serviceId: validUUID,
        dayOfWeek: 1, startTime: "10:00", endTime: "11:00", frequency: "biweekly",
        endDate: "2026-12-31",
      });
      expect(captured.end_date).toBe("2026-12-31");
    });

    it("should handle DB error", async () => {
      mockSupabase.from.mockReturnValue({ insert: vi.fn(() => ({ error: { message: "Insert error" } })) });
      expect((await createRecurringTemplate({
        consultantId: validUUID, serviceId: validUUID,
        dayOfWeek: 1, startTime: "10:00", endTime: "11:00", frequency: "weekly",
      })).error).toBe("Insert error");
    });
  });

  describe("cancelRecurringTemplate", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await cancelRecurringTemplate(validUUID)).error).toBe("No autorizado");
    });

    it("should set is_active=false for matching template", async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ error: null })),
          })),
        })),
      });

      const result = await cancelRecurringTemplate(validUUID);
      expect(result.success).toBe(true);
    });
  });

  describe("getMyRecurringTemplates", () => {
    it("should return empty array if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect(await getMyRecurringTemplates()).toEqual([]);
    });

    it("should fetch active templates for current user", async () => {
      const data = [{ id: validUUID, services: { name: "Reiki" } }];
      const selectChain = { select: vi.fn(() => ({
        eq: vi.fn(() => ({ eq: vi.fn(() => ({ error: null, data })) })),
      })) };
      mockSupabase.from.mockReturnValue(selectChain);

      const result = await getMyRecurringTemplates();
      expect(result).toEqual(data);
    });
  });
});
