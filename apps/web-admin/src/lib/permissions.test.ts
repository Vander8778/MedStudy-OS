import { describe, expect, it } from "vitest";
import { canUseAdminAction, getVisibleNavItems } from "./permissions";

describe("web admin permissions", () => {
  it("shows fewer actions for support", () => {
    expect(canUseAdminAction("admin", "override")).toBe(true);
    expect(canUseAdminAction("support", "override")).toBe(false);
    expect(canUseAdminAction("support", "force_review")).toBe(true);
  });

  it("keeps contracts out of support navigation", () => {
    expect(getVisibleNavItems("admin").some((item) => item.href === "/contracts")).toBe(true);
    expect(getVisibleNavItems("support").some((item) => item.href === "/contracts")).toBe(
      false
    );
  });
});
