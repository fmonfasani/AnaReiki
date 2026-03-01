import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAppointment } from "@/actions/appointments";
import { createClient } from "@/lib/supabase/server";

// Mock next/cache
vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(),
}));

describe("Appointments Server Actions", () => {
    const mockSupabase = {
        auth: {
            getUser: vi.fn(),
        },
        rpc: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (createClient as any).mockResolvedValue(mockSupabase);
    });

    it("should fail if user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

        const result = await createAppointment({
            serviceId: "550e8400-e29b-41d4-a716-446655440000",
            consultantId: "550e8400-e29b-41d4-a716-446655440001",
            startTime: new Date().toISOString(),
        });

        expect(result.error).toBe("Unauthorized");
    });

    it("should call RPC with correct parameters", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: "user-123" } }
        });
        mockSupabase.rpc.mockResolvedValue({ data: { id: "appt-123" }, error: null });

        const serviceId = "550e8400-e29b-41d4-a716-446655440000";
        const consultantId = "550e8400-e29b-41d4-a716-446655440001";
        const startTime = "2026-03-01T20:00:00.000Z";

        const result = await createAppointment({
            serviceId,
            consultantId,
            startTime,
            notes: "Hello",
        });

        expect(mockSupabase.rpc).toHaveBeenCalledWith("create_appointment", {
            p_service_id: serviceId,
            p_consultant_id: consultantId,
            p_start_time: startTime,
            p_notes: "Hello",
        });
        expect(result.success).toBe(true);
    });

    it("should handle RPC errors", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: "user-123" } }
        });
        mockSupabase.rpc.mockResolvedValue({
            data: null,
            error: { message: "Database Error" }
        });

        const result = await createAppointment({
            serviceId: "550e8400-e29b-41d4-a716-446655440000",
            consultantId: "550e8400-e29b-41d4-a716-446655440001",
            startTime: "2026-03-01T20:00:00.000Z",
        });

        expect(result.error).toBe("Database Error");
    });
});
