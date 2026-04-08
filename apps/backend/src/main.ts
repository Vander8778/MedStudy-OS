import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ApiErrorFilter } from "./common/api-error.filter";
import { AppModule } from "./app.module";
import { getEnv } from "./config/env";
import { JsonLogger } from "./observability/json-logger";
import { requestContextMiddleware } from "./observability/request-context.middleware";

export async function bootstrap() {
  const env = getEnv();
  const app = await NestFactory.create(AppModule, {
    cors:
      env.corsOrigins.includes("*")
        ? true
        : {
            origin: env.corsOrigins
          }
  });

  app.useLogger(app.get(JsonLogger));
  app.use(requestContextMiddleware);
  app.setGlobalPrefix("api", {
    exclude: [
      { path: "health", method: RequestMethod.GET },
      { path: "ready", method: RequestMethod.GET },
      { path: "health/deep", method: RequestMethod.GET },
      { path: "metrics", method: RequestMethod.GET }
    ]
  });
  app.useGlobalFilters(new ApiErrorFilter());

  await app.listen(env.port);
  return app;
}

if (require.main === module) {
  void bootstrap();
}
