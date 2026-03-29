import { Injectable, PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";
import { ValidationException } from "./exceptions";

@Injectable()
export class ZodValidationPipe<TInput = unknown> implements PipeTransform {
  constructor(private readonly schema: ZodType<TInput>) {}

  transform(value: unknown): TInput {
    const parsed = this.schema.safeParse(value);

    if (!parsed.success) {
      throw new ValidationException({
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          code: issue.code,
          message: issue.message
        }))
      });
    }

    return parsed.data;
  }
}
