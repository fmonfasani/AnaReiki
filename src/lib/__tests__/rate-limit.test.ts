import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("permite la primera solicitud", () => {
    const result = rateLimit("test-1", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("bloquea cuando se excede el límite", () => {
    const key = "test-2";
    const max = 3;
    for (let i = 0; i < max + 1; i++) {
      const r = rateLimit(key, max, 60_000);
      if (i < max) expect(r.allowed).toBe(true);
      else expect(r.allowed).toBe(false);
    }
  });

  it("reinicia después de la ventana", async () => {
    const key = "test-3";
    rateLimit(key, 1, 50);
    const blocked = rateLimit(key, 1, 50);
    expect(blocked.allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 60));
    const after = rateLimit(key, 1, 50);
    expect(after.allowed).toBe(true);
  });

  it("usa claves diferentes independientemente", () => {
    rateLimit("alice", 1, 60_000);
    const alice2 = rateLimit("alice", 1, 60_000);
    expect(alice2.allowed).toBe(false);

    const bob = rateLimit("bob", 1, 60_000);
    expect(bob.allowed).toBe(true);
  });
});
