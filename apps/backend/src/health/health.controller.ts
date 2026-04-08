import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Res
} from "@nestjs/common";
import { getEnv } from "../config/env";
import { HealthService } from "./health.service";

type ResponseLike = {
  status: (code: number) => unknown;
};

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("health")
  async health(@Res({ passthrough: true }) response: ResponseLike) {
    response.status(200);
    return this.healthService.getLiveness();
  }

  @Get("ready")
  async ready(@Res({ passthrough: true }) response: ResponseLike) {
    const result = await this.healthService.getReadiness();
    response.status(result.ok ? 200 : 503);
    return result;
  }

  @Get("health/deep")
  async deepHealth(
    @Headers("authorization") authorization: string | undefined,
    @Headers("x-health-token") healthToken: string | undefined,
    @Res({ passthrough: true }) response: ResponseLike
  ) {
    const env = getEnv();
    const token =
      healthToken ??
      (authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined);

    if (
      (env.nodeEnv === "production" || env.healthDeepToken) &&
      token !== env.healthDeepToken
    ) {
      throw new ForbiddenException("Deep health access is restricted.");
    }

    const result = await this.healthService.getDeepHealth();
    response.status(result.ok ? 200 : 503);
    return result;
  }
}
