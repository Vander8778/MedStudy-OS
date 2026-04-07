import type {
  Artifact,
  Checkpoint,
  Contract,
  Penalty,
  Session,
  SessionBlock,
  SessionEvent,
  VivaAttempt
} from "@medstudy/domain";
import type { SessionAggregate } from "../modules/session/session.repository";
import { buildContract } from "./contract.factory";

export function buildSession(overrides: Partial<Session> = {}): Session {
  const { plannedRange: plannedRangeOverrides, ...sessionOverrides } = overrides;

  const plannedRange = {
    startsAt: "2026-04-07T09:00:00.000Z" as Session["plannedRange"]["startsAt"],
    endsAt: "2026-04-07T10:00:00.000Z" as Session["plannedRange"]["endsAt"],
    ...(plannedRangeOverrides ?? {})
  };

  return {
    id: "session_fixture" as Session["id"],
    userId: "user_fixture" as Session["userId"],
    profileId: "profile_fixture" as Session["profileId"],
    contractId: "contract_fixture" as Session["contractId"],
    title: "Fixture session",
    objective: "Validate backend integration wiring.",
    state: "planned",
    validMinutes: 0 as Session["validMinutes"],
    invalidMinutes: 0 as Session["invalidMinutes"],
    warningCount: 0,
    missedCheckpointCount: 0,
    finalArtifactRequired: true,
    blockIds: [],
    checkpointIds: [],
    artifactIds: [],
    evaluationIds: [],
    vivaAttemptIds: [],
    penaltyIds: [],
    createdAt: "2026-04-07T08:55:00.000Z" as Session["createdAt"],
    updatedAt: "2026-04-07T08:55:00.000Z" as Session["updatedAt"],
    ...sessionOverrides,
    plannedRange: plannedRange as Session["plannedRange"]
  };
}

export function buildSessionAggregate(overrides: {
  session?: Partial<Session>;
  contract?: Partial<Contract>;
  blocks?: readonly SessionBlock[];
  artifacts?: readonly Artifact[];
  checkpoints?: readonly Checkpoint[];
  vivaAttempts?: readonly VivaAttempt[];
  penalties?: readonly Penalty[];
  events?: readonly SessionEvent[];
} = {}): SessionAggregate {
  const contract = buildContract(overrides.contract);
  const session = buildSession({
    contractId: contract.id,
    userId: contract.userId,
    ...(overrides.session ?? {})
  });

  return {
    session,
    contract,
    blocks: [...(overrides.blocks ?? [])],
    artifacts: [...(overrides.artifacts ?? [])],
    checkpoints: [
      ...(
        overrides.checkpoints ?? [
          {
            id: "checkpoint_fixture" as Checkpoint["id"],
            sessionId: session.id,
            order: 1,
            title: "Checkpoint 1",
            status: "pending",
            dueAt: "2026-04-07T09:30:00.000Z" as Checkpoint["dueAt"],
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
          }
        ]
      )
    ],
    vivaAttempts: [...(overrides.vivaAttempts ?? [])],
    penalties: [...(overrides.penalties ?? [])],
    events: [
      ...(
        overrides.events ?? [
          {
            id: "event_planned" as SessionEvent["id"],
            sessionId: session.id,
            type: "planned",
            actor: { actorType: "system", label: "fixture.create_session" },
            state: session.state,
            occurredAt: session.createdAt
          }
        ]
      )
    ]
  };
}
