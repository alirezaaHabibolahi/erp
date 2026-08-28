import * as process from 'node:process';

type NodeEnv = 'development' | 'test' | 'staging' | 'production';
type SmsProviderName = 'smsir' | 'kavenegar';

const positiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const booleanEnv = (value: string | undefined, fallback = false) => {
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const stringListEnv = (value: string | undefined) =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const nodeEnv = (): NodeEnv => {
  const value = process.env.NODE_ENV;
  if (
    value === 'production' ||
    value === 'staging' ||
    value === 'test' ||
    value === 'development'
  ) {
    return value;
  }

  return 'development';
};

const redisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = process.env.REDIS_PORT || '6379';
  return `redis://${host}:${port}`;
};

const secretEnv = (name: string, isProduction: boolean) => {
  const value = process.env[name]?.trim();
  const normalized = value?.toLowerCase();
  const isPlaceholder =
    !normalized ||
    normalized === 'change_me' ||
    normalized.includes('replace_me');

  if (isPlaceholder && isProduction) {
    throw new Error(`${name} is required in production.`);
  }

  if (isPlaceholder) {
    return `dev-only-${name.toLowerCase().replaceAll('_', '-')}`;
  }

  return value;
};

const smsProvider = (): SmsProviderName => {
  const provider = (process.env.SMS_PROVIDER || 'smsir').toLowerCase();

  if (provider === 'smsir' || provider === 'kavenegar') {
    return provider;
  }

  return 'smsir';
};

export const generalConfig = () => {
  const env = nodeEnv();
  const isProduction = env === 'production';

  return {
    app: {
      env,
      isProduction,
      port: positiveInteger(process.env.PORT, 3000),
      trustProxy: booleanEnv(process.env.TRUST_PROXY),
      corsOrigins: stringListEnv(process.env.CORS_ORIGINS),
    },
    redis: {
      url: redisUrl(),
    },
    rateLimit: {
      default: {
        name: 'global',
        limit: positiveInteger(process.env.RATE_LIMIT_MAX, 100),
        ttl: positiveInteger(process.env.RATE_LIMIT_TTL_SECONDS, 60),
      },
    },
    jwt: {
      accessSecret: secretEnv('JWT_ACCESS_SECRET', isProduction),
      refreshSecret: secretEnv('JWT_REFRESH_SECRET', isProduction),
      accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL || '15m',
      refreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL || '7d',
    },
    sms: {
      provider: smsProvider(),
    },
  };
};

export type GeneralConfig = ReturnType<typeof generalConfig>;
