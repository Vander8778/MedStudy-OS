import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { PrismaModule } from "../prisma/prisma.module";
import { JsonLogger } from "./json-logger";
import { LoggingInterceptor } from "./logging.interceptor";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";

@Module({
  imports: [PrismaModule],
  controllers: [MetricsController],
  providers: [
    JsonLogger,
    MetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor
    }
  ],
  exports: [JsonLogger, MetricsService]
})
export class ObservabilityModule {}
