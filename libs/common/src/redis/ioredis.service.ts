import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import { generalConfig } from '../../../../src/config/general';
import { RedisService } from '@app/common/redis/redis.service';

@Injectable()
export class IoredisService implements OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(IoredisService.name);

  constructor(@Inject() private redis: RedisService) {
    this.initialize();
  }

  private async initialize() {
    this.client = await this.redis.connectWithRetry(generalConfig().redis.url);
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  async setWithExpire(
    key: string,
    value: string,
    expireTimeSeconds: number,
  ): Promise<void> {
    await this.client.set(key, value, 'EX', expireTimeSeconds);
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (e) {
      this.logger.error(`Redis get error for key "${key}"`);
      return null;
    }
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }
}
