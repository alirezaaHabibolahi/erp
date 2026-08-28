import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

import { Logger } from '@nestjs/common';
import { setupSwagger } from './swagger';
import {
  AllExceptionsFilter,
  MessageService,
  ResponseInterceptor,
} from '@app/common';
import { generalConfig } from './config/general';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = generalConfig();

  // Only honor X-Forwarded-For when the deployment explicitly sits behind a
  // trusted reverse proxy. This keeps client IP based limits non-spoofable.
  app.getHttpAdapter().getInstance().set('trust proxy', config.app.trustProxy);

  const reflector = app.get(Reflector);
  const messageService = app.get(MessageService);

  app.enableCors({
    origin: config.app.corsOrigins.length
      ? config.app.corsOrigins
      : !config.app.isProduction,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    maxAge: 86400,
  });

  setupSwagger(app);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor(reflector, messageService));

  // Global handle error filter
  app.useGlobalFilters(new AllExceptionsFilter(messageService));

  const PORT = config.app.port;
  await app.listen(PORT);

  Logger.log(`server is running on port : ${PORT}`);
}

bootstrap();
