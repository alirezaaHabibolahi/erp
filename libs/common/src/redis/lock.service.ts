import { Inject, Injectable } from '@nestjs/common';
import Redlock, { Lock, Settings } from 'redlock';
import { RedisService } from './redis.service';
import { generalConfig } from '../../../../src/config/general';

@Injectable()
export class RedisLock {
  private _redLock: Redlock;
  private locks = new Map<string, Lock>();

  constructor(@Inject() private redis: RedisService) {
    this.initialize();
  }

  private async initialize() {
    const redisClients = await this.redis.connectWithRetry(
      generalConfig().redis.url,
    );
    const redlock = new Redlock([redisClients]);
    this._redLock = redlock;
  }

  async acquireLock(
    resourceKey: string,
    duration: number,
    options: Partial<Settings>,
  ) {
    try {
      const lock = await this._redLock.acquire(
        [resourceKey],
        duration,
        options,
      );
      this.locks.set(resourceKey, lock);
    } catch (e) {
      throw { msg: 'بعد از اتمام عملیات قبلی دوباره امتحان کنید', key: 'LOCK' };
    }
  }

  async extendLock(key: string, duration: number) {
    try {
      const lock = this.locks.get(key);
      if (lock) {
        const newLock = await lock.extend(duration);
        this.locks.set(key, newLock);
      }
    } catch {}
  }

  async releaseLock(key: string) {
    try {
      const lock = this.locks.get(key);
      if (lock) {
        await lock.release();
      }
    } catch (e) {}
  }

  async checkLockExists(key: string) {
    try {
      const lock = await this.redis.getClient().get(key);
      if (lock) return true;
      return false;
    } catch (e) {
      return false;
    }
  }
}
