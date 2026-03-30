import { afterEach, describe, expect, it, vi } from "vitest";
import { TelemetryAnalysisScheduler } from "../telemetry-analysis.scheduler";

describe("TelemetryAnalysisScheduler", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("registers and deregisters sessions", () => {
    const scheduler = new TelemetryAnalysisScheduler(
      { processSessionAnalysis: vi.fn() } as never,
      { listSessionIdsByStates: vi.fn(async () => []) } as never
    );

    scheduler.registerSession("session_1");
    expect(scheduler.isRegistered("session_1")).toBe(true);

    scheduler.deregisterSession("session_1");
    expect(scheduler.isRegistered("session_1")).toBe(false);
  });

  it("re-registers active sessions on bootstrap", async () => {
    vi.useFakeTimers();

    const sessionRepository = {
      listSessionIdsByStates: vi.fn(async () => ["session_1", "session_2"])
    };
    const scheduler = new TelemetryAnalysisScheduler(
      { processSessionAnalysis: vi.fn(async () => ({ status: "no_new_events", deregister: false })) } as never,
      sessionRepository as never
    );

    await scheduler.onModuleInit();

    expect(sessionRepository.listSessionIdsByStates).toHaveBeenCalledWith([
      "active_valid",
      "active_warning"
    ]);
    expect(scheduler.isRegistered("session_1")).toBe(true);
    expect(scheduler.isRegistered("session_2")).toBe(true);

    scheduler.onModuleDestroy();
  });

  it("triggers processing only when a session is due", async () => {
    const worker = {
      processSessionAnalysis: vi.fn(async () => ({
        status: "no_new_events",
        deregister: false
      }))
    };
    const scheduler = new TelemetryAnalysisScheduler(
      worker as never,
      { listSessionIdsByStates: vi.fn(async () => []) } as never
    );

    scheduler.registerSession("session_future", 2_000);

    await scheduler.tick(1_000);
    expect(worker.processSessionAnalysis).not.toHaveBeenCalled();

    await scheduler.tick(2_000);
    expect(worker.processSessionAnalysis).toHaveBeenCalledWith("session_future");
  });

  it("prevents concurrent analysis for the same session", async () => {
    let release: (() => void) | undefined;
    const worker = {
      processSessionAnalysis: vi.fn(
        () =>
          new Promise((resolve) => {
            release = () => resolve({
              status: "no_new_events",
              deregister: false
            });
          })
      )
    };
    const scheduler = new TelemetryAnalysisScheduler(
      worker as never,
      { listSessionIdsByStates: vi.fn(async () => []) } as never
    );

    scheduler.registerSession("session_1", 0);

    const firstTick = scheduler.tick(0);
    const secondTick = scheduler.tick(0);

    expect(worker.processSessionAnalysis).toHaveBeenCalledTimes(1);

    release?.();
    await firstTick;
    await secondTick;
  });
});
