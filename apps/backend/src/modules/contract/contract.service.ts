import { BadRequestException, Injectable } from "@nestjs/common";
import { validateContractTerms, type Contract } from "@medstudy/domain";
import { createId } from "../../common/backend-utils";
import { ContractRepository } from "./contract.repository";

export type CreateContractCommand = {
  userId: string;
  name: string;
  description?: string;
  activeRange: {
    startsAt: string;
    endsAt: string;
  };
  terms: {
    minValidMinutes: number;
    maxMissedCheckpoints: number;
    mandatoryArtifactTypes: readonly string[];
    vivaPassingScore: number;
    checkpointIntervalMinutes?: number;
    maxPauseMinutes?: number;
  };
  tags?: readonly string[];
  metadata?: Record<string, unknown>;
};

@Injectable()
export class ContractService {
  constructor(private readonly contractRepository: ContractRepository) {}

  async createContract(command: CreateContractCommand) {
    const validation = validateContractTerms({
      terms: command.terms,
      activeRange: command.activeRange
    });

    if (!validation.valid) {
      throw new BadRequestException({
        message: "Contract terms are invalid.",
        issues: validation.issues
      });
    }

    const now = new Date().toISOString();
    const contract: Contract = {
      id: createId("contract") as Contract["id"],
      userId: command.userId as Contract["userId"],
      name: command.name,
      description: command.description,
      status: "active",
      terms: {
        minValidMinutes: command.terms.minValidMinutes as Contract["terms"]["minValidMinutes"],
        maxMissedCheckpoints: command.terms.maxMissedCheckpoints,
        mandatoryArtifactTypes: command.terms.mandatoryArtifactTypes as Contract["terms"]["mandatoryArtifactTypes"],
        vivaPassingScore: command.terms.vivaPassingScore as Contract["terms"]["vivaPassingScore"],
        checkpointIntervalMinutes:
          command.terms.checkpointIntervalMinutes as Contract["terms"]["checkpointIntervalMinutes"],
        maxPauseMinutes: command.terms.maxPauseMinutes as Contract["terms"]["maxPauseMinutes"]
      },
      activeRange: {
        startsAt: command.activeRange.startsAt as Contract["activeRange"]["startsAt"],
        endsAt: command.activeRange.endsAt as Contract["activeRange"]["endsAt"]
      },
      tags: [...(command.tags ?? [])],
      metadata: command.metadata,
      createdAt: now as Contract["createdAt"],
      updatedAt: now as Contract["updatedAt"]
    };

    return this.contractRepository.create(contract);
  }

  getContract(id: string) {
    return this.contractRepository.findByIdOrThrow(id);
  }
}
