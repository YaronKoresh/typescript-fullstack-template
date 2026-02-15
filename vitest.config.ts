import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    testTimeout: 60000,
    pool: 'threads',
    setupFiles: ['test/setup.ts'], 
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'balancer/**/*.ts',
        'client/**/*.ts',
        'server/**/*.ts',
        'tools/**/*.*',
        'dist_config/**/*.js'
      ],
      exclude: ['**/*.d.ts', 'test/**']
    },
    typecheck: {
      enabled: true
    },
  },
});