import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { decoratorMetadata: true, legacyDecorator: true },
      },
    }),
  ],
  esbuild: false,
  test: {
    include: ['test/integration/**/*.int-spec.ts'],
    environment: 'node',
    globals: true,
    clearMocks: true,
    fileParallelism: false,
    maxWorkers: 1,
    setupFiles: ['./vitest.setup.ts'],
  },
});
