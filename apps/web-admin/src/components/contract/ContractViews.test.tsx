import { describe, expect, it } from "vitest";
import { validateContractForm } from "./ContractViews";

describe("contract form validation", () => {
  it("rejects invalid drafts and accepts valid drafts", () => {
    expect(
      validateContractForm({
        userId: "",
        name: "",
        tags: [],
        activeRange: {
          startsAt: "2026-04-06T10:00:00.000Z",
          endsAt: "2026-04-07T10:00:00.000Z"
        },
        terms: {
          minValidMinutes: 0,
          maxMissedCheckpoints: 1,
          mandatoryArtifactTypes: ["final_submission"],
          vivaPassingScore: 140
        }
      })
    ).toEqual({
      valid: false,
      errors: [
        "User is required.",
        "Name is required.",
        "Minimum valid minutes must be positive.",
        "Viva passing score must be between 0 and 100."
      ]
    });
  });
});
