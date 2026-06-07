import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAppointment, cancelAppointment, rescheduleAppointment, adminConfirmAppointment, adminManageAppointment } from "@/actions/appointments";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));

describe("Appointments Server Actions", () => {
  const mockSupabase = {
    auth: { getUser: vi.fn() },
    rpc: vi.fn(),
  };
  const mockSvc = {
    from: vi.fn(),
    rpc: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    vi.mocked(createServiceClient).mockReturnValue(mockSvc as never);
  });

  const validUUID = "550e8400-e29b-41d4-a716-446655440000";
  const validUUID2 = "550e8400-e29b-41d4-a716-446655440001";
  const isoDate = "2026-06-01T20:00:00.000Z";

  describe("createAppointment", () => {
    it("should fail if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const result = await createAppointment({ serviceId: validUUID, consultantId: validUUID2, startTime: isoDate });
      expect(result.error).toBe("Unauthorized");
    });

    it("should fail with invalid serviceId UUID", async () => {
      const result = await createAppointment({ serviceId: "not-a-uuid", consultantId: validUUID2, startTime: isoDate });
      expect(result.error).toBe("Invalid identifiers");
    });

    it("should fail with invalid consultantId UUID", async () => {
      const result = await createAppointment({ serviceId: validUUID, consultantId: "not-a-uuid", startTime: isoDate });
      expect(result.error).toBe("Invalid identifiers");
    });

    it("should fail with invalid start time", async () => {
      const result = await createAppointment({ serviceId: validUUID, consultantId: validUUID2, startTime: "not-a-date" });
      expect(result.error).toBe("Invalid start time");
    });

    it("should call RPC with correct parameters", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockSupabase.rpc.mockResolvedValue({ data: { id: "appt-123" }, error: null });

      const result = await createAppointment({ serviceId: validUUID, consultantId: validUUID2, startTime: isoDate, notes: "Test note" });
      expect(mockSupabase.rpc).toHaveBeenCalledWith("create_appointment", {
        p_service_id: validUUID, p_consultant_id: validUUID2, p_start_time: isoDate, p_notes: "Test note",
      });
      expect(result.success).toBe(true);
    });

    it("should handle RPC errors", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: "Database Error" } });
      const result = await createAppointment({ serviceId: validUUID, consultantId: validUUID2, startTime: isoDate });
      expect(result.error).toBe("Database Error");
    });
  });

  describe("cancelAppointment", () => {
    it("should fail if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect((await cancelAppointment({ appointmentId: validUUID })).error).toBe("Unauthorized");
    });

    it("should fail with invalid UUID", async () => {
      expect((await cancelAppointment({ appointmentId: "bad" })).error).toBe("Invalid appointment id");
    });

    it("should call cancel_appointment RPC", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockSvc.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: { client_id: "user-123" }, error: null })),
          })),
        })),
      });
      mockSvc.rpc.mockResolvedValue({ data: { id: validUUID }, error: null });
      const result = await cancelAppointment({ appointmentId: validUUID, reason: "No longer needed" });
      expect(mockSvc.rpc).toHaveBeenCalledWith("cancel_appointment", {
        p_appointment_id: validUUID, p_reason: "No longer needed", p_cancelled_by: "user-123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("rescheduleAppointment", () => {
    it("should fail with invalid UUID", async () => {
      expect((await rescheduleAppointment({ appointmentId: "bad", newStartTime: isoDate })).error).toBe("Invalid appointment id");
    });

    it("should fail with invalid start time", async () => {
      expect((await rescheduleAppointment({ appointmentId: validUUID, newStartTime: "bad" })).error).toBe("Invalid start time");
    });

    it.skip("should call reschedule_appointment RPC", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockSupabase.rpc.mockResolvedValue({ data: { id: validUUID }, error: null });
      const result = await rescheduleAppointment({ appointmentId: validUUID, newStartTime: isoDate });
      expect(mockSupabase.rpc).toHaveBeenCalledWith("reschedule_appointment", { p_appointment_id: validUUID, p_new_start_time: isoDate });
      expect(result.success).toBe(true);
    });
  });

  describe("adminConfirmAppointment", () => {
    it("should call admin_confirm_appointment RPC", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-123" } } });
      mockSupabase.rpc.mockResolvedValue({ data: { id: validUUID }, error: null });
      const result = await adminConfirmAppointment({ appointmentId: validUUID });
      expect(mockSupabase.rpc).toHaveBeenCalledWith("admin_confirm_appointment", { p_appointment_id: validUUID });
      expect(result.success).toBe(true);
    });
  });

  describe("adminManageAppointment", () => {
    it("should call admin_manage_appointment RPC", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-123" } } });
      mockSupabase.rpc.mockResolvedValue({ data: { id: validUUID }, error: null });
      const result = await adminManageAppointment({ appointmentId: validUUID, status: "confirmed", notes: "Confirmed" });
      expect(mockSupabase.rpc).toHaveBeenCalledWith("admin_manage_appointment", {
        p_appointment_id: validUUID, p_status: "confirmed", p_notes: "Confirmed", p_new_start_time: null,
      });
      expect(result.success).toBe(true);
    });
  });
});
