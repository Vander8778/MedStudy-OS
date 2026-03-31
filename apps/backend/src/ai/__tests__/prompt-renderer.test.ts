import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { PromptTemplateRecord } from "@medstudy/ai-schemas";
import { PromptRenderer } from "../prompts/prompt-renderer";

describe("PromptRenderer", () => {
  const renderer = new PromptRenderer();
  const template: PromptTemplateRecord = {
    key: "planning.session",
    version: "1.0.0",
    status: "active",
    description: "test template",
    systemPrompt: "System {{name}}",
    developerPrompt: "Count {{count}}",
    userPrompt: "Payload {{payload}}",
    inputSchema: z.object({
      name: z.string(),
      count: z.number(),
      payload: z.object({
        enabled: z.boolean()
      }).strict()
    }).strict()
  };

  it("assembles prompts with correct placeholder substitution", () => {
    const result = renderer.render(template, {
      name: "Planner",
      count: 2,
      payload: { enabled: true }
    });

    expect(result).toEqual({
      ok: true,
      systemPrompt: "System Planner",
      developerPrompt: "Count 2",
      userPrompt: 'Payload {\n  "enabled": true\n}',
      validatedInput: {
        name: "Planner",
        count: 2,
        payload: { enabled: true }
      }
    });
  });

  it("fails clearly when a placeholder is missing from the validated input", () => {
    const brokenTemplate: PromptTemplateRecord = {
      ...template,
      userPrompt: "Missing {{unknownField}}"
    };

    const result = renderer.render(brokenTemplate, {
      name: "Planner",
      count: 2,
      payload: { enabled: true }
    });

    expect(result).toEqual({
      ok: false,
      error: "Missing placeholder input: unknownField."
    });
  });

  it("fails when prompt input does not satisfy the template schema", () => {
    const result = renderer.render(template, {
      name: "Planner",
      count: "2",
      payload: { enabled: true }
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      error: "Prompt input validation failed."
    });
  });
});
