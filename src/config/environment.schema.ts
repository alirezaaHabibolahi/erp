import { z } from 'zod';

const optionalString = z.string().trim().optional();
const optionalUrl = z.union([z.literal(''), z.url()]).optional();
const optionalPositiveInteger = z
  .union([z.literal(''), z.coerce.number().int().positive()])
  .optional();
const positiveInteger = (fallback: number) =>
  z.coerce.number().int().positive().default(fallback);
const tokenDuration = z
  .string()
  .trim()
  .regex(/^\d+\s*(ms|s|m|h|d)$/i);

export const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'staging', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    TRUST_PROXY: z
      .enum(['0', '1', 'false', 'true', 'no', 'yes', 'off', 'on'])
      .default('false'),
    CORS_ORIGINS: optionalString,

    DATABASE_URL: optionalString,
    REDIS_URL: optionalUrl,
    REDIS_HOST: optionalString,
    REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
    RATE_LIMIT_MAX: positiveInteger(100),
    RATE_LIMIT_TTL_SECONDS: positiveInteger(60),

    JWT_ACCESS_SECRET: optionalString,
    JWT_ISSUER: z.string().trim().min(1).default('erp-backend'),
    JWT_AUDIENCE: z.string().trim().min(1).default('erp-client'),
    JWT_ACCESS_TOKEN_TTL: tokenDuration.default('15m'),
    JWT_REFRESH_TOKEN_TTL: tokenDuration.default('7d'),
    AUTH_PASSWORD_RESET_OTP_SECRET: optionalString,
    AUTH_PASSWORD_RESET_OTP_LENGTH: z.coerce
      .number()
      .int()
      .min(4)
      .max(10)
      .default(6),
    AUTH_PASSWORD_RESET_OTP_TTL_SECONDS: positiveInteger(120),
    AUTH_PASSWORD_RESET_OTP_COOLDOWN_SECONDS: positiveInteger(60),
    AUTH_PASSWORD_RESET_OTP_MAX_ATTEMPTS: positiveInteger(5),

    SMS_PROVIDER: z.enum(['smsir', 'kavenegar']).default('smsir'),
    SMS_IR_API_KEY: optionalString,
    KAVENEGAR_API_KEY: optionalString,
    SMS_PASSWORD_RESET_TEMPLATE_ID: optionalPositiveInteger,
    SMS_PASSWORD_RESET_TEMPLATE_NAME: optionalString,
    SEED_USER_PASSWORD: optionalString,
  })
  .passthrough()
  .superRefine((environment, context) => {
    if (environment.NODE_ENV !== 'production') {
      return;
    }

    requireValue(environment.DATABASE_URL, 'DATABASE_URL', context);
    requireValue(environment.REDIS_URL, 'REDIS_URL', context);
    requireSecret(environment.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET', context);
    requireSecret(
      environment.AUTH_PASSWORD_RESET_OTP_SECRET,
      'AUTH_PASSWORD_RESET_OTP_SECRET',
      context,
    );

    if (environment.SMS_PROVIDER === 'smsir') {
      requireValue(environment.SMS_IR_API_KEY, 'SMS_IR_API_KEY', context);
      if (!environment.SMS_PASSWORD_RESET_TEMPLATE_ID) {
        addRequiredIssue('SMS_PASSWORD_RESET_TEMPLATE_ID', context);
      }
    } else {
      requireValue(environment.KAVENEGAR_API_KEY, 'KAVENEGAR_API_KEY', context);
      requireValue(
        environment.SMS_PASSWORD_RESET_TEMPLATE_NAME,
        'SMS_PASSWORD_RESET_TEMPLATE_NAME',
        context,
      );
    }
  });

function requireSecret(
  value: string | undefined,
  name: string,
  context: z.RefinementCtx,
): void {
  if (!value || value.length < 32 || isPlaceholder(value)) {
    context.addIssue({
      code: 'custom',
      message: `${name} must contain at least 32 non-placeholder characters in production.`,
      path: [name],
    });
  }
}

function requireValue(
  value: unknown,
  name: string,
  context: z.RefinementCtx,
): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    addRequiredIssue(name, context);
  }
}

function addRequiredIssue(name: string, context: z.RefinementCtx): void {
  context.addIssue({
    code: 'custom',
    message: `${name} is required in production.`,
    path: [name],
  });
}

function isPlaceholder(value: string): boolean {
  const normalized = value.toLowerCase();
  return normalized === 'change_me' || normalized.includes('replace_me');
}
