# Node 后端学习计划（Express → NestJS 两段式）

这份文档用于记录当前 `todo-api` 项目的学习上下文。以后继续学习时，可以先把这个文件给 AI 看，避免重复说明前面的进度。

## 设计思路：为什么分两段

本计划刻意分成两段，目的是同时获得两种能力：

- **Express 段**：理解 HTTP 的「裸」本质 —— 一个请求就是一个 `req` 对象，处理完主动用 `res.json()` 响应，中间件就是一串函数排成链。这是所有后端语言（Java、Go 等）的共同基础。
- **NestJS 段**：学习分层架构、依赖注入、DTO、Guard 这些工程化概念。NestJS 故意照着 Java Spring 的设计做的，学会后几乎能 1:1 迁移到 Java Spring，也能顺滑迁移到 Go 的工程化写法。

> 类比：Express 教你「DOM 事件到底怎么运作」，NestJS 教你「组件化/状态管理怎么组织」。两层都走，迁移到任何后端语言都不会发怵。

## 总学习路线

### 第一段：Express（理解 HTTP 本质）

1. ✅ 用 Express 写 CRUD，不接数据库（**已完成**）
2. ✅ 接 Prisma 和 PostgreSQL（**已完成**）
3. 加登录注册（JWT）
3. 加登录注册（JWT）
4. 加统一错误处理
5. 加参数校验（zod）
6. 加分页、筛选、排序
7. 加文件上传（multer）
8. 给前端项目接真实接口
9. 补测试和部署

### 第二段：NestJS（学习工程架构）

完成第一段后，把同一个 Todo 项目**用 NestJS 重写一遍**，横向对比。重点不是再学一遍 CRUD，而是吃透这些**可迁移到 Java/Go 的概念**：

| NestJS 概念 | Java Spring 对应 | Go 对应 | 学什么 |
|---|---|---|---|
| Module | `@Module` / Bean 配置 | package 划分 | 代码怎么按模块组织 |
| Controller | `@RestController` | handler 函数 | 请求入口分层 |
| Service（Provider） | `@Service` | service struct | 业务逻辑层 |
| Dependency Injection | `@Autowired` | 手动 wire | 对象怎么被组装、解耦 |
| DTO + ValidationPipe | `@Valid` + Bean Validation | struct tag / validator | 参数校验分层 |
| Guard | `@PreAuthorize` / Filter | middleware | 鉴权怎么做 |
| Exception Filter | `@ControllerAdvice` | recover middleware | 统一错误处理 |

NestJS 阶段的具体路线：

1. `nest new` 脚手架 + 理解 Module/Controller/Service 三件套
2. 用 NestJS 重写 Todo CRUD（对应第一段的第 1 步）
3. NestJS 接 Prisma（对应第 2 步）
4. NestJS 加 JWT + Guard 登录态（对应第 3 步）
5. NestJS 用 ValidationPipe + DTO 做校验（对应第 4、5 步，NestJS 原生支持，比 Express 简洁）
6. NestJS 分页筛选排序 + 文件上传（`FileInterceptor`）
7. NestJS 测试（`@nestjs/testing`）和部署

---

## 第一段当前进度：Express + Prisma + PostgreSQL 版 CRUD

### 已完成

第 1 步（内存版 CRUD）和第 2 步（接 Prisma + PostgreSQL）都已封顶：

**第 2 步新增的环境与文件：**

