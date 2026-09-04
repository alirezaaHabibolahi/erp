import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

import { Logger } from '@nestjs/common';
import { setupSwagger } from './swagger';
import { generalConfig } from './config/general';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    routeConflictPolicy: {
      duplicate: 'error',
      shadow: 'warn',
    },
    routeResolutionStrategy: 'specificity',
  });
  const config = generalConfig();

  app.enableShutdownHooks();

  // Only honor X-Forwarded-For when the deployment explicitly sits behind a
  // trusted reverse proxy. This keeps client IP based limits non-spoofable.
  app.set('trust proxy', config.app.trustProxy);

  app.enableCors({
    origin: config.app.corsOrigins.length
      ? config.app.corsOrigins
      : !config.app.isProduction,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept-Language',
      'X-Lang',
      'X-Language',
      'X-Request-Id',
      'X-Device-Name',
    ],
    exposedHeaders: ['Content-Disposition', 'Content-Language', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400,
  });

  setupSwagger(app);

  app.use(cookieParser());

  const PORT = config.app.port;
  await app.listen(PORT);

  Logger.log(`server is running on port : ${PORT}`);
}

void bootstrap().catch((error: unknown) => {
  Logger.error(
    'Application bootstrap failed',
    error instanceof Error ? error.stack : undefined,
  );
  process.exitCode = 1;
});
