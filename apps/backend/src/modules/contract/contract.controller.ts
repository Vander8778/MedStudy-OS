import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ContractService, type CreateContractCommand } from "./contract.service";

@Controller("contracts")
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post()
  createContract(@Body() body: CreateContractCommand) {
    return this.contractService.createContract(body);
  }

  @Get(":id")
  getContract(@Param("id") id: string) {
    return this.contractService.getContract(id);
  }
}
