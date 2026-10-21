import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost:5173' } },
    include: ['tests/src/**/*.test.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
}))
