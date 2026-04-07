import type { Profile, User } from "@medstudy/contracts";

export type UserFixture = {
  user: User;
  profile: Profile;
};

type UserFixtureOverrides = {
  user?: Partial<User>;
  profile?: Partial<Profile>;
};

export function buildUser(overrides: UserFixtureOverrides = {}): UserFixture {
  const user: User = {
    id: "user_fixture",
    email: "student@medstudy.local",
    role: "student",
    status: "active",
    createdAt: "2026-04-07T08:00:00.000Z",
    updatedAt: "2026-04-07T08:00:00.000Z",
    ...overrides.user
  };

  const { userId: profileUserId, ...profileOverrides } = overrides.profile ?? {};
  const profile: Profile = {
    id: "profile_fixture",
    displayName: "Fixture Student",
    studyStage: "clinical",
    timezone: "UTC",
    locale: "en-US",
    createdAt: "2026-04-07T08:00:00.000Z",
    updatedAt: "2026-04-07T08:00:00.000Z",
    ...profileOverrides,
    userId: profileUserId ?? user.id
  };

  return { user, profile };
}
