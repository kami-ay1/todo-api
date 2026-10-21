import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { frontendEnvSchema } from './src/utils/env.ts'

export default defineConfig(({ command, mode }) => {
  // 在生成生产资源前校验配置，避免发布后才出现地址缺失错误。
  if (command === 'build') frontendEnvSchema.parse(loadEnv(mode, process.cwd(), 'VITE_'))

  return {
    plugins: [vue()],
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true,
    },
  }
})
