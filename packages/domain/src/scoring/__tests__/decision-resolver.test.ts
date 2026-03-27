import { describe, expect, it } from "vitest";
import { resolveScoringDecision } from "..";

describe("resolveScoringDecision", () => {
  it("lets hard fail override a high weighted score", () => {
    const result = resolveScoringDecision(98, {
      triggered: true,
      reasons: ["critical_contract_violation"]
    });

    expect(result).toEqual({
      outcome: "failed",
      decisionTrace: {
        decidedByHardFail: true
      }
    });
  });

  it("resolves 64.99 to failed", () => {
    const result = resolveScoringDecision(64.99, {
      triggered: false,
      reasons: []
    });

    expect(result.outcome).toBe("failed");
    expect(result.decisionTrace.scoreThresholdApplied).toEqual({
      min: 0,
      max: 65,
      outcome: "failed"
    });
  });

  it("resolves 65 to partial", () => {
    const result = resolveScoringDecision(65, {
      triggered: false,
      reasons: []
    });

    expect(result.outcome).toBe("partial");
  });

  it("resolves 84.99 to partial", () => {
    const result = resolveScoringDecision(84.99, {
      triggered: false,
      reasons: []
    });

    expect(result.outcome).toBe("partial");
  });

  it("resolves 85 to completed", () => {
    const result = resolveScoringDecision(85, {
      triggered: false,
      reasons: []
    });

    expect(result.outcome).toBe("completed");
    expect(result.decisionTrace.scoreThresholdApplied).toEqual({
      min: 85,
      max: 100,
      outcome: "completed"
    });
  });
});
