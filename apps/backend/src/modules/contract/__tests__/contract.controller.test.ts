import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContractController } from "../contract.controller";

function createContract() {
  return {
    id: "contract_1",
    userId: "user_1",
    name: "Core contract",
    description: "Contract description",
    status: "active",
    terms: {
      minValidMinutes: 60,
      maxMissedCheckpoints: 1,
      mandatoryArtifactTypes: ["final_submission"],
      vivaPassingScore: 70,
      checkpointIntervalMinutes: 30,
      maxPauseMinutes: 10
    },
    activeRange: {
      startsAt: "2026-03-29T09:00:00.000Z",
      endsAt: "2026-03-29T11:00:00.000Z"
    },
    tags: ["focus"],
    metadata: { hidden: true },
    createdAt: "2026-03-29T08:00:00.000Z",
    updatedAt: "2026-03-29T08:00:00.000Z"
  };
}

describe("ContractController", () => {
  const service = {
    createContract: vi.fn(),
    getContract: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates createContract once and returns ContractResponse", async () => {
    service.createContract.mockResolvedValue(createContract());
    const controller = new ContractController(service as never);

    const result = await controller.createContract({
      userId: "user_1",
      name: "Core contract",
      activeRange: {
        startsAt: "2026-03-29T09:00:00.000Z",
        endsAt: "2026-03-29T11:00:00.000Z"
      },
      terms: {
        minValidMinutes: 60,
        maxMissedCheckpoints: 1,
        mandatoryArtifactTypes: ["final_submission"],
        vivaPassingScore: 70
      }
    });

    expect(service.createContract).toHaveBeenCalledTimes(1);
    expect(service.getContract).not.toHaveBeenCalled();
    expect(result.contract.name).toBe("Core contract");
    expect("metadata" in result.contract).toBe(false);
  });

  it("delegates getContract once and returns ContractResponse", async () => {
    service.getContract.mockResolvedValue(createContract());
    const controller = new ContractController(service as never);

    const result = await controller.getContract("contract_1");

    expect(service.getContract).toHaveBeenCalledWith("contract_1");
    expect(service.getContract).toHaveBeenCalledTimes(1);
    expect(service.createContract).not.toHaveBeenCalled();
    expect(result.contract.status).toBe("active");
  });
});
