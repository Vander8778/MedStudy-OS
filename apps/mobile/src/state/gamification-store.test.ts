import { beforeEach, describe, expect, it, vi } from "vitest";

const equipAvatarMock = vi.fn();

vi.mock("../services/mobile-api", () => ({
  getMobileApiClient: () => ({
    getProgress: vi.fn(),
    equipAvatar: equipAvatarMock
  })
}));

import { useGamificationStore } from "./gamification-store";

describe("gamification store", () => {
  beforeEach(() => {
    useGamificationStore.getState().invalidate();
    equipAvatarMock.mockReset();
  });

  it("rolls back an optimistic avatar equip when the api rejects it", async () => {
    useGamificationStore.setState({
      progress: null,
      avatars: [],
      equippedAvatarId: "avatar_1",
      recentXpAwards: [],
      isLoading: false,
      error: undefined,
      cacheState: "fresh"
    });

    equipAvatarMock.mockRejectedValueOnce(new Error("Equip failed"));

    await expect(
      useGamificationStore.getState().equipAvatar("avatar_2", true)
    ).rejects.toThrow("Equip failed");

    expect(useGamificationStore.getState().equippedAvatarId).toBe("avatar_1");
  });
});
