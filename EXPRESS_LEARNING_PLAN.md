# Node 后端学习计划（Express → NestJS 两段式）

这份文档用于记录当前 `todo-api` 项目的学习上下文。以后继续学习时，可以先把这个文件给 AI 看，避免重复说明前面的进度。

最近更新：2026-10-21。第 9 步已开始，后端登录注册和 JWT 的 9 项正式接口测试及测试代码类型检查全部通过；第 8 步保留真实浏览器交互待验证事项。

进度记录规则：每项功能验证完成后，立即更新完成状态、实际接口、验证结果和下一项任务；尚未执行或验证的内容保留为待办。

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
5. ✅ 加参数校验（zod）（**已完成**）
6. ✅ 加分页、筛选、排序（**已完成**）
7. ✅ 加文件上传（multer）及文件访问（**已完成，2026-10-21 验证通过**）
8. 给前端项目接真实接口（**前端已创建，接口和部分组件已验证，浏览器交互待验证**）
9. 补测试和部署（**当前步骤，登录注册与 JWT 的 9 项正式接口测试通过，其他接口测试及部署待完成**）

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

## 第一段第 4 步记录：统一错误处理（历史存档）

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

（第 5 步已完成，最新进度见下方第 5 步记录。）

---

## 第一段第 5 步记录：参数校验 zod（历史存档）

### 第 5 步新增的环境与文件

- 安装 `zod`；`app.ts` 顶部 `import { z, ZodError } from 'zod'`
- 新增两个 schema：`todoSchema`（POST 用：title 必填非空）、`todoPatchSchema`（PATCH 用：title/done 都 `.optional()`）
- 新增 `validate(schema)` 中间件工厂，POST/PATCH 路由改为挂卡形式 `auth, validate(对应schema), handler`
- 错误中间件新增 ZodError 席位：`instanceof ZodError` → 400，message 由 `err.issues` 拼接（`path.join('.') + message`）

### 第 5 步核心收获（7 项回归矩阵全部实测通过）

**为什么必须运行时校验**：TS 类型只在编译期存在，`req.body` 是从网络来的任意 JSON（类型 any），TS 帮不上忙。真实漏洞：不校验时缺 title 是 500（应为 400）；PATCH `{...req.body}` 全收，夹带 `{"id":99999}` 能改主键、夹带 `{"userId":1}` 能偷别人数据（越权）。

**zod 心智模型**：声明式 schema → `parse()` 两条路——合格返回**干净数据**（应使用返回值/写回 req.body），不合格**抛 ZodError**（不返回 null）。`issues` 数组是每条失败的 `{path, message, code}`。object 默认**白名单制**：schema 没声明的字段静默剥掉（治夹带漏洞的药）。一份 schema 有多种失败形态（缺字段 invalid_type / 空串 too_small…），都汇入同一个 400 席位。

**架构闭环**：错误中间件的决策链成为 `ZodError→400 / P2025→404 / 其他→500`——每种已知错误家族一个翻译席位，加校验规则不用加分支。

**validate 工厂（本步的工程化跃迁）**：返回函数的函数，闭包捕获 schema。内部 `req.body = schema.parse(req.body); next()`——写回 req.body 使 handler 零改动。抛错不接（Express 送错误专线）。`validate(todoSchema)` 带括号 = 现在调用、注册的是返回的中间件。

**中间件队列的统一视角**：`app.动词('/路径', 排队1, 排队2, ..., handler)`，路径后全是同签名 `(req,res,next)` 函数按序执行；每个函数只有三条出路：`next()` 放行 / 自己 `res` 响应终结 / `throw`→错误专线。**请求必须有且只有一个响应者**（裸 return = 请求挂死）。执行顺序有含义：auth（确认身份）→ validate（检查货）→ handler（闭眼用干净数据）。

**查血统 vs 查属性**：库导出了错误类（如 ZodError）用 `instanceof`（沿原型链，精准且有类型提示）；只带错误码属性的错误（如 Prisma P2025）用鸭子判定查属性。跟生态惯例走。

### 踩过的坑

