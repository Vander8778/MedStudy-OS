import { describe, expect, it } from "vitest";
import type { ContractDraftInput } from "../../lib/api-client";
import { validateContractDraft } from "../../lib/api-client";
import { validateContractForm } from "./ContractViews";

describe("contract form validation", () => {
  const invalidDraft: ContractDraftInput = {
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
  };

  it("rejects invalid drafts using the shared contracts schema", () => {
    expect(validateContractForm(invalidDraft)).toEqual({
      valid: false,
      errors: [
        "String must contain at least 1 character(s)",
        "String must contain at least 1 character(s)",
        "Number must be less than or equal to 100"
      ]
    });
  });

  it("matches the api-client draft validator", () => {
    expect(validateContractForm(invalidDraft)).toEqual(validateContractDraft(invalidDraft));
  });
});
