import { z } from 'zod'

/** 构建配置与浏览器请求模块共用的公开环境变量校验规则。 */
export const frontendEnvSchema = z.object({
  VITE_API_URL: z.url({ protocol: /^https?$/, error: 'VITE_API_URL 必须配置为有效的 HTTP 或 HTTPS 地址' }),
})