- **schema 插错路由**：PATCH 误挂 `todoSchema`（title 必填版）→ 不报错，但 `{"done":true}` 的 done 被当陌生字段剥掉 → **部分修改静默丢失**。schema 与路由必须一一配对，这类错不报错只改变行为，靠回归矩阵抓。
- **旧进程骗人（二次发生）**：改完代码后，自己终端里的旧 dev 服务还占着 3000，测试全打到旧代码上（一度以为白名单没生效）。标准流程：**改代码 → 杀干净旧进程 → 确认端口空闲 → 再测**。

> 对照认知：`validate(schema)` 工厂就是 NestJS `ValidationPipe` 的雏形，Java 里是 `@Valid` + Bean Validation，Go 是 struct tag + validator。中间件队列 = Java Filter Chain / NestJS Interceptor 链。

### 留下的待办

- 可选练习（未做）：`/auth/register`、`/auth/login` 也挂 `validate`（username/password 规则自定），纯自练，套路与 POST 完全相同
- 加分题（可选）：错误中间件改 `res.status((err as any).status ?? 500)`，让非法 JSON 的 400 正确归位
- 小尾巴：`app.ts` 顶部旧 `interface Todo` 已无引用可删

### 下一步

（第 6 步已完成，最新进度见下方第 6 步记录。）

---

## 第一段第 6 步记录：分页、筛选、排序（已完成）

### 第 6 步做了什么

`GET /todos` 升级为标准列表接口，全部参数走 `todoQuerySchema` 校验：

- 分页：`?page=1&pageSize=10`（coerce.number + int + min/max + default），`skip = (page-1)*pageSize`
- 筛选：`?done=true`（`z.stringbool()` 解析布尔字符串）
- 排序：`?sortBy=createdAt&order=desc`（`z.enum` 白名单 + 计算属性名 `orderBy: { [sortBy]: order }`）
- 返回结构从裸数组改为 `{ data, total, page, pageSize, totalPages }`（**破坏性变更**，接前端时两边要同步）
- `count` 与 `findMany` 共用同一个 `where` 变量，`Promise.all` 并行执行

### 第 6 步核心收获

**req.query 里一切都是字符串**（URL 无类型信息）——`"2"+1="21"`、`"10"<"9"` 为 true。三件武器各治一类：`z.coerce.number()` 转数字、`z.stringbool()`（zod v4）转布尔、`z.enum([...])` 白名单。

**本步最著名的坑（已现场两幕演示）**：`z.coerce.boolean()` 底层是 `Boolean()`，而 `Boolean("false")===true`——`?done=false` 静默返回已完成的数据，不报错、看起来正常。修法 `z.stringbool()`。教训：**静默错误比崩溃可怕；工具的坑去工具文档找专用解**。

**enum 白名单的双重红利**：非法 `?sortBy=hacker` 被 400 拦截，且报错自动列出全部合法值（`expected one of "createdAt"|"done"`）——API 自文档化，一行代码防注入+防误用。

**声明式校验的复利**：`.min(1)`/`.max(100)` 四个字符换来人话报错（"Too small: expected number to be >=1"），经第 5 步的 ZodError→400 席位免费送达客户端。加规则不用加分支。

**列表接口铁律**：count 和 findMany 的 where 必须是同一个变量——否则总数和列表对不上（组合筛选时必踩）。`totalPages = Math.ceil(total/pageSize)`。

### 踩过的坑

- **Prisma 对象层级**：skip/take/orderBy 是 findMany 的顶层选项，塞进 `where` 里会报 `Unknown argument`（Prisma 的报错会把 where 允许的字段全部列出来，X 光很给力）
- **对象成员缺逗号**：语法错误直接起不来服务（比静默失灵好抓）
- **旧进程/孤儿进程三次骗人**：改完代码必须杀干净旧进程再测；后台启动的服务会留下孤儿 node 进程继续占端口跑旧代码；本轮还遇到「编辑器保存时序打架」。铁律：**测试结果不符时，先确认测的是哪个版本的代码**
- **分离式启动的服务在本环境活不过单次命令会话**：启动+轮询就绪+测试+清理必须放在同一条命令里

> 对照认知：skip/take = SQL 的 OFFSET/LIMIT，where = WHERE，orderBy = ORDER BY。分页筛选排序是所有后端语言所有列表接口的标配形状，面试高频题。

### 留下的待办

- 加分题（可选）：错误中间件 `res.status((err as any).status ?? 500)`
- 自选练习（可选）：register/login 挂 validate

