import type { Contract } from "@medstudy/domain";

export function buildContract(overrides: Partial<Contract> = {}): Contract {
  const { terms: termsOverrides, activeRange: activeRangeOverrides, ...contractOverrides } =
    overrides;

  const terms = {
    minValidMinutes: 45 as Contract["terms"]["minValidMinutes"],
    maxMissedCheckpoints: 1,
    mandatoryArtifactTypes: ["final_submission"] as Contract["terms"]["mandatoryArtifactTypes"],
    vivaPassingScore: 70 as Contract["terms"]["vivaPassingScore"],
    checkpointIntervalMinutes: 30 as Contract["terms"]["checkpointIntervalMinutes"],
    maxPauseMinutes: 10 as Contract["terms"]["maxPauseMinutes"],
    ...(termsOverrides ?? {})
  };

  const activeRange = {
    startsAt: "2026-04-07T09:00:00.000Z" as Contract["activeRange"]["startsAt"],
    endsAt: "2026-04-30T09:00:00.000Z" as Contract["activeRange"]["endsAt"],
    ...(activeRangeOverrides ?? {})
  };

  return {
    id: "contract_fixture" as Contract["id"],
    userId: "user_fixture" as Contract["userId"],
    name: "Fixture contract",
    description: "Fixture contract for orchestration tests.",
    status: "active",
    terms,
    activeRange,
    tags: ["fixture"],
    createdAt: "2026-04-07T08:00:00.000Z" as Contract["createdAt"],
    updatedAt: "2026-04-07T08:00:00.000Z" as Contract["updatedAt"],
    ...contractOverrides
  };
}
