import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationError, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from './swagger';
import {
  AllExceptionsFilter,
  MessageService,
  RequestContext,
  ResponseInterceptor,
} from '@app/common';
import { I18nValidationPipe } from '@app/common/pipe/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Only honor X-Forwarded-For when the deployment explicitly sits behind a
  // trusted reverse proxy. This keeps client IP based limits non-spoofable.
  const trustProxy = ['1', 'true'].includes(
    (process.env.TRUST_PROXY || '').toLowerCase(),
  );
  app.getHttpAdapter().getInstance().set('trust proxy', trustProxy);

  const reflector = app.get(Reflector);
  const messageService = app.get(MessageService);

  app.enableCors({
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

  const configService = app.get(ConfigService);
  const PORT = configService.get('PORT') ?? 3000;
  await app.listen(PORT);

  Logger.log(`server is running on port : ${PORT}`);
}

bootstrap();
