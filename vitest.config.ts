import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // スクリプト内の `import { GM_* } from '$'` をテスト用スタブに差し替える
    alias: { $: fileURLToPath(new URL('./tests/gm-stub.ts', import.meta.url)) },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'tools/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
});
