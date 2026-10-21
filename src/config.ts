import 'dotenv/config'
import { z } from 'zod'

// 在创建数据库连接和启动监听之前统一校验运行配置。
const result = z.object({
  PORT: z.coerce.number({ error: '必须配置有效端口' })
    .int('端口必须是整数').min(1, '端口必须大于 0').max(65535, '端口不能超过 65535'),
  CORS_ORIGIN: z.url({ protocol: /^https?$/, error: '必须配置有效的 HTTP 或 HTTPS 来源地址' })
    .pipe(z.string().refine(value => {
      const url = new URL(value)
      return url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password
    }, '来源地址不能包含路径、查询参数、片段或账号信息'))
    .transform(value => new URL(value).origin),
  DATABASE_URL: z.url({ protocol: /^postgres(?:ql)?$/, error: '必须配置有效的 PostgreSQL 连接地址' }),
  JWT_SECRET: z.string({ error: '必须配置 JWT 签名密钥' })
    .refine(value => value.trim().length > 0, 'JWT 签名密钥不能为空'),
}).safeParse(process.env)

if (!result.success) {
  // 只输出字段名称和规则，不暴露数据库连接串及密钥内容。
  throw new Error(`环境变量配置错误：\n${result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n')}`)
}

/** 已通过启动校验的后端运行配置。 */
export const config = result.data
