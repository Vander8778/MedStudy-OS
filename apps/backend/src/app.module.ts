import { Module } from "@nestjs/common";
import { SessionModule } from "./modules/session/session.module";
import { ContractModule } from "./modules/contract/contract.module";
import { TelemetryModule } from "./modules/telemetry/telemetry.module";
import { TimerModule } from "./modules/timer/timer.module";
import { AuditModule } from "./modules/audit/audit.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AiModule } from "./ai/ai.module";

@Module({
  imports: [
    PrismaModule,
    AiModule,
    AuditModule,
    NotificationModule,
    ContractModule,
    TimerModule,
    SessionModule,
    TelemetryModule,
    AuthModule
  ]
})
export class AppModule {}
