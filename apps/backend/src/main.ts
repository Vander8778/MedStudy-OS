import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ApiErrorFilter } from "./common/api-error.filter";
import { AppModule } from "./app.module";

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true
  });

  app.setGlobalPrefix("api");
  app.useGlobalFilters(new ApiErrorFilter());

  await app.listen(3001);
  return app;
}

if (require.main === module) {
  void bootstrap();
}
