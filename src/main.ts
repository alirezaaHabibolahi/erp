import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

import { Logger } from '@nestjs/common';
import { setupSwagger } from './swagger';
import { generalConfig } from './config/general';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = generalConfig();

  // Only honor X-Forwarded-For when the deployment explicitly sits behind a
  // trusted reverse proxy. This keeps client IP based limits non-spoofable.
  app.getHttpAdapter().getInstance().set('trust proxy', config.app.trustProxy);

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

bootstrap();