### 下一步

第 7 步已完成，验证结果见下方第 7 步记录；当前任务见第 8 步。

---

## 第一段第 7 步记录：文件上传与文件访问（已完成）

### 已实现的功能

- 安装 `multer` 和 `@types/multer`。
- `POST /uploads` 使用 `auth` 验证登录，通过 `upload.single('file')` 接收单个文件。
- 文件保存到项目根目录的 `uploads/`，该目录已加入 `.gitignore`；multer 自动生成文件名称。
- `fileFilter` 检查请求声明的 MIME 类型，允许 `image/jpeg`、`image/png`；此项检查不验证文件实际内容格式。
- `limits.fileSize` 设置为 `5 * 1024 * 1024` 字节。
- 上传成功返回 `201`，响应包含 `originalName`、`filename`、`mimetype`、`size`、`url`。
- `app.use('/uploads', express.static('uploads'))` 提供文件访问；响应中的 `url` 为 `/uploads/${req.file.filename}`。
- 未选择文件返回 `400`；文件类型错误和 multer 错误由已有错误处理中间件统一处理。

### 核心概念

- `app.use()` 注册中间件，请求按照注册顺序执行匹配的中间件。
- `express.json()` 解析 JSON 请求体；multer 解析 `multipart/form-data` 文件上传请求。
- `upload.single('file')` 要求客户端文件字段名称为 `file`；文件信息保存在 `req.file`。
- `url` 字段告知客户端文件访问路径，`express.static()` 处理读取文件的请求。
- 当前上传需要 token；文件读取地址可以直接访问，未配置登录校验。

### 真实接口验证结果

验证时间：2026-10-21 14:05（Asia/Shanghai）。启动当前代码，通过真实注册、登录取得 token，使用真实 PNG、JPEG 及约 7.69 MB 的 PNG 发送 HTTP 请求。

| 验证项目 | 实际结果 |
|---|---|
| PNG、JPEG 上传 | 返回 `201`，响应中的文件名称、类型、大小正确 |
| 检查本地保存文件 | 与原文件逐字节一致 |
| 请求上传响应中的 `url` | 返回 `200`，下载内容与原文件逐字节一致 |
| 缺少或无效 token | 返回 `401` |
| 未选择文件 | 返回 `400`，提示“请选择文件” |
| 文件字段名称错误 | 返回 `400`，提示“文件上传失败” |
| 上传文本文件 | 返回 `400`，提示“只允许上传 JPEG 或 PNG 图片” |
| 图片超过大小限制 | 返回 `400`，提示“文件不能超过5MB” |
| 访问不存在的文件 | 返回 `404` |

上述拒绝无效请求的行为均符合预期，且没有留下上传文件。验证完成后，测试服务已终止。

验证脚本和结果保存在 `uploads/.verification/verify-upload.mjs`、`uploads/.verification/results.json`，随 `uploads/` 一同被 Git 忽略。测试账号及成功上传的测试文件已保留。

### 当前文件访问行为

multer 保存的文件没有扩展名，实测文件访问响应的 `Content-Type` 为 `application/octet-stream`。浏览器可能触发下载，浏览器图片预览尚未验证。

---

## 第一段第 8 步记录：前端接入真实接口（浏览器交互待验证）

### 已创建的前端项目

- 项目位置：本仓库 `frontend/`，使用 Vue 3、TypeScript、Vite 和 Zod，依赖已经安装。
- 前端地址：`http://localhost:5173`；Vite 设置 `strictPort: true`，端口被占用时直接终止。
- 后端地址：默认 `http://localhost:3000`，可通过前端 `VITE_API_URL` 配置。
- 后端已经安装 `cors`、`@types/cors`，注册了允许 `http://localhost:5173` 的跨域中间件。
- 页面包含注册、登录、任务新增、标题编辑、完成状态切换、删除确认、分页、筛选、排序和图片上传。
- token 保存在当前标签页的 `sessionStorage`，请求自动携带 `Authorization: Bearer <token>`；退出登录时清除，已登录请求返回 `401` 时返回登录页面。
- 图片上传使用 `FormData`，访问地址从后端响应读取；前端读取实际文件内容，以返回的 MIME 类型创建临时预览地址。
- 图片独立保存，当前后端没有图片与任务的关联接口。
- 请求处理、账号表单、任务列表和图片上传分别放在 `src/api.ts`、`AuthPanel.vue`、`TaskBoard.vue`、`UploadPanel.vue`，共享请求与响应校验规则。

