import { describe, expect, it } from "vitest";
import { clearActionNote, getPenaltyActionKey } from "../lib/admin-page-state";

describe("dashboard action note helpers", () => {
  it("clears only the targeted session action note", () => {
    expect(
      clearActionNote(
        {
          excuse: "excuse note",
          penalize: "penalty note"
        },
        "excuse"
      )
    ).toEqual({
      penalize: "penalty note"
    });
  });

  it("creates distinct keys for each penalty action", () => {
    expect(getPenaltyActionKey("penalty_1", "confirm")).toBe("penalty_1:confirm");
    expect(getPenaltyActionKey("penalty_1", "revoke")).toBe("penalty_1:revoke");
    expect(getPenaltyActionKey("penalty_1", "confirm")).not.toBe(
      getPenaltyActionKey("penalty_1", "revoke")
    );
  });
});
