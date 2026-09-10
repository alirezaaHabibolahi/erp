import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

import { generalConfig } from '../../../../src/config/general';
import { RedisService } from '@app/common/redis/redis.service';

@Injectable()
export class IoredisService implements OnModuleInit, OnModuleDestroy {
  private client?: Redis;
  private readonly logger = new Logger(IoredisService.name);

  constructor(private readonly redis: RedisService) {}

  async onModuleInit(): Promise<void> {
    this.client = await this.redis.connectWithRetry(generalConfig().redis.url);
  }

  async set(key: string, value: string): Promise<void> {
    await this.getClient().set(key, value);
  }

  async setWithExpire(
    key: string,
    value: string,
    expireTimeSeconds: number,
  ): Promise<void> {
    await this.getClient().set(key, value, 'EX', expireTimeSeconds);
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.getClient().get(key);
    } catch (e) {
      this.logger.error(`Redis get error for key "${key}"`);
      return null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  private getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client is not initialized');
    }

    return this.client;
  }
}
