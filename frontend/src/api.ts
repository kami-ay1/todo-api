import { z } from 'zod'

/** 后端地址可以通过 VITE_API_URL 配置。 */
export const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const todoSchema = z.object({
  id: z.number(),
  title: z.string(),
  done: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const pageSchema = z.object({
  data: z.array(todoSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

const uploadSchema = z.object({
  originalName: z.string(),
  filename: z.string(),
  mimetype: z.string(),
  size: z.number(),
  url: z.string(),
})

/** Todo 数据来自后端响应校验规则。 */
export type Todo = z.infer<typeof todoSchema>
/** 分页数据来自后端响应校验规则。 */
export type TodoPage = z.infer<typeof pageSchema>
/** 上传结果保留服务器返回的文件信息。 */
export type Upload = z.infer<typeof uploadSchema>

// HTTP 错误作为明确结果返回，格式错误及网络异常直接向上传播。
async function request<Schema extends z.ZodType>(path: string, schema: Schema, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  const token = sessionStorage.getItem('todo.token')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(new URL(path, apiUrl), { ...options, headers })
  const body: unknown = await response.json()
  if (!response.ok) {
    const error = z.object({ message: z.string() }).parse(body)
    if (response.status === 401 && token) {
      sessionStorage.removeItem('todo.token')
      sessionStorage.removeItem('todo.username')
      window.dispatchEvent(new Event('todo:session-expired'))
    }
    return { ok: false as const, message: error.message, status: response.status }
  }
  return { ok: true as const, data: schema.parse(body) }
}

/** 登录成功后由调用方保存 token。 */
export function login(username: string, password: string) {
  return request('/auth/login', z.object({ token: z.string() }), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

/** 注册使用现有后端接口。 */
export function register(username: string, password: string) {
  return request('/auth/register', z.object({ id: z.number(), username: z.string() }), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

/** 查询当前用户的分页任务。 */
export function listTodos(query: URLSearchParams) {
  return request(`/todos?${query}`, pageSchema)
}

/** 创建任务时仅提交允许的 title 字段。 */
export function createTodo(title: string) {
  return request('/todos', todoSchema, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }),
  })
}

/** 更新任务标题或完成状态。 */
export function updateTodo(id: number, data: Partial<Pick<Todo, 'title' | 'done'>>) {
  return request(`/todos/${id}`, todoSchema, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
}

/** 删除当前用户选择的任务。 */
export function deleteTodo(id: number) {
  return request(`/todos/${id}`, todoSchema, { method: 'DELETE' })
}

/** FormData 的 Content-Type 及 boundary 由浏览器生成。 */
export function uploadFile(file: File) {
  const body = new FormData()
  body.append('file', file)
  return request('/uploads', uploadSchema, { method: 'POST', body })
}
