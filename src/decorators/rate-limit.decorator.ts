import { Reflector } from '@nestjs/core';

export interface RateLimitOptions {
  /** A stable name for the Redis counter. */
  name?: string;
  /** Maximum requests allowed during the window. */
  limit: number;
  /** Length of the window, in seconds. */
  ttl: number;
}

/**
 * Replaces the global rate-limit policy for an individual handler.
 * Limits are keyed by client IP and handler, so one endpoint cannot consume
 * another endpoint's allowance.
 */
export const RateLimit = Reflector.createDecorator<RateLimitOptions>({
  key: 'rate-limit',
});
