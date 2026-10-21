import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { resolve } from 'node:path'
import { config } from 'dotenv'
import jwt from 'jsonwebtoken'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'
import App from '../../src/App.vue'

const root = resolve(process.cwd(), '..')
const username = `auth_check_${Date.now()}`
const password = randomUUID()
const userSchema = z.object({ id: z.number(), username: z.string() })
const loginSchema = z.object({ token: z.string() })
let backend: ChildProcess
let wrapper: VueWrapper | undefined
let userId: number
let validToken: string
let secret: string

beforeAll(async () => {
  config({ path: resolve(root, '.env'), quiet: true })
  secret = z.string().min(1).parse(process.env.JWT_SECRET)
  backend = spawn(process.execPath, ['--import', 'tsx', 'src/app.ts'], {
    cwd: root, stdio: ['ignore', 'pipe', 'pipe'],
  })
  const ready = once(backend.stdout!, 'data').then(([output]) => {
    expect(output.toString()).toContain('Server running')
  })
  const exited = once(backend, 'exit').then(([code]) => {
    throw new Error(`测试后端提前终止：${code}`)
  })
  await Promise.race([ready, exited])

  // 注册及登录均调用真实接口，测试账号保留在本地数据库。
  const registered = await fetch('http://localhost:3000/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  expect(registered.status).toBe(201)
  userId = userSchema.parse(await registered.json()).id
  const loggedIn = await fetch('http://localhost:3000/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  expect(loggedIn.status).toBe(200)
  validToken = loginSchema.parse(await loggedIn.json()).token
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  sessionStorage.clear()
})

afterAll(async () => {
  if (backend && backend.exitCode === null && backend.signalCode === null) {
    const exited = once(backend, 'exit')
    backend.kill()
    await exited
  }
})

describe('App 登录失效处理（真实后端）', () => {
  test('有效 token 显示任务界面，退出登录后清除账号信息', async () => {
    sessionStorage.setItem('todo.token', validToken)
    sessionStorage.setItem('todo.username', username)
    wrapper = mount(App)
    await expect.poll(() => wrapper!.text()).toContain('全部任务 · 共 0 项')
    expect(wrapper.find('.auth-form').exists()).toBe(false)
    await wrapper.get('.account-menu button').trigger('click')
    expect(wrapper.find('.auth-form').exists()).toBe(true)
    expect(sessionStorage.getItem('todo.token')).toBeNull()
    expect(sessionStorage.getItem('todo.username')).toBeNull()
  })

  test.each(['无效 token', '过期 token'])('%s 返回 401 后显示登录提示，重新登录恢复任务界面', async kind => {
    const token = kind === '无效 token'
      ? 'invalid-token'
      : jwt.sign({ userId }, secret, { expiresIn: -60 })
    const response = await fetch('http://localhost:3000/todos', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: 'token无效或已过期' })

    sessionStorage.setItem('todo.token', token)
    sessionStorage.setItem('todo.username', username)
    wrapper = mount(App)
    await expect.poll(() => wrapper!.text()).toContain('登录已失效，请重新登录。')
    expect(wrapper.get('.session-message').text()).toBe('登录已失效，请重新登录。')
    expect(wrapper.find('.task-board').exists()).toBe(false)
    expect(wrapper.find('.auth-form').exists()).toBe(true)
    expect(sessionStorage.getItem('todo.token')).toBeNull()
    expect(sessionStorage.getItem('todo.username')).toBeNull()

    await wrapper.get('#username').setValue(username)
    await wrapper.get('#password').setValue(password)
    await wrapper.get('.auth-form').trigger('submit')
    await expect.poll(() => wrapper!.text()).toContain('全部任务 · 共 0 项')
    expect(wrapper.find('.session-message').exists()).toBe(false)
    expect(wrapper.find('.auth-form').exists()).toBe(false)
    expect(sessionStorage.getItem('todo.username')).toBe(username)
    expect(sessionStorage.getItem('todo.token')).toBeTruthy()
  })
})
