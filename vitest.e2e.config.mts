import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const commonRoot = fileURLToPath(new URL('./libs/common/src', import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^@app\/common(?=\/|$)/, replacement: commonRoot }],
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.e2e-spec.ts'],
    passWithNoTests: true,
  },
});
