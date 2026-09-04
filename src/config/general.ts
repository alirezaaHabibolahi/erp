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

const secretEnv = (name: string, isProduction: boolean): string => {
  const value = process.env[name]?.trim();
  const fallback = `dev-only-${name.toLowerCase().replaceAll('_', '-')}`;

  if (!value) {
    if (isProduction) {
      throw new Error(`${name} is required in production.`);
    }

    return fallback;
  }

  const normalized = value.toLowerCase();
  if (normalized === 'change_me' || normalized.includes('replace_me')) {
    if (isProduction) {
      throw new Error(`${name} must not use a placeholder in production.`);
    }

    return fallback;
  }

  if (isProduction && value.length < 32) {
    throw new Error(`${name} must contain at least 32 characters.`);
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

const optionalPositiveInteger = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
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
      issuer: process.env.JWT_ISSUER?.trim() || 'erp-backend',
      audience: process.env.JWT_AUDIENCE?.trim() || 'erp-client',
      accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL || '15m',
      refreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL || '7d',
    },
    auth: {
      passwordResetOtpSecret: secretEnv(
        'AUTH_PASSWORD_RESET_OTP_SECRET',
        isProduction,
      ),
      passwordResetOtpLength: positiveInteger(
        process.env.AUTH_PASSWORD_RESET_OTP_LENGTH,
        6,
      ),
      passwordResetOtpTtlSeconds: positiveInteger(
        process.env.AUTH_PASSWORD_RESET_OTP_TTL_SECONDS,
        120,
      ),
      passwordResetOtpCooldownSeconds: positiveInteger(
        process.env.AUTH_PASSWORD_RESET_OTP_COOLDOWN_SECONDS,
        60,
      ),
      passwordResetOtpMaxAttempts: positiveInteger(
        process.env.AUTH_PASSWORD_RESET_OTP_MAX_ATTEMPTS,
        5,
      ),
    },
    sms: {
      provider: smsProvider(),
      passwordResetTemplateId: optionalPositiveInteger(
        process.env.SMS_PASSWORD_RESET_TEMPLATE_ID,
      ),
      passwordResetTemplateName:
        process.env.SMS_PASSWORD_RESET_TEMPLATE_NAME || 'erp-password-reset',
    },
  };
};

export type GeneralConfig = ReturnType<typeof generalConfig>;
