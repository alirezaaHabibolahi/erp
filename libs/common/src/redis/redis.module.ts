import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisLock } from './lock.service';
import { IoredisService } from '@app/common/redis/ioredis.service';

@Module({
  providers: [RedisService, RedisLock, IoredisService],
  exports: [RedisService, RedisLock, IoredisService],
})
export class RedisModule {}