### 启动方式

两个终端分别启动后端和前端：

```powershell
# 仓库根目录启动后端
npm run dev
```

```powershell
# 另一个终端进入前端目录并启动
cd frontend
npm run dev
```

### 已执行的验证

验证日期：2026-10-21。执行 `npm run typecheck` 通过；启动真实 Express 和 Vite 服务，通过 Vite 加载实际前端请求模块并调用真实数据库，以下检查通过：

| 验证项目 | 实际结果 |
|---|---|
| Vite 开发服务、全部 Vue 组件、请求模块、样式和图标 | HTTP 返回 `200`，模块编译通过 |
| `http://localhost:5173` 来源的 GET、POST、PATCH、DELETE 预检 | 返回 `204`，允许来源、方法和 `authorization,content-type` 正确 |
| 前端请求模块注册与登录 | 注册及登录成功；重复注册返回 `409`，错误密码返回 `401` |
| 新增任务与分页 | 创建 6 项任务，每页 5 项，第二页包含 1 项，总页数为 2 |
| 编辑标题与完成状态 | 返回更新后的真实数据 |
| 完成状态筛选与创建时间升序 | 已完成 1 项、待完成 5 项，顺序符合查询条件 |
| 删除不存在的任务 | 返回 `404`，前端请求模块保留业务错误结果 |
| 前端 FormData 上传及文件下载 | 上传成功，返回地址可访问，下载内容与原图片逐字节一致 |
| 登录及未登录页面的 Vue 服务端渲染 | 分别包含任务界面和账号表单 |

验证脚本和最近一轮结果保存在被 Git 忽略的 `frontend/.verification/verify.mjs`、`frontend/.verification/results.json`。每轮验证新建的测试账号、6 项任务及上传文件均已保留；测试服务已经终止。

### 新增任务与持久化专项验证（2026-10-21）

通过实际前端请求模块、真实 Express 服务和 PostgreSQL，新增“学习前端接口接入”，执行以下检查并全部通过：

- 使用独立请求重新查询列表，同一项任务的全部字段与新增响应一致。
- 保留 Node 原生 `sessionStorage` 后重新创建 Vue 应用，服务端渲染仍为登录状态；此检查尚未覆盖真实浏览器刷新。
- 清除 token 和用户名后，请求任务列表返回 `401`，重新渲染显示登录页面。
- 使用原账号重新登录，任务仍然存在，全部字段保持一致。
- 终止并重新启动本次创建的后端进程，原任务仍然存在，全部字段保持一致。

验证记录：`frontend/.verification/persistence-results.json`；复现脚本：`frontend/.verification/verify-persistence.mjs`。本次新建的一个测试账号及一项任务已保留，测试服务已经终止。业务代码没有修改。

### 登录失效组件验证（2026-10-21）

新增 `frontend/tests/src/App.test.ts`，使用 Vitest、Vue Test Utils 和 jsdom 加载完整 App 组件，调用真实 Express 接口和 PostgreSQL。三项测试全部通过：

| 验证场景 | 实际结果 |
|---|---|
| 有效 token 与主动退出 | 显示任务界面；退出后显示登录表单，token 和用户名均被清除 |
| 无效 token | 后端返回 `401`；组件清除 token 和用户名，显示登录表单及“登录已失效，请重新登录。” |
| 使用真实签名的过期 token | 后端返回 `401`；组件清除登录信息并显示相同提示 |

无效和过期 token 场景均继续填写页面登录表单并提交，确认重新登录成功、任务界面恢复、失效提示消失，并保存新的登录信息。

执行命令：在 `frontend/` 运行 `npm test`。测试自行启动、终止后端，需要本地 PostgreSQL 正常运行且 3000 端口空闲，每次运行会创建并保留一个测试账号。`npm run typecheck` 同时通过，类型检查范围包含测试和配置文件。

详细结果保存在被 Git 忽略的 `frontend/.verification/auth-results.json`。本次没有修改业务代码；新增了测试文件、测试依赖、配置和说明。验证范围为 DOM 测试环境中的真实组件交互，真实浏览器中的刷新和导航仍待验证。