- PostgreSQL 18 装在 `D:\postgreSQL\`，超级用户 `postgres` 密码已重置（存在 `.env`）
- 数据库 `todo_api`（UTF8，支持中文）
- 安装 `prisma`、`@prisma/client`、`@prisma/adapter-pg`、`dotenv`、`pg`
- 创建 `prisma/schema.prisma`（数据模型定义）
- 创建 `prisma.config.ts`（Prisma 7 配置文件，管「建表命令怎么连数据库」）
- 创建 `.env`（存 `DATABASE_URL` 连接串，已被 gitignore）
- `npx prisma db push` 把 schema 同步成数据库表
- `npx prisma generate` 生成 Prisma Client 到 `src/generated/prisma/`

> ⚠️ **Prisma 7 与旧版差异**（踩过坑）：连接串不再写在 `schema.prisma` 的 `datasource.url`，而是移到 `prisma.config.ts` 的 `datasource.url`；generator provider 从 `prisma-client-js` 改为 `prisma-client`，且必须指定 `output`；创建 PrismaClient 必须用 driver adapter（`@prisma/adapter-pg`）；不再自动读 `.env`，要手动 `import 'dotenv/config'`。

当前服务地址：`http://localhost:3000`
当前启动命令：`npm run dev`（注意：`tsx src/app.ts` 不会自动热重载，改代码后要 Ctrl+C 重启）

### 第 2 步核心收获（已用 Apifox 实测验证）

- [x] `GET /todos` —— `prisma.todo.findMany()` 查全部
- [x] `GET /todos/:id` —— `prisma.todo.findUnique({ where: { id } })` 查不到返回 `null` → 404
- [x] `POST /todos` —— `prisma.todo.create({ data })`，验证了 `@default(autoincrement())` 自增 id、`@default(now())`/`@updatedAt` 自动时间戳
- [x] `PATCH /todos/:id` —— `prisma.todo.update({ where, data })`，用 `{ ...req.body }` 灵活更新；验证了 `@updatedAt` 会自动刷新；记录不存在抛 `P2025` 错误
- [x] `DELETE /todos/:id` —— `prisma.todo.delete({ where })`，记录不存在同样抛 `P2025`
- [x] **重启服务数据还在**（内存版一重启就全没，这是数据库的本质意义）

### 关键认知点

**Prisma 是 ORM 中间层**：它把代码里的 `prisma.todo.xxx()` 翻译成 SQL，发给 PostgreSQL。架构分三层：
- 底层驱动：`pg` 包（发 SQL）
- 连接池：`pg` 的 `Pool`（复用连接）
- ORM：`PrismaClient`（翻译官）

> 对照认知：Java 是 `JDBC Driver → HikariCP → EntityManager(JPA)`，Go 是 `pgx → pgxpool → GORM`。三层结构跨语言通用。

**schema.prisma 的心智模型**：
- `generator` —— 告诉工具「生成什么客户端、放哪」（配置项）
- `datasource` —— 告诉工具「连什么类型的数据库」（配置项）
- `model` —— ★ 数据库表的图纸 ★（日常只改这块）

**改 schema 的固定循环**：改 `model` → `npx prisma db push`（同步表结构）→ `npx prisma generate`（重新生成 Client）

**Prisma 错误处理**：`findUnique` 查不到返回 `null`（用 `if (!todo)` 判断）；`update`/`delete` 查不到**抛 P2025 错误**（在 catch 里用 `err.code === 'P2025'` 判断返回 404）。

> 对照认知：NestJS 里这步用 Prisma 的异常过滤器；Java JPA 用 `EmptyResultDataAccessException`；概念一致——「记录不存在」是跨 ORM 的通用错误场景。

### 留下的待办（后面步骤会回来解决）

- ⚠️ `POST /todos` 客户端不传 `title` 时，会返回 500（应该是 400 客户端错误）→ 第 5 步用 zod 校验解决
- ⚠️ `PATCH` 用 `{ ...req.body }` 能传任意字段（如改 id、传不存在字段）→ 第 5 步用 zod 校验解决
- ⚠️ 每个接口都写了重复的 `try/catch` → 第 4 步用统一错误处理中间件消除

### 下一步

进入第 1 阶段第 3 步：加登录注册（JWT）。先做用户注册、登录，密码加密，再用 JWT 维持登录态，最后用中间件保护 todo 接口（必须登录才能访问）。

