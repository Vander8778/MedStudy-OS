import { Injectable } from "@nestjs/common";
import type { ZodType } from "zod";
import type { OutputValidationFailure, OutputValidationSuccess } from "../types";

@Injectable()
export class OutputValidator {
  private extractJsonCandidate(rawText: string): string {
    const trimmed = rawText.trim();
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

    if (fencedMatch?.[1]) {
      return fencedMatch[1].trim();
    }

    return trimmed;
  }

  validate<TOutput>(
    rawText: string,
    schema: ZodType<TOutput>
  ): OutputValidationSuccess<TOutput> | OutputValidationFailure {
    const candidate = this.extractJsonCandidate(rawText);
    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(candidate);
    } catch {
      return {
        ok: false,
        error: "Model output did not contain valid JSON."
      };
    }

    const parsed = schema.safeParse(parsedJson);

    if (!parsed.success) {
      return {
        ok: false,
        error: "Model output JSON failed schema validation.",
        validationErrors: parsed.error.issues
      };
    }

    return {
      ok: true,
      data: parsed.data,
      parsedJson
    };
  }
}
