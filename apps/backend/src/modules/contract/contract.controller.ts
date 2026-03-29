import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import {
  nonEmptyStringSchema,
  type CreateContractRequest
} from "@medstudy/contracts";
import { mapContractResponse } from "../../common/view-mappers";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { createContractRequestSchema } from "./dto/create-contract.dto";
import { ContractService } from "./contract.service";

const contractIdParamPipe = new ZodValidationPipe(nonEmptyStringSchema);

@Controller("contracts")
export class ContractController {
  constructor(
    @Inject(ContractService)
    private readonly contractService: ContractService
  ) {}

  @Post()
  async createContract(
    @Body(new ZodValidationPipe(createContractRequestSchema)) body: CreateContractRequest
  ) {
    return mapContractResponse(await this.contractService.createContract(body));
  }

  @Get(":id")
  async getContract(@Param("id", contractIdParamPipe) id: string) {
    return mapContractResponse(await this.contractService.getContract(id));
  }
}
