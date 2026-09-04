import { environmentSchema } from './environment.schema';

describe('environmentSchema', () => {
  it('applies safe development defaults', () => {
    const result = environmentSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        NODE_ENV: 'development',
        PORT: 3000,
        SMS_PROVIDER: 'smsir',
      });
    }
  });

  it('rejects invalid ports', () => {
    const result = environmentSchema.safeParse({ PORT: '70000' });

    expect(result.success).toBe(false);
  });

  it('requires production infrastructure and secrets', () => {
    const result = environmentSchema.safeParse({ NODE_ENV: 'production' });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0]);
      expect(paths).toEqual(
        expect.arrayContaining([
          'DATABASE_URL',
          'REDIS_URL',
          'JWT_ACCESS_SECRET',
          'AUTH_PASSWORD_RESET_OTP_SECRET',
          'SMS_IR_API_KEY',
          'SMS_PASSWORD_RESET_TEMPLATE_ID',
        ]),
      );
    }
  });
});
