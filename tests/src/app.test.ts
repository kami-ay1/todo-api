import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { after, before, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const root = fileURLToPath(new URL('../../', import.meta.url))
const baseUrl = 'http://127.0.0.1:3000'
const credentials = {
  username: `api_auth_${randomUUID()}`,
  password: randomUUID(),
}
const userSchema = z.object({ id: z.number().int().positive(), username: z.string() }).strict()
const loginSchema = z.object({ token: z.string().min(1) }).strict()
let backend: ChildProcess | undefined
let registeredUser: z.infer<typeof userSchema>
let token: string
let secret: string

// 所有请求均发送到真实 Express 服务，网络异常及响应格式错误直接暴露。
async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    ...options,
    signal: AbortSignal.timeout(5000),
  })
  const body: unknown = await response.json()
  return { status: response.status, body }
}

async function postJson(path: string, body: unknown) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('登录注册及 JWT 接口（真实 PostgreSQL）', { concurrency: false, timeout: 60000 }, () => {
  before(async () => {
    secret = z.string().min(1).parse(process.env.JWT_SECRET)

    // 端口占用时立即失败，避免将请求发送到其他已运行的服务。
    const probe = createServer()
    const available = once(probe, 'listening')
    probe.listen(3000)
    await available
    await new Promise<void>((resolve, reject) => {
      probe.close(error => error ? reject(error) : resolve())
    })

    const child = spawn(process.execPath, ['--import', 'tsx', 'src/app.ts'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    backend = child
    child.stderr.pipe(process.stderr)
    const ready = once(child.stdout, 'data', { signal: AbortSignal.timeout(10000) })
      .then(([output]) => assert.match(output.toString(), /Server running at http:\/\/localhost:3000/))
    const exited = once(child, 'exit').then(([code]) => {
      throw new Error(`测试后端提前终止：${code}`)
    })
    await Promise.race([ready, exited])

    // 创建共享测试账号，后续场景通过独立 HTTP 请求验证行为。
    const registration = await postJson('/auth/register', credentials)
    assert.equal(registration.status, 201)
    registeredUser = userSchema.parse(registration.body)
    const login = await postJson('/auth/login', credentials)
    assert.equal(login.status, 200)
    token = loginSchema.parse(login.body).token
  }, { timeout: 20000 })

  after(async () => {
    if (backend && backend.exitCode === null && backend.signalCode === null) {
      const exited = once(backend, 'exit')
      backend.kill()
      await exited
    }
  })

  it('注册成功返回 201，响应仅包含账号编号和用户名', async () => {
    const username = `api_register_${randomUUID()}`
    const response = await postJson('/auth/register', { username, password: randomUUID() })
    assert.equal(response.status, 201)
    const user = userSchema.parse(response.body)
    assert.equal(user.username, username)
  })

  it('重复注册返回 409', async () => {
    const response = await postJson('/auth/register', credentials)
    assert.equal(response.status, 409)
    assert.deepEqual(response.body, { message: '用户名已被占用' })
  })

  it('正确登录返回有效 token，包含当前账号编号及七天有效期', async () => {
    const response = await postJson('/auth/login', credentials)
    assert.equal(response.status, 200)
    const result = loginSchema.parse(response.body)
    const payload = z.object({
      userId: z.literal(registeredUser.id),
      iat: z.number(),
      exp: z.number(),
    }).parse(jwt.verify(result.token, secret))
    assert.equal(payload.exp - payload.iat, 7 * 24 * 60 * 60)
  })

  it('错误密码返回 401', async () => {
    const response = await postJson('/auth/login', { ...credentials, password: randomUUID() })
    assert.equal(response.status, 401)
    assert.deepEqual(response.body, { message: '用户名或密码错误' })
  })

  it('不存在的账号返回 401', async () => {
    const response = await postJson('/auth/login', {
      username: `api_missing_${randomUUID()}`,
      password: randomUUID(),
    })
    assert.equal(response.status, 401)
    assert.deepEqual(response.body, { message: '用户名或密码错误' })
  })

  it('缺少 token 时任务接口返回 401', async () => {
    const response = await request('/todos')
    assert.equal(response.status, 401)
    assert.deepEqual(response.body, { message: '未提供token' })
  })

  it('无效 token 时任务接口返回 401', async () => {
    const response = await request('/todos', { headers: { Authorization: 'Bearer invalid-token' } })
    assert.equal(response.status, 401)
    assert.deepEqual(response.body, { message: 'token无效或已过期' })
  })

  it('使用真实签名的过期 token 时任务接口返回 401', async () => {
    const expiredToken = jwt.sign({ userId: registeredUser.id }, secret, { expiresIn: -60 })
    const response = await request('/todos', { headers: { Authorization: `Bearer ${expiredToken}` } })
    assert.equal(response.status, 401)
    assert.deepEqual(response.body, { message: 'token无效或已过期' })
  })

  it('有效 token 可以访问当前用户的任务列表', async () => {
    const response = await request('/todos', { headers: { Authorization: `Bearer ${token}` } })
    assert.equal(response.status, 200)
    assert.deepEqual(response.body, {
      data: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    })
  })
})
