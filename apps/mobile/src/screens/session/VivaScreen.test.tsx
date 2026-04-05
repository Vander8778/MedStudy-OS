import { describe, expect, it } from "vitest";
import { getVivaConnectivityMessage } from "../../utils/screen-models";

describe("VivaScreen copy model", () => {
  it("shows the offline enforcement message when connectivity is unavailable", () => {
    expect(getVivaConnectivityMessage(false)).toContain(
      "Viva answers are never queued offline"
    );
    expect(getVivaConnectivityMessage(false)).toContain("Reconnect to continue");
    expect(getVivaConnectivityMessage(true)).toBeNull();
  });
});
