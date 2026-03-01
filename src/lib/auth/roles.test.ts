import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { isAdminFromAppMetadata } from "./roles";

describe("isAdminFromAppMetadata", () => {
  it("returns true when app_metadata.roles includes admin", () => {
    const user = {
      app_metadata: { roles: ["member", "admin"] },
    } as User;

    expect(isAdminFromAppMetadata(user)).toBe(true);
  });

  it("returns true when app_metadata.role is admin", () => {
    const user = {
      app_metadata: { role: "admin" },
    } as User;

    expect(isAdminFromAppMetadata(user)).toBe(true);
  });
});
