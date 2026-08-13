import { describe, expect, it } from "vitest";
import {
  assertAuthorized,
  isAuthorized,
  permissionsFor,
} from "@/domain/authorization";

describe("role authorization", () => {
  it("allows ordinary users to review without granting administration", () => {
    expect(isAuthorized("SME_USER", "SUBMIT_REVIEW")).toBe(true);
    expect(isAuthorized("SME_USER", "MANAGE_MEMBERS")).toBe(false);
  });

  it("keeps privileged integration and replay actions admin-only", () => {
    expect(permissionsFor("ADMIN")).toContain("CONFIGURE_INTEGRATIONS");
    expect(() =>
      assertAuthorized("INSURER_REVIEWER", "REPLAY_OUTBOUND"),
    ).toThrow(/not authorized/i);
  });
});