---

## 第一段项目核心代码说明

### Express 应用

```ts
const app = express()
```

创建一个 Express 应用实例，后续所有接口都挂在 `app` 上。

### JSON 请求体解析

```ts
app.use(express.json())
```

让 Express 可以解析客户端传来的 JSON 请求体。如果没有这行，`req.body` 通常会是 `undefined`。

> 对照认知：NestJS 默认装了 `body-parser`，这一步被框架自动处理了；Java 里对应 Spring 的消息转换器。

### Todo 类型

```ts
interface Todo {
  id: number
  title: string
  done: boolean
}
```

> 对照认知：这个 `interface` 在 NestJS/Java 里会变成带校验注解的 DTO 类，在 Go 里就是 struct。

### Todo 数组（内存存储）

```ts
const todos: Todo[] = [
  { id: 1, title: '学习 Express', done: false },
]
```

`Todo[]` 表示这是一个数组，每一项都必须符合 `Todo` 接口。当前没接数据库，数据存在内存里，服务重启就丢失。

### 启动服务

```ts
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})
```

让 Express 监听 3000 端口。没有这行，路由定义了也不会真正运行。

---

## 当前接口清单

```txt
GET    /todos       查询 todo 列表
GET    /todos/:id   查询单个 todo
POST   /todos       新增 todo
PATCH  /todos/:id   更新 todo
DELETE /todos/:id   删除 todo
```

## 建议的当前版 `src/app.ts`

```ts
import express from 'express'

const app = express()

app.use(express.json())

interface Todo {
  id: number
  title: string
  done: boolean
}

const todos: Todo[] = [
  { id: 1, title: '学习 Express', done: false },
]

app.get('/todos', (req, res) => {
  res.json(todos)
})

app.get('/todos/:id', (req, res) => {
  const id = Number(req.params.id)
  const todo = todos.find((todo) => todo.id === id)

  if (!todo) {
    res.status(404).json({ message: 'Todo 不存在' })
    return
  }

  res.json(todo)
})

app.post('/todos', (req, res) => {
  const todo: Todo = {
    id: Date.now(),
    title: req.body.title,
    done: false,
  }

  todos.push(todo)

  res.status(201).json(todo)
})

app.patch('/todos/:id', (req, res) => {
  const id = Number(req.params.id)
  const todo = todos.find((todo) => todo.id === id)

  if (!todo) {
    res.status(404).json({ message: 'Todo 不存在' })
    return
  }

  if (req.body.title !== undefined) {
    todo.title = req.body.title
  }

  if (req.body.done !== undefined) {
    todo.done = req.body.done
  }

  res.json(todo)
})

app.delete('/todos/:id', (req, res) => {
  const id = Number(req.params.id)
  const index = todos.findIndex((todo) => todo.id === id)

  if (index === -1) {
    res.status(404).json({ message: 'Todo 不存在' })
    return
  }

  const [deletedTodo] = todos.splice(index, 1)

  res.json(deletedTodo)
})

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})
```

---

## Apifox 测试方式

### 查询列表

```txt
GET http://localhost:3000/todos
```

### 查询详情（含 404）

```txt
GET http://localhost:3000/todos/1
GET http://localhost:3000/todos/99999   # 应返回 404
```

### 新增 todo

```txt
POST http://localhost:3000/todos
```

Body 选择 JSON：

```json
{
  "title": "用 Apifox 测 Express 接口"
}
```

### 更新 todo

```txt
PATCH http://localhost:3000/todos/1
```

Body 选择 JSON：

```json
{
  "title": "学习 Express CRUD",
  "done": true
}
```

### 删除 todo

```txt
DELETE http://localhost:3000/todos/1
```

---

## 已遇到的问题和解决方式

### `npx tsc --init` 报 `Unexpected token '?'`

原因：当前 Node.js 版本过旧，无法运行新版 TypeScript 工具链中的 `??` 语法。

