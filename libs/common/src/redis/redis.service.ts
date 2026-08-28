import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;
  private connection?: Promise<Redis>;
  private readonly logger = new Logger(RedisService.name);

  async connectWithRetry(uri: string): Promise<Redis> {
    if (this.client) {
      if (this.connection) {
        return this.connection;
      }
      //this.logger.log('Redis client already exists');
      return this.client;
    }
    this.client = new Redis(uri, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 3000, 30000);
        this.logger.warn(
          `Redis reconnect attempt #${times}, retrying in ${delay}ms`,
        );
        return delay;
      },
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client connected and ready');
    });

    this.client.on('error', (err) => {
      this.logger.warn('Redis client error', err);
    });

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.client.on('end', () => {
      this.logger.warn('Redis connection ended');
    });

    this.connection = new Promise<Redis>((resolve) => {
      this.client.once('ready', () => {
        this.connection = undefined;
        resolve(this.client);
      });
    });

    return this.connection;
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis not connected');
    }
    return this.client;
  }
}
