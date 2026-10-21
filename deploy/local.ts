import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { config } from '../src/config.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const npmCli = z.string().min(1).parse(process.env.npm_execpath)
const origin = `http://localhost:${config.PORT}`
const environment = {
  ...process.env,
  NODE_ENV: 'production',
  CORS_ORIGIN: origin,
  VITE_API_URL: origin,
}

// 顺序执行真实构建与启动命令，任一步骤失败立即终止。
function run(args: string[], description: string) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env: environment,
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status === null) throw new Error(`${description}未正常结束：${result.signal}`)
  if (result.status !== 0) process.exit(result.status)
}

run([npmCli, 'run', 'build'], '后端构建')
run([npmCli, '--prefix', 'frontend', 'run', 'build'], '前端构建')
console.log(`本机部署地址：${origin}`)
console.log('保持当前终端运行，按 Ctrl+C 终止服务。')
run([fileURLToPath(new URL('../dist/app.js', import.meta.url))], '本机服务')