解决：升级 Node.js 到较新的 LTS 版本，建议 Node 18+ 或 20+。

检查命令：

```bash
node -v
npm -v
```

### ESM 和 CommonJS 配置冲突

曾遇到错误：

```txt
ECMAScript 导入和导出不能写入 "verbatimModuleSyntax" 下的 CommonJS 文件中
```

推荐使用 ESM 配置。

`package.json` 顶层添加：

```json
{
  "type": "module"
}
```

`tsconfig.json` 推荐使用：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

## 第一段后续阶段说明

### 接 Prisma 和 PostgreSQL

目标：

- 安装 Prisma
- 初始化 Prisma
- 连接 PostgreSQL
- 定义 `Todo` 数据模型
- 使用 Prisma 迁移创建数据库表
- 把内存数组替换成数据库 CRUD

接口保持不变，变化点是数据从内存数组改为 PostgreSQL。

### 登录注册

目标：

- 用户注册、登录
- 密码加密
- JWT 登录态
- 登录后才能访问 todo 接口

### 统一错误处理

目标：

- 不在每个接口里重复写 `try/catch`
- 使用统一错误处理中间件
- 区分业务错误和系统错误

> 对照认知：NestJS 里这步用 Exception Filter，Java 用 `@ControllerAdvice`，概念完全一致。

### 参数校验

目标：用 `zod` 校验 `req.body`、`req.params`、`req.query`。

> 对照认知：NestJS 里用 ValidationPipe + DTO，Java 用 `@Valid` + Bean Validation。

### 分页、筛选、排序

目标：支持 `page`、`pageSize`、按完成状态筛选、按创建时间排序。

### 文件上传

目标：用 `multer` 接收文件、保存、返回访问地址。

### 接入前端项目

目标：前端用真实接口、处理跨域、封装请求方法、对接登录态。

### 测试和部署

目标：写基础接口测试、配置环境变量、部署 Node 服务、部署 PostgreSQL。

---

## 第二段：NestJS 阶段（第一段完成后启动）

> 进入前，先在项目里执行 `npm i -g @nestjs/cli`，然后用 `nest new` 新建一个 NestJS 项目（或在本仓库开一个 `nest-app/` 子目录）。

### NestJS 阶段路线

1. **脚手架与三件套**：`nest new` + 生成 `TodosModule` / `TodosController` / `TodosService`，理解它们怎么配合。
2. **重写 Todo CRUD**：用 NestJS 实现和第一段一样的 5 个接口，横向对比 `@Get` / `@Post` / `@Param` / `@Body` 和 Express 的 `req.params` / `req.body`。
3. **接 Prisma**：把 Service 里的内存数组换成 Prisma，复用第一段的数据库设计。
4. **JWT + Guard**：`@nestjs/jwt` 实现 登录/注册，用 Guard 保护 todo 接口（对应 Express 的登录中间件）。
5. **ValidationPipe + DTO**：用 class-validator 注解做参数校验（对应第一段的 zod）。
6. **分页筛选排序 + 文件上传**：`FileInterceptor` 接收文件。
7. **测试与部署**：`@nestjs/testing` 写测试，部署 NestJS 服务。

### 学习重点（可迁移能力）

每一步都要问自己：「这个概念在 Java Spring / Go 里叫什么、长什么样？」把对照表用起来。NestJS 阶段结束后，你看 Java Spring Boot 的 Controller/Service/`@Autowired`/`@Valid` 会觉得眼熟，看 Go 的分层项目结构也不会陌生。

---

## 学习原则

- 每一步都先跑通最小功能，再重构
- 不提前设计复杂架构
- 第一段先把内存版 CRUD 写熟，理解请求、响应、路由和数据流
- 切到 NestJS 不是重学 CRUD，而是学架构思维
- 每学一个概念，对照它在 Java/Go 里长什么样
- 每次只解决一个明确问题
