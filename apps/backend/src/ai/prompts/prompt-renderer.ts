import { Injectable } from "@nestjs/common";
import type { PromptTemplateRecord } from "@medstudy/ai-schemas";
import type { PromptRenderFailure, PromptRenderSuccess } from "../types";

const PLACEHOLDER_PATTERN = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

@Injectable()
export class PromptRenderer {
  private formatValue(value: unknown): string {
    if (typeof value === "string") {
      return value;
    }

    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      return String(value);
    }

    return JSON.stringify(value, null, 2);
  }

  private getPlaceholders(template: string): string[] {
    return [...template.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1] ?? "");
  }

  private renderText(
    template: string,
    context: Record<string, unknown>
  ): PromptRenderFailure | { ok: true; value: string } {
    let rendered = template;

    for (const placeholder of this.getPlaceholders(template)) {
      if (!(placeholder in context)) {
        return {
          ok: false,
          error: `Missing placeholder input: ${placeholder}.`
        };
      }

      const value = context[placeholder];

      if (value === undefined) {
        return {
          ok: false,
          error: `Placeholder ${placeholder} resolved to undefined.`
        };
      }

      const token = new RegExp(`{{\\s*${placeholder}\\s*}}`, "g");
      rendered = rendered.replace(token, this.formatValue(value));
    }

    return {
      ok: true,
      value: rendered
    };
  }

  render<TInput>(
    template: PromptTemplateRecord,
    input: unknown
  ): PromptRenderSuccess<TInput> | PromptRenderFailure {
    const parsed = template.inputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: "Prompt input validation failed.",
        issues: parsed.error.issues
      };
    }

    const context = parsed.data as Record<string, unknown>;
    const systemResult = this.renderText(template.systemPrompt, context);

    if (!systemResult.ok) {
      return systemResult;
    }

    const developerResult = template.developerPrompt
      ? this.renderText(template.developerPrompt, context)
      : { ok: true as const, value: undefined };

    if (!developerResult.ok) {
      return developerResult;
    }

    const userResult = this.renderText(template.userPrompt, context);

    if (!userResult.ok) {
      return userResult;
    }

    return {
      ok: true,
      systemPrompt: systemResult.value,
      developerPrompt: developerResult.value,
      userPrompt: userResult.value,
      validatedInput: parsed.data as TInput
    };
  }
}
