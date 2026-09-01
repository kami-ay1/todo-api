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
3. ✅ 加登录注册（JWT）（**已完成**）
4. ✅ 加统一错误处理（**已完成**）
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

## 第一段第 2 步记录：Express + Prisma + PostgreSQL 版 CRUD（历史存档）

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

（第 3 步已完成，最新进度见下方第 3 步记录。）

---

## 第一段第 3 步记录：JWT 登录注册（历史存档）

### 第 3 步新增的环境与文件

- schema 新增 `User` 模型（`username @unique`、`password` 存哈希），`Todo` 加 `userId` 外键关联 User，`npx prisma db push` 已同步
- 安装 `bcryptjs`、`jsonwebtoken`（及对应 `@types`），`.env` 新增 `JWT_SECRET`
- `src/app.ts` 新增：`POST /auth/register`、`POST /auth/login`、`auth` 鉴权中间件；5 条 todo 路由全部挂上 `auth` 并建立数据归属

### 第 3 步核心收获（全部已用 Apifox 实测验证）

**JWT 完整链路**：

- 登录成功 → `jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })` 签发 token
- 客户端后续请求带 `Authorization: Bearer <token>`（Bearer 后有一个空格）
- `auth` 中间件：`split(' ')[1]` 取 token → `jwt.verify` 验签（**失败是抛异常不是返回 null，必须 try/catch**）→ 把 `payload.userId` 挂到 `req.userId` → `next()` 放行；任何一步失败直接 401 且不调 next
- 两种 401 文案刻意区分：「未提供token」（header 缺失/格式错）vs「token无效或已过期」（验签失败），排查时一眼定位

**密码存储**：注册 `bcrypt.hash(password, 10)` 存哈希；登录 `bcrypt.compare` 比对。数据库永远不存明文。

**防越权（本步灵魂，已做交叉测试）**：

- `POST /todos` 的 create data 带上 `userId: req.userId!`，新数据归属当前用户
- `GET /todos` 用 `where: { userId }` 只返回自己的
- 详情/PATCH/DELETE 先 `findFirst({ where: { id, userId } })` 验归属，查不到统一 404 —— 用户 B 对 A 的数据「看不见也改不动」，404 而不是 403（对越权者来说别人的数据等于不存在）

**Prisma 坑**：`findUnique` 的 `where` 只接受唯一字段（如 id），写不了 `{ id, userId }` 组合；`findFirst` 可以。

**中间件两种挂法**（都合法，选一保持一致）：

| 挂法 | 写法 | 特点 |
|---|---|---|
| 路由级（当前用法） | `app.get('/todos', auth, handler)` | 路由处一眼可见受保护；但以后新路由忘写 `auth` 就是裸奔的安全洞 |
| 路径级 | `app.use('/todos', auth)`（写在路由之前） | 一行保护该前缀下所有路由，含未来新增的 |

**踩过的坑：定义中间件 ≠ 启用中间件**。auth 函数写好了但没挂到路由上，等于没写——当时表现为「空 token 访问返回 200」，排查方式：先发不带 token 的请求看是否 401，200 即中间件未生效。

**TS 扩展 Request 类型**（类型合并样板，放在 imports 后）：

```ts
declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}
```

> 对照认知：NestJS 里这步是 AuthGuard + 装饰器取当前用户；Java Spring 是 Filter/Interceptor + SecurityContext；Go 是中间件把 userId 塞进 request context。跨语言概念一致：**进入业务逻辑前统一验明身份**。

### 当前接口清单

```txt
POST   /auth/register  注册（body: username、password），返回 201
POST   /auth/login     登录（body: username、password），返回 { token }
GET    /todos          查询自己的 todo 列表（需登录）
GET    /todos/:id      查询单个 todo（需登录，仅自己的）
POST   /todos          新增 todo（需登录，归属当前用户）
PATCH  /todos/:id      更新 todo（需登录，仅自己的）
DELETE /todos/:id      删除 todo（需登录，仅自己的）
```

### 留下的待办（后面步骤会回来解决）

- ⚠️ 每个接口都写了重复的 `try/catch` → 第 4 步用统一错误处理中间件消除
- ⚠️ `POST /todos` 不传 `title` 仍返回 500；`PATCH` 的 `{...req.body}` 仍能传任意字段 → 第 5 步用 zod 校验解决
- 小尾巴（不急）：`app.ts` 里旧的 `interface Todo` 已无引用可删；中间件里 `(payload as any)` 可用类型守卫优化

