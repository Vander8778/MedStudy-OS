import { Module } from "@nestjs/common";
import { ContractController } from "./contract.controller";
import { ContractRepository } from "./contract.repository";
import { ContractService } from "./contract.service";

@Module({
  controllers: [ContractController],
  providers: [ContractRepository, ContractService],
  exports: [ContractRepository, ContractService]
})
export class ContractModule {}
