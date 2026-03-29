import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiErrorFilter } from "../../../common/api-error.filter";
import { ContractController } from "../contract.controller";
import { ContractService } from "../contract.service";

describe("ContractController HTTP", () => {
  let app: INestApplication;
  const contractService = {
    createContract: vi.fn(),
    getContract: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [ContractController],
      providers: [
        {
          provide: ContractService,
          useValue: contractService
        }
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalFilters(new ApiErrorFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns 422 validation.invalid_input for blank contract route params", async () => {
    const response = await request(app.getHttpServer()).get("/api/contracts/%20%20");

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("validation.invalid_input");
    expect(response.body.error.details.issues).toEqual([
      expect.objectContaining({
        path: ""
      })
    ]);
    expect(contractService.getContract).not.toHaveBeenCalled();
  });

  it("returns 422 validation.invalid_input for malformed contract bodies", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/contracts")
      .send({
        userId: "user_1",
        name: "Core contract",
        activeRange: {
          startsAt: "2026-03-29T09:00:00.000Z",
          endsAt: "2026-03-29T11:00:00.000Z"
        },
        terms: {
          minValidMinutes: -1,
          maxMissedCheckpoints: 1,
          mandatoryArtifactTypes: ["final_submission"],
          vivaPassingScore: 70
        }
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("validation.invalid_input");
    expect(response.body.error.details.issues).toEqual([
      expect.objectContaining({
        path: "terms.minValidMinutes"
      })
    ]);
    expect(contractService.createContract).not.toHaveBeenCalled();
  });
});
