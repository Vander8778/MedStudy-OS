import { Injectable } from "@nestjs/common";
import type { Contract } from "@medstudy/domain";
import { ContractNotFoundException } from "../../common/exceptions";
import { PrismaService } from "../../prisma/prisma.service";
import { fromDate, parseJson, serializeJson, toDate } from "../../common/backend-utils";

@Injectable()
export class ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureUserExists(userId: string) {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@medstudy.local`,
        role: "student",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async create(contract: Contract) {
    await this.ensureUserExists(contract.userId);

    await this.prisma.contract.create({
      data: {
        id: contract.id,
        userId: contract.userId,
        name: contract.name,
        description: contract.description,
        status: contract.status,
        minValidMinutes: contract.terms.minValidMinutes,
        maxMissedCheckpoints: contract.terms.maxMissedCheckpoints,
        mandatoryArtifactTypesJson: serializeJson(contract.terms.mandatoryArtifactTypes),
        vivaPassingScore: contract.terms.vivaPassingScore,
        checkpointIntervalMinutes: contract.terms.checkpointIntervalMinutes,
        maxPauseMinutes: contract.terms.maxPauseMinutes,
        activeRangeStartsAt: toDate(contract.activeRange.startsAt),
        activeRangeEndsAt: toDate(contract.activeRange.endsAt),
        signedAt: contract.signedAt ? toDate(contract.signedAt) : null,
        activatedAt: contract.activatedAt ? toDate(contract.activatedAt) : null,
        endedAt: contract.endedAt ? toDate(contract.endedAt) : null,
        tagsJson: serializeJson(contract.tags),
        metadataJson: contract.metadata ? serializeJson(contract.metadata) : null,
        createdAt: toDate(contract.createdAt),
        updatedAt: toDate(contract.updatedAt)
      }
    });

    return contract;
  }

  async findByIdOrThrow(id: string): Promise<Contract> {
    const record = await this.prisma.contract.findUnique({ where: { id } });

    if (!record) {
      throw new ContractNotFoundException(id);
    }

    return {
      id: record.id as Contract["id"],
      userId: record.userId as Contract["userId"],
      name: record.name,
      description: record.description ?? undefined,
      status: record.status as Contract["status"],
      terms: {
        minValidMinutes: record.minValidMinutes as Contract["terms"]["minValidMinutes"],
        maxMissedCheckpoints: record.maxMissedCheckpoints,
        mandatoryArtifactTypes: parseJson(record.mandatoryArtifactTypesJson, []),
        vivaPassingScore: record.vivaPassingScore as Contract["terms"]["vivaPassingScore"],
        checkpointIntervalMinutes:
          record.checkpointIntervalMinutes === null
            ? undefined
            : (record.checkpointIntervalMinutes as Contract["terms"]["checkpointIntervalMinutes"]),
        maxPauseMinutes:
          record.maxPauseMinutes === null
            ? undefined
            : (record.maxPauseMinutes as Contract["terms"]["maxPauseMinutes"])
      },
      activeRange: {
        startsAt: record.activeRangeStartsAt.toISOString() as Contract["activeRange"]["startsAt"],
        endsAt: record.activeRangeEndsAt.toISOString() as Contract["activeRange"]["endsAt"]
      },
      signedAt: fromDate(record.signedAt) as Contract["signedAt"],
      activatedAt: fromDate(record.activatedAt) as Contract["activatedAt"],
      endedAt: fromDate(record.endedAt) as Contract["endedAt"],
      tags: parseJson(record.tagsJson, []),
      metadata: parseJson(record.metadataJson, undefined),
      createdAt: record.createdAt.toISOString() as Contract["createdAt"],
      updatedAt: record.updatedAt.toISOString() as Contract["updatedAt"]
    };
  }
}