### 下一步

（第 4 步已完成，最新进度见下方第 4 步记录。）

---

## 第一段当前进度：第 4 步 统一错误处理（已完成）

### 第 4 步改了什么

- 新增**错误处理中间件**：四参数函数 `(err, req, res, next)`，挂在所有路由之后、`app.listen` 之前
- 7 条路由的 `try/catch` 全部拆除，出错直接 throw，错误沿中间件链流到统一出口
- 原 PATCH 里的 `P2025` 判断逻辑搬家到错误中间件统一翻译

### 第 4 步核心收获（12 项验收矩阵全部实测通过）

**错误中间件三要素**：

- **四参数是身份标识**：Express 靠参数个数认出错误中间件，写三个参数就是普通中间件，永远收不到错误
- **必须挂在路由之后**：错误只向后流，排在出错点之后的错误处理器才接得住（实测把路由写在错误中间件之后，错误直接落到 Express 出厂兜底的 HTML 页）
- **日志和响应分离**：`console.log(err)` 留全量真相在服务端，客户端只给模糊文案（不暴露堆栈）

**Express 5 的关键红利**：async 路由里 throw / Promise reject 会被框架自动捕获并转给错误中间件，**不需要** try/catch 也不需要 `express-async-handler`（那是 Express 4 时代的东西，看旧文章注意版本差异）。实测：路由里 `throw new Error('测试错误')` → 中间件收到完整错误 + 堆栈。

**业务分支 ≠ 异常**：`if (!todo) 404`、重名 409、密码错 401 这些主动检查后的响应是正常业务逻辑，保留在路由里。auth 中间件里的 try/catch 也保留——它做的是有意义的翻译（验签失败 → 401），不是样板。

> 验收标准：路由函数里 0 个 try/catch；全文 `try` 恰好 1 处（auth 中间件）、`status(500)` 恰好 1 处（错误中间件）。

**踩坑实录：拆壳留尸**。删 try/catch 时把 catch 里的 `res.status(500)...` 留在了正常代码后面，导致每次成功响应后再试图发第二次响应 → `ERR_HTTP_HEADERS_SENT`。症状极阴：客户端完全正常，服务端每次请求都在报错。自查武器：**搜 `status(500)`，只允许出现 1 次**。

**调试能力升级**：出错时控制台能看到 Prisma 的真实报错（如 `Argument title is missing` + 精确定位行号 + 缺失字段示意），不再是黑盒 500。

**非法 JSON 的路径**：body 只写半个 `{` 会让 body-parser 抛错，同样流进错误中间件；该错误自带 `status: 400`。

> 对照认知：NestJS 用 Exception Filter + 自定义异常类；Java 用 `@ControllerAdvice` + `@ExceptionHandler`；Go 用 recover 中间件。概念一致：**错误处理集中到一个出口，业务代码只管正常流程**。

### 留下的待办（后面步骤会回来解决）

- ⚠️ `POST /todos` 不传 `title` 现在返回 500（应是 400 客户端错误）；`PATCH` 的 `{...req.body}` 仍能传任意字段 → 第 5 步 zod 解决
- 加分题（可选）：错误中间件改成 `res.status((err as any).status ?? 500)`，让自带 status 的错误（如非法 JSON 的 400）正确归位
- 小尾巴：`app.ts` 顶部旧 `interface Todo` 已无引用可删

### 环境教训（本项目反复验证）

- **改完代码必须重启**（tsx 不热重载），否则测的是旧代码——本次验证时旧进程返回的是 Express 默认 HTML 错误页，一度误判中间件没生效
- **「已停止」≠ 真停了**：停服务后用 `netstat -ano | grep :3000` 验证端口真的释放了（tsx 的子进程可能在父进程被杀后存活）

### 下一步

进入第 1 阶段第 5 步：参数校验（zod）。目标：`POST /todos` 不传 title 返回 400 + 明确错误信息，而不是等 Prisma 抛 500；`PATCH` 只允许传 `title`/`done` 两个合法字段。核心心智模型：**在数据进入业务逻辑之前设卡检查**——校验是另一类中间件。

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

## 接口清单（第 2 步时的历史版本）

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
