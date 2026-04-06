import { describe, expect, it } from "vitest";
import {
  canUseAdminAction,
  getConservativeSessionActions,
  getVisibleNavItems
} from "./permissions";

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

  it("filters conservative actions by role and session state", () => {
    expect(getConservativeSessionActions("support", "completed")).toEqual(["force_review"]);
    expect(getConservativeSessionActions("admin", "completed")).toEqual(["force_review", "override"]);
    expect(getConservativeSessionActions("admin", "failed")).toContain("excuse");
    expect(getConservativeSessionActions("admin", "completed")).not.toContain("excuse");
    expect(getConservativeSessionActions("admin", "penalized")).not.toContain("penalize");
  });
});
