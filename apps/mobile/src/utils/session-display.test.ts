import { describe, expect, it } from "vitest";
import { getSessionDisplay } from "./session-display";

describe("session display mapping", () => {
  it("maps known session states to stable display tokens", () => {
    expect(getSessionDisplay("active_valid")).toEqual({
      label: "In Focus",
      color: "#15803d",
      icon: "play"
    });
    expect(getSessionDisplay("review_pending").label).toBe("Under Review");
  });

  it("degrades safely for unknown values", () => {
    expect(getSessionDisplay("mystery_state")).toEqual({
      label: "Unknown",
      color: "#64748b",
      icon: "help-circle"
    });
  });
});
