import { describe, it, expect, vi } from "vitest";
import { extractUserFromToken, isAuthorizedGroup } from "@/lib/auth-middleware";

describe("extractUserFromToken", () => {
  it("extracts user info from a valid bearer token payload", () => {
    const payload = {
      oid: "abc-123",
      name: "Jane Doe",
      preferred_username: "jane.doe@caireinc.com",
      groups: ["group-ea-id", "group-other-id"],
    };
    const user = extractUserFromToken(payload);
    expect(user).toEqual({
      entraId: "abc-123",
      name: "Jane Doe",
      email: "jane.doe@caireinc.com",
      groups: ["group-ea-id", "group-other-id"],
    });
  });

  it("returns null for missing oid", () => {
    const payload = { name: "Jane", preferred_username: "jane@caireinc.com" };
    const user = extractUserFromToken(payload as any);
    expect(user).toBeNull();
  });
});

describe("isAuthorizedGroup", () => {
  it("returns true when user belongs to allowed group", () => {
    const groups = ["group-ea-id", "group-other"];
    expect(isAuthorizedGroup(groups, "group-ea-id")).toBe(true);
  });

  it("returns false when user does not belong to allowed group", () => {
    const groups = ["group-other"];
    expect(isAuthorizedGroup(groups, "group-ea-id")).toBe(false);
  });

  it("returns false for empty groups", () => {
    expect(isAuthorizedGroup([], "group-ea-id")).toBe(false);
  });
});
