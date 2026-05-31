import { describe, it, expect, vi } from "vitest";
import { isAdmin } from "@/lib/auth/roles";

describe("isAdmin", () => {
  const mockSupabase = {
    from: vi.fn(),
  };

  function mockChain(data: unknown) {
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      single: vi.fn(() => chain),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.single.mockResolvedValue(data);
    return chain;
  }

  it("should return false if user is null", async () => {
    expect(await isAdmin(null, mockSupabase as never)).toBe(false);
  });

  it("should return true if role is admin", async () => {
    mockSupabase.from.mockReturnValue(mockChain({ data: { role: "admin" }, error: null }));
    const result = await isAdmin({ id: "user-1" } as never, mockSupabase as never);
    expect(result).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
  });

  it("should return false if role is consultante", async () => {
    mockSupabase.from.mockReturnValue(mockChain({ data: { role: "consultante" }, error: null }));
    expect(await isAdmin({ id: "user-2" } as never, mockSupabase as never)).toBe(false);
  });

  it("should return false if profile data is null (query error)", async () => {
    mockSupabase.from.mockReturnValue(mockChain({ data: null, error: { message: "Not found" } }));
    expect(await isAdmin({ id: "user-3" } as never, mockSupabase as never)).toBe(false);
  });

  it("should query profiles by user id", async () => {
    const chain = mockChain({ data: { role: "admin" }, error: null });
    mockSupabase.from.mockReturnValue(chain);

    await isAdmin({ id: "specific-user" } as never, mockSupabase as never);
    expect(chain.eq).toHaveBeenCalledWith("id", "specific-user");
  });
});
