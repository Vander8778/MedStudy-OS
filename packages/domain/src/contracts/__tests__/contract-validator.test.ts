import { describe, expect, it } from "vitest";
import { validateContractTerms, type ContractValidationInput } from "..";

function createValidationInput(
  overrides: Partial<ContractValidationInput> = {}
): ContractValidationInput {
  return {
    terms: {
      minValidMinutes: 90,
      maxMissedCheckpoints: 1,
      mandatoryArtifactTypes: ["summary", "final_submission"],
      vivaPassingScore: 70,
      checkpointIntervalMinutes: 30,
      maxPauseMinutes: 20
    },
    activeRange: {
      startsAt: "2026-03-28T09:00:00+03:00",
      endsAt: "2026-03-28T12:00:00+03:00"
    },
    ...overrides
  };
}

function expectInvalidResult(
  result: ReturnType<typeof validateContractTerms>
): asserts result is { valid: false; issues: readonly { code: string }[] } {
  expect(result.valid).toBe(false);
}

describe("validateContractTerms", () => {
  it("accepts a valid contract happy path", () => {
    expect(validateContractTerms(createValidationInput())).toEqual({ valid: true });
  });

  it("rejects minValidMinutes when it is less than or equal to 0", () => {
    const result = validateContractTerms(
      createValidationInput({
        terms: {
          ...createValidationInput().terms,
          minValidMinutes: 0
        }
      })
    );

    expectInvalidResult(result);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "min_valid_minutes_not_positive"
      })
    );
  });

  it("rejects minValidMinutes when it exceeds the active range duration", () => {
    const result = validateContractTerms(
      createValidationInput({
        terms: {
          ...createValidationInput().terms,
          minValidMinutes: 181
        }
      })
    );

    expectInvalidResult(result);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "min_valid_minutes_exceeds_duration"
      })
    );
  });

  it("rejects negative maxMissedCheckpoints", () => {
    const result = validateContractTerms(
      createValidationInput({
        terms: {
          ...createValidationInput().terms,
          maxMissedCheckpoints: -1
        }
      })
    );

    expectInvalidResult(result);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "max_missed_checkpoints_negative"
      })
    );
  });

  it("rejects vivaPassingScore below 0", () => {
    const result = validateContractTerms(
      createValidationInput({
        terms: {
          ...createValidationInput().terms,
          vivaPassingScore: -1
        }
      })
    );

    expectInvalidResult(result);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "viva_passing_score_out_of_range"
      })
    );
  });

  it("rejects vivaPassingScore above 100", () => {
    const result = validateContractTerms(
      createValidationInput({
        terms: {
          ...createValidationInput().terms,
          vivaPassingScore: 101
        }
      })
    );

    expectInvalidResult(result);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "viva_passing_score_out_of_range"
      })
    );
  });

  it("rejects invalid activeRange ordering", () => {
    const result = validateContractTerms(
      createValidationInput({
        activeRange: {
          startsAt: "2026-03-28T12:00:00+03:00",
          endsAt: "2026-03-28T09:00:00+03:00"
        }
      })
    );

    expectInvalidResult(result);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "active_range_invalid"
      })
    );
  });

  it("rejects empty strings in mandatoryArtifactTypes", () => {
    const result = validateContractTerms(
      createValidationInput({
        terms: {
          ...createValidationInput().terms,
          mandatoryArtifactTypes: ["summary", " "]
        }
      })
    );

    expectInvalidResult(result);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "empty_artifact_type"
      })
    );
  });

  it("rejects maxPauseMinutes when it is less than or equal to 0", () => {
    const result = validateContractTerms(
      createValidationInput({
        terms: {
          ...createValidationInput().terms,
          maxPauseMinutes: 0
        }
      })
    );

    expectInvalidResult(result);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "max_pause_minutes_not_positive"
      })
    );
  });

  it("rejects maxPauseMinutes when it exceeds the active range duration", () => {
    const result = validateContractTerms(
      createValidationInput({
        terms: {
          ...createValidationInput().terms,
          maxPauseMinutes: 181
        }
      })
    );

    expectInvalidResult(result);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "max_pause_minutes_exceeds_duration"
      })
    );
  });

  it("rejects checkpointIntervalMinutes when it is less than or equal to 0", () => {
    const result = validateContractTerms(
      createValidationInput({
        terms: {
          ...createValidationInput().terms,
          checkpointIntervalMinutes: 0
        }
      })
    );

    expectInvalidResult(result);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "checkpoint_interval_not_positive"
      })
    );
  });

  it("accepts checkpointIntervalMinutes when it exceeds the active range duration", () => {
    expect(
      validateContractTerms(
        createValidationInput({
          terms: {
            ...createValidationInput().terms,
            checkpointIntervalMinutes: 240
          }
        })
      )
    ).toEqual({ valid: true });
  });

  it("returns multiple simultaneous validation issues together", () => {
    const result = validateContractTerms({
      terms: {
        minValidMinutes: 0,
        maxMissedCheckpoints: -1,
        mandatoryArtifactTypes: ["", "summary"],
        vivaPassingScore: 101,
        checkpointIntervalMinutes: 0,
        maxPauseMinutes: 0
      },
      activeRange: {
        startsAt: "2026-03-28T09:00:00+03:00",
        endsAt: "2026-03-28T09:00:00+03:00"
      }
    });

    expectInvalidResult(result);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "min_valid_minutes_not_positive",
      "max_missed_checkpoints_negative",
      "viva_passing_score_out_of_range",
      "active_range_invalid",
      "empty_artifact_type",
      "max_pause_minutes_not_positive",
      "checkpoint_interval_not_positive"
    ]);
  });
});
