import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '@app/common/redis/redis.service';
import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';

import {
  RATE_LIMIT_METADATA,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator';
import { generalConfig } from '../config/general';

const COUNTER_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return { count, redis.call('TTL', KEYS[1]) }
`;

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Browser CORS preflight requests must not consume a caller's allowance.
    if (request.method === 'OPTIONS') {
      return true;
    }

    const configured = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_METADATA,
      [context.getHandler(), context.getClass()],
    );
    const config = configured ?? generalConfig().rateLimit.default;
    const handlerName = `${context.getClass().name}:${context.getHandler().name}`;
    const clientIp = request.ip || request.socket.remoteAddress || 'unknown';
    const fingerprint = createHash('sha256')
      .update(`${clientIp}:${handlerName}:${config.name ?? 'default'}`)
      .digest('hex');
    const key = `rate-limit:v1:${config.name ?? handlerName}:${fingerprint}`;

    const client = await this.redisService.connectWithRetry(
      generalConfig().redis.url,
    );
    const [count, ttl] = (await client.eval(
      COUNTER_SCRIPT,
      1,
      key,
      String(config.ttl),
    )) as [number, number];
    const retryAfter = Math.max(1, ttl);
    const remaining = Math.max(0, config.limit - count);

    response.setHeader('X-RateLimit-Limit', config.limit);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader(
      'X-RateLimit-Reset',
      Math.ceil(Date.now() / 1000) + retryAfter,
    );

    if (count > config.limit) {
      response.setHeader('Retry-After', retryAfter);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