### 删除任务接口验证（2026-10-21）

按用户选择，本次仅验证真实接口。通过实际前端请求模块、Express 和 PostgreSQL，新建专用测试账号及 6 项测试任务，使用每页 5 项的升序列表验证：

- 删除前第 2 页仅有 1 项任务，总数为 6，总页数为 2。
- 删除该项任务成功，响应中的任务数据与原记录一致。
- 再次查询该任务详情返回 `404`。
- 重新查询列表，总数为 5，总页数为 1，第 2 页为空。
- 第 1 页包含其余 5 项原任务，重复查询结果一致，均未出现已删除任务。

上述检查全部通过。脚本和结果保存在被 Git 忽略的 `frontend/.verification/verify-deletion.mjs`、`frontend/.verification/deletion-results.json`。本次仅删除新建账号下的一项测试任务，其余测试数据已保留，测试服务已经终止。取消删除、确认窗口及自动切换页码的页面交互尚未验证。

### 尚未完成的验证

- Windows 浏览器控制工具无法可靠识别当前页面地址，自动交互验证因此停止；尚未完成真实浏览器中的布局检查、注册登录操作、任务操作、文件选择及预览验证。
- 成功删除任务及删除后的列表、详情和分页数据已经通过真实接口验证；取消删除、确认窗口与自动切换到有效页码的页面交互尚未验证。
- 登录失效后的登录表单切换、提示、登录信息清除及重新登录已经通过组件测试，真实浏览器验证尚未完成。
- 类型检查、HTTP 接口检查、组件测试和服务端渲染均不代表上述真实浏览器交互已经验证。上述事项继续保留，当前已开始第 9 步的正式后端接口测试。

---

## 第一段当前进度：第 9 步 自动化测试与部署（进行中）

### 登录注册与 JWT 正式接口测试（2026-10-21 已通过）

新增 `tests/src/app.test.ts`，对应 `src/app.ts`，使用 Node 自带测试运行器、项目现有 tsx、jsonwebtoken 和 Zod，启动真实 Express 服务并连接 PostgreSQL。

在项目根目录运行：

```powershell
npm test
npm run test:typecheck
```

两条命令均执行通过；共 9 项测试，0 项失败：

| 验证场景 | 实际结果 |
|---|---|
| 注册新账号 | 返回 `201`，响应仅包含账号编号及用户名 |
| 重复注册 | 返回 `409`，提示用户名已被占用 |
| 正确登录 | 返回 `200` 和有效 token；签名、账号编号及七天有效期正确 |
| 错误密码 | 返回 `401`，提示用户名或密码错误 |
| 不存在的账号 | 返回 `401`，响应文案与错误密码一致 |
| 缺少 token 请求任务列表 | 返回 `401`，提示未提供 token |
| 无效 token 请求任务列表 | 返回 `401`，提示 token 无效或已过期 |
| 使用真实签名的过期 token 请求任务列表 | 返回 `401`，提示 token 无效或已过期 |
| 有效 token 请求任务列表 | 返回 `200`，专用账号的分页列表为空 |

测试先检查 3000 端口是否空闲，再启动当前应用，结束后终止自行启动的服务。本次新增两个专用测试账号并保留数据。需要本地 PostgreSQL 运行，且 `.env` 中包含有效的 `DATABASE_URL` 和 `JWT_SECRET`。

测试说明见 `tests/README.md`，测试代码类型检查配置为 `tests/tsconfig.json`。最近一次执行记录保存在 `.verification/auth-tests.log`，该目录已加入 `.gitignore`。本次没有修改业务代码。

### 下一项任务

补充 Todo CRUD、用户数据隔离、参数校验、分页筛选排序和上传限制的正式接口测试；部署尚未开始。前端已有的真实浏览器交互待验证事项继续保留。

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

`Todo[]` 表示这是一个数组，每一项都必须符合 `Todo` 接口。第 1 步使用内存存储，服务重启后数据丢失；当前项目已经使用 Prisma 和 PostgreSQL 持久化数据。

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

## 第 1 步内存版代码示例

当前实现见 `src/app.ts`，以下示例用于回顾第 1 步的内存 CRUD。

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
