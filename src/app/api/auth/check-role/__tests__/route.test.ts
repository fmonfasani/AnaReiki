import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

async function callRoute(): Promise<Response> {
  const { GET } = await import("@/app/api/auth/check-role/route");
  return GET();
}

describe("GET /api/auth/check-role", () => {
  const mockSupabase = {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });

  it("should return isAdmin=false when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const res = await callRoute();
    const body = await res.json();

    expect(body).toEqual({ isAdmin: false, role: null });
  });

  it("should return isAdmin=true for owner user", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "owner-1" } } });
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: { role: "owner" }, error: null })),
        })),
      })),
    });

    const res = await callRoute();
    const body = await res.json();

    expect(body).toEqual({ isAdmin: true, role: "owner" });
  });

  it("should return isAdmin=true for admin user", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: { role: "admin" }, error: null })),
        })),
      })),
    });

    const res = await callRoute();
    const body = await res.json();

    expect(body).toEqual({ isAdmin: true, role: "admin" });
  });

  it("should return isAdmin=false for consultante user", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: { role: "consultante" }, error: null })),
        })),
      })),
    });

    const res = await callRoute();
    const body = await res.json();

    expect(body).toEqual({ isAdmin: false, role: "consultante" });
  });

  it("should default to consultante role when profile is null", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: { message: "Not found" } })),
        })),
      })),
    });

    const res = await callRoute();
    const body = await res.json();

    expect(body).toEqual({ isAdmin: false, role: "consultante" });
  });
});
