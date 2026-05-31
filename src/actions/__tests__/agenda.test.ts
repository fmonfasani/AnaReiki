import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveAvailability, getAppointments, saveSpecificSlot, blockDate, unblockDate } from "@/actions/agenda";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("Agenda Server Actions (Admin)", () => {
  const mockSupabase = {
    auth: { getUser: vi.fn(), updateUser: vi.fn() },
    from: vi.fn(),
  };

  // biome-ignore lint/suspicious/noExplicitAny: mock chain
  let mockQuery: any;

  const mockUser = { id: "admin-123", email: "ana@test.com" };

  function setupAdminReturn() {
    mockQuery = {
      select: vi.fn(() => mockQuery),
      insert: vi.fn(() => ({ error: null })),
      delete: vi.fn(() => mockQuery),
      update: vi.fn(() => ({ error: null })),
      eq: vi.fn(() => mockQuery),
      gte: vi.fn(() => mockQuery),
      lte: vi.fn(() => ({ data: [], error: null })),
      is: vi.fn(() => ({ error: null })),
      single: vi.fn(() => ({ data: { role: "admin" }, error: null })),
      order: vi.fn(() => mockQuery),
    };
    mockSupabase.from.mockReturnValue(mockQuery);
  }

  function setupFormData(availability: string, sessionDuration = 60, bufferTime = 15): FormData {
    const fd = new FormData();
    fd.append("availability", availability);
    fd.append("sessionDuration", String(sessionDuration));
    fd.append("bufferTime", String(bufferTime));
    return fd;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    mockSupabase.auth.updateUser.mockResolvedValue({ error: null });
    setupAdminReturn();
  });

  describe("saveAvailability", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const result = await saveAvailability(setupFormData("[]"));
      expect(result.error).toBe("No autorizado");
    });

    it("should fail if user is not admin", async () => {
      mockQuery.single.mockResolvedValue({ data: { role: "consultante" }, error: null });
      const result = await saveAvailability(setupFormData("[]"));
      expect(result.error).toBe("No autorizado");
    });

    it("should save availability and sync legacy table", async () => {
      const slots = JSON.stringify([
        { id: 1, startTime: "09:00", endTime: "12:00" },
        { id: 3, startTime: "14:00", endTime: "17:00" },
      ]);
      const result = await saveAvailability(setupFormData(slots));
      expect(result.success).toBe(true);
      expect(mockSupabase.auth.updateUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith("availability_rules");
      expect(mockSupabase.from).toHaveBeenCalledWith("availability");
    });

    it("should handle DB error on delete", async () => {
      mockQuery.delete.mockReturnValue({ eq: vi.fn(() => ({ error: { message: "Delete failed" } })) });
      const result = await saveAvailability(setupFormData("[]"));
      expect(result.error).toContain("Delete failed");
    });
  });

  describe("getAppointments", () => {
    it("should return empty array if not admin", async () => {
      mockQuery.single.mockResolvedValue({ data: { role: "consultante" }, error: null });
      const result = await getAppointments(new Date("2026-06-01"), new Date("2026-06-30"));
      expect(result).toEqual([]);
    });

    it("should fetch appointments for admin", async () => {
      mockQuery.lte.mockResolvedValue({ data: [{ id: "appt-1" }], error: null });
      const result = await getAppointments(new Date("2026-06-01"), new Date("2026-06-30"));
      expect(result).toEqual([{ id: "appt-1" }]);
    });

    it("should return empty array on DB error", async () => {
      mockQuery.lte.mockResolvedValue({ data: null, error: { message: "DB error" } });
      const result = await getAppointments(new Date("2026-06-01"), new Date("2026-06-30"));
      expect(result).toEqual([]);
    });
  });

  describe("saveSpecificSlot", () => {
    it("should fail if not admin", async () => {
      mockQuery.single.mockResolvedValue({ data: { role: "consultante" }, error: null });
      const result = await saveSpecificSlot(new Date("2026-06-15"), "10:00", "12:00");
      expect(result.error).toBe("No autorizado");
    });

    it("should insert availability exception", async () => {
      const result = await saveSpecificSlot(new Date("2026-06-15"), "10:00", "12:00");
      expect(result.success).toBe(true);
    });
  });

  describe("blockDate", () => {
    it("should fail if not admin", async () => {
      mockQuery.single.mockResolvedValue({ data: { role: "consultante" }, error: null });
      expect((await blockDate("2026-06-15")).error).toBe("No autorizado");
    });

    it("should insert blocked exception", async () => {
      expect((await blockDate("2026-06-15")).success).toBe(true);
    });
  });

  describe("unblockDate", () => {
    it("should fail if not admin", async () => {
      mockQuery.single.mockResolvedValue({ data: { role: "consultante" }, error: null });
      expect((await unblockDate("2026-06-15")).error).toBe("No autorizado");
    });

    it("should delete blocked exception", async () => {
      // unblockDate: .delete().eq("consultant_id").eq("exception_date", dateString)
      // isAdmin() uses .select().eq(id).single() — both eq calls return mockQuery for chaining
      const result = await unblockDate("2026-06-15");
      expect(result.success).toBe(true);
    });
  });
});
