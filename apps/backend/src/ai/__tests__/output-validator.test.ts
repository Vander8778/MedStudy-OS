import { describe, expect, it } from "vitest";
import { z } from "zod";
import { OutputValidator } from "../validation/output-validator";

describe("OutputValidator", () => {
  const validator = new OutputValidator();
  const schema = z.object({
    value: z.string()
  }).strict();

  it("parses valid plain JSON", () => {
    const result = validator.validate('{"value":"ok"}', schema);

    expect(result).toEqual({
      ok: true,
      data: { value: "ok" },
      parsedJson: { value: "ok" }
    });
  });

  it("parses valid fenced JSON", () => {
    const result = validator.validate('```json\n{"value":"ok"}\n```', schema);

    expect(result).toEqual({
      ok: true,
      data: { value: "ok" },
      parsedJson: { value: "ok" }
    });
  });

  it("returns a failure for invalid JSON", () => {
    const result = validator.validate("not-json", schema);

    expect(result).toEqual({
      ok: false,
      error: "Model output did not contain valid JSON."
    });
  });

  it("returns schema issues for wrong JSON shape", () => {
    const result = validator.validate('{"value":123}', schema);

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      error: "Model output JSON failed schema validation."
    });
  });

  it("returns schema issues when required fields are missing", () => {
    const result = validator.validate("{}", schema);

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      error: "Model output JSON failed schema validation."
    });
  });

  it("rejects extra fields when the schema is strict", () => {
    const result = validator.validate(
      '{"value":"ok","extra":"nope"}',
      schema
    );

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      error: "Model output JSON failed schema validation."
    });
  });
});
