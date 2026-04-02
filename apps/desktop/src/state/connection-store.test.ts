import { beforeEach, describe, expect, it } from "vitest";
import { useConnectionStore } from "./connection-store";

describe("connection store", () => {
  beforeEach(() => {
    useConnectionStore.setState({
      state: "online",
      consecutiveFailures: 0,
      lastError: undefined
    });
  });

  it("enters degraded mode before going offline", () => {
    useConnectionStore.getState().recordFailure("poll 1");
    expect(useConnectionStore.getState().state).toBe("online");

    useConnectionStore.getState().recordFailure("poll 2");
    expect(useConnectionStore.getState().state).toBe("degraded");

    useConnectionStore.getState().recordFailure("poll 3");
    expect(useConnectionStore.getState().state).toBe("offline");
  });

  it("recovers cleanly on successful reconnect", () => {
    useConnectionStore.getState().recordFailure("poll 1");
    useConnectionStore.getState().recordFailure("poll 2");
    useConnectionStore.getState().setOnline();

    expect(useConnectionStore.getState().state).toBe("online");
    expect(useConnectionStore.getState().consecutiveFailures).toBe(0);
  });
});
