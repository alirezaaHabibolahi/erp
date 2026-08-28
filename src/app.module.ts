import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  AllExceptionsFilter,
  CommonModule,
  LanguageMiddleware,
  MessageService,
} from '@app/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import * as session from 'express-session';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisService } from '@app/common/redis/redis.service';
import { generalConfig } from './config/general';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {
  async configure(consumer: MiddlewareConsumer) {
    consumer.apply(LanguageMiddleware).forRoutes('*');

    const sessionClient = await new RedisService().connectWithRetry(
      generalConfig().sessionStoreUrl,
    );
    const sessionStore = RedisService.getRedisStore(sessionClient);

    consumer
      .apply(
        session({
          store: sessionStore,
          ...generalConfig().sessionOptions,
        }),
      )
      .forRoutes('*');
  }
}
