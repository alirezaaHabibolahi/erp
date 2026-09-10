import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://erp_user:erp_password@localhost:5432/erp?schema=public';

export default defineConfig({
  schema: 'prisma/schema',
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'node -r ts-node/register -r tsconfig-paths/register prisma/seed.ts',
  },
});
