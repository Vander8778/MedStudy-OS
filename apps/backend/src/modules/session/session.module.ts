import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ContractModule } from "../contract/contract.module";
import { NotificationModule } from "../notification/notification.module";
import { TimerModule } from "../timer/timer.module";
import { SessionController } from "./session.controller";
import { SessionOrchestrator } from "./session.orchestrator";
import { SessionRepository } from "./session.repository";

@Module({
  imports: [AuditModule, ContractModule, TimerModule, NotificationModule],
  controllers: [SessionController],
  providers: [SessionRepository, SessionOrchestrator],
  exports: [SessionRepository, SessionOrchestrator]
})
export class SessionModule {}
