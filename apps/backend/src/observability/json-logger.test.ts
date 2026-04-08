import { afterEach, describe, expect, it, vi } from "vitest";
import { resetEnvForTests } from "../config/env";
import { JsonLogger } from "./json-logger";

describe("JsonLogger", () => {
  afterEach(() => {
    resetEnvForTests();
    delete process.env.LOG_LEVEL;
    vi.restoreAllMocks();
  });

  it("suppresses logs below the configured level", () => {
    process.env.LOG_LEVEL = "warn";
    resetEnvForTests();

    const stdoutWrite = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const stderrWrite = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    const logger = new JsonLogger();

    logger.debug("debug message");
    logger.log("info message");
    logger.warn("warn message");
    logger.error("error message");

    expect(stdoutWrite).toHaveBeenCalledTimes(1);
    expect(stderrWrite).toHaveBeenCalledTimes(1);
    expect(String(stdoutWrite.mock.calls[0]?.[0])).toContain('"level":"warn"');
    expect(String(stderrWrite.mock.calls[0]?.[0])).toContain('"level":"error"');
  });
});
