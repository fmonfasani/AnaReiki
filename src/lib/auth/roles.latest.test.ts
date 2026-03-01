import { describe, expect, it } from "vitest";
import { isAdminFromAppMetadata } from "./roles";

describe("isAdminFromAppMetadata", () => {
  it("returns false when user is null", () => {
    expect(isAdminFromAppMetadata(null)).toBe(false);
  });
});
