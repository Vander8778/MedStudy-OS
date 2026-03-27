import { describe, expect, it } from "vitest";
import { calculateWeightedSessionScore } from "..";

describe("calculateWeightedSessionScore", () => {
  it("calculates a weighted score when all components are present", () => {
    const result = calculateWeightedSessionScore({
      validTimeScore: 90,
      processScore: 80,
      artifactScore: 70,
      knowledgeScore: 60
    });

    expect(result.sessionScore).toBe(77.5);
    expect(result.components.validTime.weight).toBeCloseTo(0.35);
    expect(result.components.process.weight).toBeCloseTo(0.2);
    expect(result.components.artifact.weight).toBeCloseTo(0.25);
    expect(result.components.knowledge.weight).toBeCloseTo(0.2);
  });

  it("redistributes one missing component proportionally", () => {
    const result = calculateWeightedSessionScore({
      validTimeScore: 90,
      processScore: 60,
      knowledgeScore: 30
    });

    expect(result.components.artifact).toEqual({
      raw: null,
      weight: 0,
      weighted: 0
    });
    expect(result.components.validTime.weight).toBeCloseTo(0.4666666667);
    expect(result.components.process.weight).toBeCloseTo(0.2666666667);
    expect(result.components.knowledge.weight).toBeCloseTo(0.2666666667);
    expect(result.sessionScore).toBe(66);
  });

  it("redistributes multiple missing components proportionally", () => {
    const result = calculateWeightedSessionScore({
      validTimeScore: 80,
      knowledgeScore: 100
    });

    expect(result.components.process.weight).toBe(0);
    expect(result.components.artifact.weight).toBe(0);
    expect(result.components.validTime.weight).toBeCloseTo(0.6363636364);
    expect(result.components.knowledge.weight).toBeCloseTo(0.3636363636);
    expect(result.sessionScore).toBe(87.27);
  });

  it("returns 0 when all components are missing", () => {
    const result = calculateWeightedSessionScore({});

    expect(result.sessionScore).toBe(0);
    expect(result.components.validTime.weight).toBe(0);
    expect(result.components.process.weight).toBe(0);
    expect(result.components.artifact.weight).toBe(0);
    expect(result.components.knowledge.weight).toBe(0);
  });

  it("handles boundary values 0 and 100", () => {
    const result = calculateWeightedSessionScore({
      validTimeScore: 0,
      processScore: 100,
      artifactScore: 0,
      knowledgeScore: 100
    });

    expect(result.sessionScore).toBe(40);
  });

  it("rounds the final weighted score to two decimals", () => {
    const result = calculateWeightedSessionScore({
      validTimeScore: 85,
      processScore: 85,
      artifactScore: 85,
      knowledgeScore: 84.975
    });

    expect(result.sessionScore).toBe(85);
  });
});
