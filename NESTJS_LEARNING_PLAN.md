# NestJS 后端学习计划：以 nest-admin 为实践项目

更新日期：2026-10-22。

学习项目：[buqiyuan/nest-admin](https://github.com/buqiyuan/nest-admin)。源码审阅基于 2026-10-21 获取的 `main` 分支；独立练习工程的基础 HTTP 服务已完成启动验证。

当前进度：阶段 2 的 Controller 请求体读取及 TodoModule 注册均已通过真实 HTTP 验证，下一项为创建 TodoService 并学习 Provider 注册和注入。阶段 0 的基础工程已完成，MySQL、Redis 等准备仍待完成。Node.js 为 `24.9.0`，npm 为 `11.6.0`，练习工程的依赖安装、类型检查、启动及 HTTP 请求检查通过。本机存在 pnpm 命令入口，pnpm 实际版本和 MySQL、Redis 连接能力待验证。未在当前命令路径发现 mysql、redis-server、docker，也未发现 MySQL、Redis 的 Windows 服务。PostgreSQL 18 已运行，继续用于原 Express 项目。

各阶段“源码入口”中的 `src/`、`deploy/`、配置文件路径均相对于 nest-admin 参考源码根目录。独立练习工程使用本工作区的 `nest-admin-study/` 目录，从基础启动代码开始，由用户根据需求编写业务模块。源码审阅用的 `.verification/research/nest-admin-main/` 作为阅读参考。

配套前端为 [buqiyuan/vue3-antdv-admin](https://github.com/buqiyuan/vue3-antdv-admin)，已克隆到 `C:/Users/15983/Desktop/CODE/vue3-antdv-admin`，与 `todo-api` 同级，使用独立 Git 仓库。当前提交为 `64c03db76710e70b85aedf40a9ca87101946d70d`，采用浅克隆，仅包含当前提交所需历史。前端用于阅读接口需求及后续真实联调。

## 学习目标与工程约定

完成主线后，需要能够独立完成以下工作：

- 将需求拆成 Module、Controller、Service、DTO、Entity，并说明依赖关系和模块公开边界。
- 理解请求生命周期，正确选择 Middleware、Guard、Pipe、Interceptor 和 Filter。
- 使用 TypeORM、MySQL 完成查询、关联、迁移、事务及并发更新控制。
- 实现注册登录、密码存储、JWT、刷新与撤销、角色权限及记录归属校验。
- 使用 Redis、任务队列、定时任务和事件完成异步业务，并处理失败、重试和重复执行。
- 实现文件上传、WebSocket、SSE，管理资源生命周期和用户隔离。
- 设计接口契约、执行真实验收、记录日志、检查服务健康、处理启动和终止，以及完成本机部署。
- 能在不复制现有业务实现的情况下，为项目新增一个完整功能模块。

主线沿用项目的 NestJS、Fastify、TypeORM、MySQL、Redis。参考源码锁文件中的 NestJS 为 `11.0.13`，TypeORM 为 `0.3.22`；独立练习工程使用 NestJS `11.2.7` 和 Fastify，具体版本由自己的 `package-lock.json` 记录，后续数据库等依赖在对应任务中配置，不自动更新已安装依赖。

原 Express 项目继续作为 HTTP、JWT、校验、分页、上传及部署行为的学习参考。它使用的 Prisma、PostgreSQL 与当前主线分别学习；相关集成列在独立拓展练习中。

每个阶段按照“建立整体理解 → 讨论相关设计取舍 → 提出诊断问题 → 针对遗漏补充讲解 → 用户编写关键代码 → 运行真实请求 → 更新进度”推进。采用下文的五个核心思考框架、三个设计取舍与十个诊断问题组织学习。每次只深入一个主题、提出一个问题，关联当前模块和已有 Express 经验。AI 负责收集证据、解释、辅助排错和执行验收，用户需要能够解释关键实现。

当前工作区保持不保存测试文件的约定；测试知识仍属于主线。临时验收脚本放入被 Git 忽略的 `.verification/`，完成后清理，不使用 mock 或伪造响应。单元测试知识结合纯业务逻辑学习，集成及端到端验收使用真实依赖。

不自动执行 Git 提交、创建分支、安装全局工具或修改现有学习数据库。构建命令仅在阶段验收需要检查编译产物、迁移或部署流程时运行，并先说明原因。

## 教学方法：整体理解、设计取舍与诊断练习

依据用户提供文章中的三个提问组织教学。以下五个框架和三个取舍是结合 NestJS 官方文档、nest-admin 源码及用户学习目标所做的教学整理。学习进度由解释、独立编写和真实运行结果确认；不设定“48 小时掌握全部知识”的完成标准。

### 五个核心思考框架

| 思考框架 | 需要回答的问题 | 当前项目中的例子 |
|---|---|---|
| 按照职责组织功能 | 请求接收、业务规则、数据访问分别由谁负责？ | AuthController 接收参数，AuthService 处理账号登录，相关 Service 通过 Repository 访问数据；Module 组织组件及公开边界 |
| 由 Nest 管理依赖 | 一个对象需要另一个对象时，谁负责创建和提供？ | Controller 通过构造函数获得 Service；追踪 providers、imports、exports 与实例作用域 |
| 明确数据契约与信任边界 | 收到哪些字段，如何校验，允许返回哪些数据？ | 前端 API.LoginDto、后端 LoginDto、ValidationPipe、登录响应和用户数据归属 |
| 沿着执行流程推理 | 请求先经过谁，哪里可以拒绝请求，异常会到达哪里？ | Guard、Pipe、Controller、Service、Interceptor 和 Filter；定时任务调用 Service 时需要另行落实输入和身份规则 |
| 管理状态与资源生命周期 | 数据存在哪里，何时提交，失败如何处理，资源何时释放？ | MySQL 事务、Redis 失效、队列重试、上传文件一致性和应用终止清理 |

### 三个设计取舍

这些内容作为真实工程选择讨论，各方理由和适用条件需要结合证据说明，不宣称整个领域存在统一的争论分类。

| 设计选择 | 两种做法各自有力的理由 | 本项目的学习安排 |
|---|---|---|
| Express 与 Fastify | Express 具有广泛的中间件生态和既有经验；Fastify 提供自身的插件机制及性能特征，具体收益需要真实负载验证 | 主线沿用 Fastify，上传和底层请求对象按照对应平台学习 |
| 全局基础模块与显式模块导入 | 全局模块减少基础设施的重复导入；显式 imports、exports 让依赖和公开边界更容易追踪 | 追踪上游现有设计，能说明一个 Service 为何在当前模块可用，再讨论全局共享范围 |
| Service 直接使用 TypeORM Repository 与另设数据访问抽象 | 直接注入减少中间层，便于使用 TypeORM 功能；独立抽象可以集中复杂查询或隔离多个数据实现，但增加维护内容 | 沿用已有 Repository 注入；仅在形成真实复用或隔离需求时增加抽象，并验证事务使用正确的 EntityManager |

### 十个诊断问题

问题按学习阶段逐个提出。初次学习时提供必要背景，回答后说明推理依据；不要求用户一次完成全部问题。

1. 网页请求和定时任务都需要创建 Todo，哪些代码可以共同调用，哪些代码与 HTTP 接口有关？为什么？
2. 删除 Controller 路由方法上的 @Post('login')，保留名为 login 的方法，Nest 能否继续通过原来的 POST 路径调用它？
3. 一个 Service 添加了 @Injectable()，另一个模块仍无法注入它，需要检查哪些模块配置？
4. 前端声明 password 是 string，用户直接发送数字密码，后端在什么条件下能够拒绝？
5. 认证 Guard 拒绝请求后，Controller 中的登录或业务方法是否执行？异常或响应经过哪些处理？
6. 用户 A 已登录并拥有修改权限，把请求里的 Todo id 改成用户 B 的记录编号，还需要检查什么？
7. 一次业务需要执行两次数据库写入，第二次失败后如何确保第一项写入也撤销？事务内的 Repository 有什么要求？
8. 修改数据库后 Redis 仍保存旧权限时，用户可能看到什么行为？如何验证缓存失效符合约定？
9. 队列任务已经修改数据，进程在确认任务完成前终止，任务重新执行时如何避免重复业务结果？
10. 文件已经写入磁盘但数据库记录保存失败，或者应用关闭时仍有 SSE 连接，应如何管理这些资源？

### 每次练习的执行方式

- 说明当前问题属于哪个思考框架，使用一个已有 Express 场景解释，并阅读当前任务必需的源码。
- 用户先预测行为或说明代码应该放在哪里；AI 根据回答指出已经理解的部分、遗漏的条件和判断依据。
- 对不清楚的概念补充一个具体例子，再提出一个只改变一个条件的相近问题。
- 进入编码时由用户编写关键部分；AI 协助运行真实请求、检查错误和边界行为，验证完成后更新计划。
- AI 准备可运行的基础工程和需求提示；业务 Controller、Service、DTO、Entity 及规则由用户按任务编写，练习文件保留空白或需求注释。每次验证前重新读取用户当前代码。
- 在后续相关练习中再次检查已学内容；复制讲解文字或表示理解不单独作为掌握证据。

当前教学任务：用户创建 `nest-admin-study/src/modules/todo/todo.service.ts`，声明带有 `@Injectable()` 的 TodoService 类；随后学习在 TodoModule 的 providers 中注册，并通过 Controller 构造函数注入。TodoModule 注册及原有 POST 接口已通过验收；任务保存、运行时校验及认证属于后续练习。

## 阶段进度

| 阶段 | 学习主题 | 当前状态 |
|---|---|---|
| 0 | 环境、练习工程和首次启动 | 基础工程已验证，MySQL、Redis 等待配置 |
| 1 | TypeScript、装饰器、元数据与项目入口 | 待学习 |
| 2 | Module、Controller、Service 与依赖注入基础 | 进行中，Controller 与 TodoModule 已验证，待学习 Service |
| 3 | Provider、动态模块、作用域和生命周期 | 待学习 |
| 4 | 完整请求生命周期、Middleware 与 RxJS | 待学习 |
| 5 | DTO、参数转换、运行时校验与 Swagger | 待学习 |
| 6 | TypeORM、MySQL、关联和迁移 | 待学习 |
| 7 | 密码、认证、JWT 和会话生命周期 | 待学习 |
| 8 | Todo 完整业务与数据归属 | 待学习 |
| 9 | RBAC、资源权限与接口访问边界 | 待学习 |
| 10 | 事务、并发更新和重复请求 | 待学习 |
| 11 | 配置校验、Redis 缓存与一致性 | 待学习 |
| 12 | Bull 队列、失败重试与消费幂等 | 待学习 |
| 13 | 定时任务、应用事件和终止清理 | 待学习 |
| 14 | 文件上传、文件校验与存储一致性 | 待学习 |
| 15 | WebSocket、SSE 与连接生命周期 | 待学习 |
| 16 | 测试方法、接口契约和真实回归验收 | 待学习 |
| 17 | 日志、健康检查、可靠性与本机部署 | 待学习 |
| 18 | 独立完成功能模块与最终验收 | 待学习 |

## 贯穿业务：完善 Todo 模块

根据参考项目的 `src/modules/todo/` 需求，在独立练习工程中亲自编写 Todo 模块，接口保留项目的字段命名 `value`、`status`，明确它们分别表示任务内容与完成状态。

最终行为要求：创建时绑定当前用户；用户只能读取和修改自己的任务；支持完成状态切换、分页、筛选和明确的排序规则；输入参数、响应、错误和权限具有一致契约。管理员访问范围需要显式定义并单独验收。

源码审阅发现的以下事项，作为需要实现和验证的任务记录，不视为已经复现或修复：

| 已发现的实现边界 | 学习与验收要求 | 对应阶段 |
|---|---|---|
| Todo 创建未绑定当前用户，列表和详情未按用户过滤 | 创建、列表、详情、修改、删除全部检查归属 | 8、9 |
| TodoQueryDto 继承必填 value，Service 未使用该字段筛选 | 查询 DTO 的可选字段与实际查询一致 | 5、8 |
| TodoUpdateDto 未包含 status | 完成状态可以单独修改，原标题保持不变 | 5、8 |
| 上传 DTO 用于文档声明，接口从 req.file() 读取文件 | 显式把实际文件交给运行时校验，文档与限制一致 | 14 |
| 密码处理使用加盐 MD5 | 注册、登录、改密及已有账号转换使用专用密码哈希方案 | 7 |
| 环境变量转换缺少完整启动校验 | 缺失和非法值在启动前终止，错误信息不泄露密钥 | 11 |
| 事务回调中的部分调用使用普通 Repository | 说明并保证每项事务内操作使用正确的 EntityManager | 10 |
| 幂等拦截器分开执行 Redis GET、SET，未见业务路由使用装饰器 | 绑定真实路由，验证原子占用、请求隔离和重复请求结果 | 10、12 |
| 队列消费者捕获失败后仅记录日志 | 失败能够被队列识别，重试、终态及业务记录一致 | 12 |
| LocalGuard.canActivate() 直接返回 true | 分别跟踪实际登录校验与 Passport 策略调用，明确有效入口 | 7 |
| 配置了测试工具，源码中未发现配套用例 | 学习 TestingModule、单元、集成及端到端验收方法 | 16 |

## 阶段 0：环境、练习工程和首次启动

源码入口：`README.md`、`package.json`、`pnpm-lock.yaml`、`.env`、`.env.development`、`src/config/`、`src/migrations/`、`deploy/sql/`。

知识点：Node 与包管理器版本、锁文件、环境变量优先级、MySQL 和 Redis 的职责、数据库初始化与迁移、本机端口及前后端分工。

实践：准备独立练习工程并记录依赖版本，基础 HTTP 练习使用本地 npm 命令；阅读参考项目和前端时分别核查 pnpm 要求。学习持久化前确定并配置本机 MySQL、Redis 的运行方式，创建独立学习数据库和 Redis 数据范围；检查上游命令在 Windows 中的兼容性。根据迁移内容选择明确的初始化流程，避免对同一数据库重复执行 SQL 初始化和初始迁移。Docker 相关内容安排在部署知识中，不作为当前环境准备的必选工具。

验收：MySQL、Redis 的真实连接通过；项目启动；Swagger 可以访问；使用初始化账号完成登录；明确每个依赖的地址、端口、数据用途和停止方式。原 `todo_api` PostgreSQL 数据库保持原状。

当前完成情况：已完成源码审阅、部分环境核查、配套前端克隆及独立练习工程准备。前端 origin 地址、提交版本、工作目录状态及 Git 连通性检查通过。`nest-admin-study/` 的本地依赖安装、`npm run typecheck`、`npm start`、`npm run dev` 通过；用户已实现并注册 TodoController，实际 `POST /api/todos` 能够返回请求体中的任务内容。尚未安装前端依赖或启动前端，尚未配置 MySQL、Redis，也未启动参考项目的完整后端。

独立练习工程的入口为 `nest-admin-study/src/main.ts`，根模块为 `nest-admin-study/src/app.module.ts`，任务说明见 `nest-admin-study/README.md`。`nest-admin-study/src/modules/todo/todo.controller.ts` 已实现请求体读取及返回，数据库保存等业务尚未实现。服务使用 `http://127.0.0.1:7001`，全局前缀为 `/api`。源码通过 ts-node 运行，以保留传统装饰器元数据；当前无需构建产物。

前端准备与联调待办：

- 前端声明 `pnpm@10.10.0`、Node.js `>=20.19.0`，后端声明 pnpm 9；安装前分别核查两个项目的包管理器要求。
- 阅读前端 `src/utils/request.ts`，以及 `src/api/backend/api/` 下的 `auth.ts`、`account.ts`、`systemMenu.ts`、`businessTodo.ts`、`toolsUpload.ts`，确认认证、响应结构、菜单、Todo 和上传接口契约。
- 当前前端开发端口配置为 `8088`，`/api` 代理目标为 `http://127.0.0.1:7001`，并去除 `/api` 前缀；启动前核对后端监听端口和路由前缀。
- 联调前审查并关闭 MSW mock，检查浏览器请求确实到达本机后端；检查开发 HTTPS 证书插件的行为后再启动。

## 阶段 1：TypeScript、装饰器、元数据与项目入口

源码入口：`tsconfig.json`、`nest-cli.json`、`src/main.ts`、`src/app.module.ts`、`src/modules/todo/todo.module.ts`。

知识点：运行时存在的 class 与编译后消失的 interface/type、装饰器及元数据、模块加载、异步启动、NestFactory、FastifyAdapter、全局路由前缀和应用实例。

实践：跟踪启动函数从配置到监听的过程，记录它调用的框架 API；编写并解释一个业务类及其装饰器；说明类型导入在依赖注入中的影响。

验收：能够从启动命令找到真正入口，说明 AppModule 与 HTTP adapter 的职责，解释一个 HTTP 路径由哪些前缀组成，并区分装饰器元数据与实际执行逻辑。

## 阶段 2：Module、Controller、Service 与依赖注入基础

源码入口：`src/modules/system/dict-type/`、`src/modules/todo/`。

知识点：`imports`、`controllers`、`providers`、`exports`，构造函数注入，模块可见性，Controller 与 Service 的职责，Repository 注入。

实践：选择字典类型列表的一次真实请求，跟踪 Controller、Service、Repository；给 Todo 增加一项明确的业务操作；通过模块注册验证一个 Provider 能否被其他模块使用。

验收：用户能独立写出一个模块的三件套，解释每一项注册，定位并解决一次真实的依赖解析错误；业务处理具备清晰边界。

## 阶段 3：Provider、动态模块、作用域和生命周期

源码入口：`src/shared/redis/redis.module.ts`、`src/modules/tasks/tasks.module.ts`、`src/shared/logger/logger.module.ts`、`src/common/pipes/creator.pipe.ts`。

知识点：自定义 token、`useClass`、`useValue`、`useFactory`、`useExisting`、异步 Provider、动态模块、全局模块、singleton/request/transient 作用域、ModuleRef、循环依赖。

实践：创建真正复用的配置或存储 Provider；通过真实请求观察不同作用域的实例生命周期；跟踪已有 `forwardRef` 关系并说明依赖方向；检查初始化和销毁钩子。

验收：解释默认实例共享、请求作用域传播及动态模块返回值；说明导出边界和循环依赖产生的原因；应用关闭后，自己创建的资源得到释放。

## 阶段 4：完整请求生命周期、Middleware 与 RxJS

源码入口：`src/main.ts`、`src/app.module.ts`、`src/common/adapters/fastify.adapter.ts`、`src/common/interceptors/`、`src/common/filters/`、`src/modules/auth/guards/`。

知识点：Fastify hook、Nest Middleware、Guard、Interceptor、Pipe、Controller、Service、Filter 的职责和顺序；全局、控制器和路由级注册；ExecutionContext、Reflector、Promise 与 Observable，RxJS 的 `map`、`tap`、`catchError`、`timeout`。

实践：使用一个真实请求记录各环节顺序；分别触发未登录、非法参数、业务异常及超时；实现一个有明确职责的 Nest Middleware，和已有 Fastify hook 分别观察。

验收：能够解释成功与异常两条路径，以及拦截器返回阶段的执行顺序；选定正确的扩展点，避免重复响应或内部吞掉错误。

## 阶段 5：DTO、参数转换、运行时校验与 Swagger

源码入口：`src/modules/todo/todo.dto.ts`、`src/common/dto/pager.dto.ts`、`src/common/decorators/field.decorator.ts`、`src/shared/database/constraints/`、`src/setup-swagger.ts`。

知识点：DTO class、class-validator、class-transformer、ValidationPipe、字段白名单、`PartialType`、`IntersectionType`、嵌套对象、数组、查询字符串和自定义校验器。

实践：完善 Todo 创建、修改、查询 DTO；查询字段按实际用途设置为可选；增加 status 校验及明确的查询转换；保证 Swagger 参数、实际请求和响应一致。

验收：缺失必填字段、空内容、错误类型、未知字段、非法页码和非法状态具有明确结果；仅提交 status 可以切换状态；必填查询错误得到修复并通过真实请求验证。并发唯一性最终由数据库约束保证。

## 阶段 6：TypeORM、MySQL、关联和迁移

源码入口：`src/shared/database/`、`src/config/database.config.ts`、`src/common/entity/common.entity.ts`、`src/modules/user/user.entity.ts`、`src/modules/todo/todo.entity.ts`、`src/helper/paginate/`、`src/migrations/`。

知识点：DataSource、Entity、Repository、EntityManager、QueryBuilder，Data Mapper 与 Active Record，关联与外键、唯一约束、索引、分页 SQL、查询数量和迁移历史。

实践：从一项实体变更生成并应用迁移；查看真实 SQL；验证用户与角色、用户与任务的关联；比较关联查询与逐条查询；检查分页查询和总数条件是否一致。

验收：独立数据库可按迁移建立结构；重启后数据保留；模型和数据库一致；能说明一次查询使用的条件、关联和索引。已有数据的迁移流程需要验证记录保留和恢复方式。

## 阶段 7：密码、认证、JWT 和会话生命周期

源码入口：`src/modules/auth/`、`src/modules/user/user.service.ts`、`src/utils/crypto.util.ts`、`src/config/security.config.ts`。

知识点：密码哈希、盐和计算成本，Passport Strategy 与 Guard 的实际调用关系，access token、refresh token、过期、撤销、黑名单、改密失效和多端登录策略。

实践：跟踪登录接口当前实际执行的密码校验；检查 LocalGuard 与 LocalStrategy 是否参与请求；将密码存储、验证和改密统一到专用密码哈希服务，定义并验证已有账号的转换流程；检查刷新和退出相关接口的实际行为。

验收：正确及错误密码、缺少/伪造/过期 token、退出后旧 token、改密后旧 token、刷新 token 复用均有真实验证结果；公开接口的边界明确；响应和日志不输出密码、密钥或完整 token。

## 阶段 8：Todo 完整业务与数据归属

源码入口：`src/modules/todo/`、`src/modules/auth/decorators/auth-user.decorator.ts`、`src/helper/paginate/`。

知识点：当前用户上下文、创建归属、列表范围、详情权限、字段更新语义、404 与权限响应策略、分页筛选排序及稳定排序。

实践：创建时关联当前用户；列表、详情、修改、删除均限制用户范围；补充 status 切换、value 筛选及排序白名单；对相同排序值设置稳定的次级排序；明确管理员范围。

验收：使用两个普通账号交叉验证全部操作，另验证管理员范围；筛选后的列表和总数一致；分页无重复和遗漏；空列表、末页、超过末页、仅改状态和未知记录具有正确结果。

## 阶段 9：RBAC、资源权限与接口访问边界

源码入口：`src/modules/auth/guards/rbac.guard.ts`、`src/modules/auth/guards/resource.guard.ts`、`src/modules/auth/decorators/`、`src/modules/system/role/`、`src/modules/system/menu/`。

知识点：登录身份、角色、权限字符串、资源归属，Public、AllowAnon、权限装饰器及元数据继承，管理员策略、批量操作校验和权限缓存失效。

实践：为 Todo 配置完整权限；验证未赋权用户；批量操作需要验证每条记录；修改角色后检查旧会话的权限行为；分别审查列表、详情和写入入口。

验收：未登录、无权限、越权和合法访问都符合约定；批量请求夹带一条他人记录也无法改变该记录；新增接口具备明确访问策略。

## 阶段 10：事务、并发更新和重复请求

源码入口：`src/modules/user/user.service.ts`、`src/modules/system/role/role.service.ts`、`src/modules/system/dept/dept.service.ts`、`src/common/interceptors/idempotence.interceptor.ts`。

知识点：事务边界、事务专属 EntityManager、隔离级别、唯一约束、乐观锁与悲观锁、并发冲突、幂等键、原子操作，数据库与 Redis 的一致性边界。

实践：审查事务回调中的每次数据访问；构造真实的中途失败，检查所有相关写入是否被撤销；为一个明确的并发更新场景选择并实现控制策略；把幂等能力绑定到真实业务入口。

验收：失败后没有部分写入；并发请求不会重复创建或丢失更新；相同幂等键的参数冲突、处理中请求、完成后重放、不同用户隔离和过期行为都有真实记录。

## 阶段 11：配置校验、Redis 缓存与一致性

源码入口：`src/config/`、`src/global/env.ts`、`src/shared/redis/`、`src/helper/genRedisKey.ts`。

知识点：ConfigModule、registerAs、配置优先级、启动校验、类型转换与密钥管理；缓存命中、TTL、失效、业务数据一致性，Redis Pub/Sub 的交付边界。

实践：补充环境变量必填、格式、协议和范围校验；使用明确的 Redis key 命名及用户隔离；为角色权限缓存定义更新与失效策略；通过实际 Redis 请求观察 TTL 和失效。

验收：非法数字及布尔值不会悄悄进入业务；缺少配置时启动直接失败，错误不包含秘密值；权限修改后缓存按约定生效；Redis 不可用时错误明确暴露，恢复后状态符合既定契约。

## 阶段 12：Bull 队列、失败重试与消费幂等

源码入口：`src/modules/system/task/task.module.ts`、`task.service.ts`、`task.processor.ts`、`src/modules/tasks/jobs/`。

知识点：生产者与消费者、任务状态、attempts、backoff、超时、失败终态、重复消费、业务幂等及补偿，任务结果与数据库记录一致性。

实践：让真实失败进入队列失败状态；配置有限重试和明确的等待规则；观察消费者停止后恢复、任务重复执行及最终失败；将一项 Todo 后台操作接入队列。

验收：业务失败不能被标记为成功；重试次数与间隔正确；重复任务不产生重复业务结果；成功、最终失败和补偿均可追踪；进程重启后任务状态可解释。

## 阶段 13：定时任务、应用事件和终止清理

源码入口：`src/modules/tasks/`、`src/shared/helper/cron.service.ts`、`src/common/decorators/cron-once.decorator.ts`、`src/shared/shared.module.ts`、`src/modules/sse/sse.controller.ts`。

知识点：Cron、时区、一次性与周期任务、应用内部事件、事件监听，onModuleInit 和应用终止钩子，多进程重复执行及资源清理。

实践：用应用事件完成一项有明确边界的业务通知；检查定时任务在多实例中的执行规则；为长连接和自己创建的后台资源实现关闭行为。

验收：定时规则与时区一致；重复触发按约定处理；监听器及连接正确释放；能说明应用事件、Redis Pub/Sub 和持久化队列各自的适用边界。

## 阶段 14：文件上传、文件校验与存储一致性

源码入口：`src/common/adapters/fastify.adapter.ts`、`src/modules/tools/upload/`、`src/modules/tools/storage/`、`src/utils/file.util.ts`。

知识点：multipart、Fastify 文件对象、缓冲与流、大小和数量限制、MIME 声明与实际内容、文件命名、路径处理、记录归属和文件与数据库一致性。

实践：将实际读取的文件交给运行时校验，统一 adapter、DTO、Swagger 和业务规则；限制允许类型并检查内容；为保存文件或记录失败定义清理逻辑；验证文件访问范围和持久化目录。

验收：真实允许类型上传和下载内容一致；未提交文件、错误字段、超过大小、类型不符、多文件及无权限请求按契约拒绝；失败无残留；同名文件不覆盖；更新和重启不丢失文件。

## 阶段 15：WebSocket、SSE 与连接生命周期

源码入口：`src/socket/`、`src/common/adapters/socket.adapter.ts`、`src/modules/sse/`、`src/modules/system/online/`。

知识点：Gateway、事件、握手认证、连接与断开钩子、命名空间、用户消息范围、心跳、重连、Redis adapter 及应用终止清理。

实践：让 Todo 的一项状态变更通知当前用户；验证普通请求与长连接的认证区别；分别检查断线、重新连接及多实例转发。

验收：消息按用户隔离；无效身份无法接收敏感事件；断线后没有残留连接记录或持续计时器；终止应用能够清理连接；明确断线期间消息的保留与补发策略。

## 阶段 16：测试方法、接口契约和真实回归验收

源码入口：`package.json` 中的测试配置、各业务模块，以及官方 Nest Testing 文档。当前仓库未提供配套测试用例。

知识点：Test.createTestingModule、依赖解析、单元测试边界、真实数据库集成测试、HTTP 端到端测试、回归矩阵和测试数据隔离。

实践：纯业务逻辑直接执行单元验证；创建真实 Nest 测试应用并连接独立 MySQL、Redis；通过真实 HTTP 请求检查 Guard、Pipe、Filter 和业务组合；重现问题后再修改实现。

验收：覆盖两个用户及管理员、DTO 边界、事务失败、队列重试、重复请求、文件限制和实时消息隔离；记录状态码、响应、数据库状态和资源清理结果。测试环境及账号与原有业务数据隔离，临时验收脚本完成后清理。

## 阶段 17：日志、健康检查、可靠性与本机部署

源码入口：`src/shared/logger/`、`src/modules/health/`、`src/config/`、`src/main.ts`、`Dockerfile`、`docker-compose*.yml`、`ecosystem.config.js`、`.github/workflows/`。

知识点：结构化日志、请求编号、日志脱敏、健康与就绪状态、依赖故障、进程终止、构建产物、迁移、环境配置、上传持久化及 CI/CD。

实践：补充请求追踪标识；定义真正反映依赖状态的健康检查；验证 MySQL、Redis 故障和重新连接；检查未处理异常与进程退出策略；在当前电脑运行生产构建。记录 Windows 命令适配，学习 Docker 和服务器配置的职责及部署过程。

验收：一次请求或任务可根据日志追踪；秘密值不会输出；启动配置错误与依赖不可用具有明确表现；终止时连接释放；迁移及重启保留数据；本机生产接口可用。当前没有外部服务器，公网证书和远程部署保持待实践状态。

## 阶段 18：独立完成功能模块与最终验收

实践：为 Todo 增加“任务标签管理”模块，独立完成模块组织、关联模型与迁移、DTO、接口契约、权限、用户归属、查询及错误处理。标签与任务关联需要同时校验两侧记录的用户范围。

验收：用户可以根据需求独立实现，不依赖现有 CRUD 工厂自动生成全部行为；能解释请求完整路径和依赖关系；能根据错误定位问题；真实验证两个用户的数据隔离、关联变更的一致性及迁移后的数据保留。

完成判据：阶段 0 至 18 的实际验收记录齐全；能说明关键业务与基础设施边界；能够在项目中独立新增并维护一个后端模块。源码阅读和功能存在不直接记为用户已掌握。

## 独立拓展练习

| 主题 | 学习目标 |
|---|---|
| NestJS + Prisma + PostgreSQL | 将一个独立模块接入已有 ORM 经验，比较 Provider、事务及迁移的实现；先定义清晰的数据访问边界 |
| NestJS + Express 文件上传 | 在独立练习中学习 FileInterceptor 和 UploadedFile，明确与 Fastify multipart 插件的边界 |
| GraphQL | 学习 Schema、Resolver、授权和查询成本 |
| gRPC 或消息型微服务 | 学习独立服务之间的契约、超时、消息交付和故障处理 |
| 多租户 | 学习租户上下文、查询隔离、唯一约束和跨租户防护 |
| 分布式追踪与性能 | 学习 OpenTelemetry、指标、链路关联和真实负载下的瓶颈分析 |

主线完成状态与拓展练习分别记录。

## 验收记录规则

每次实际完成一项任务，立即填写以下内容，并更新阶段表：

- 阶段及主题。
- 本次阅读和修改的实际文件。
- 用户能够解释的关键概念。
- 本次运行的真实请求或操作。
- 预期结果、实际结果及观察到的数据状态。
- 尚未理解或未验证的内容。
- 下一次唯一的具体任务。

首次记录：2026-10-21，仅完成公开源码审阅、学习路线制定及部分本机工具核查。NestJS 环境和业务实践均未标记完成。

2026-10-21，阶段 0：完成配套前端源码克隆，提交为 `64c03db76710e70b85aedf40a9ca87101946d70d`。`git status --short` 无输出，`git fsck --connectivity-only` 通过，origin 指向配套前端仓库。此次仅验收源码下载，依赖安装及运行状态待验证。下一项任务：阅读前端登录请求及请求封装，记录需要自行编写的首组后端接口。

2026-10-22，阶段 0，开始登录接口契约学习：已核查前端 `src/views/login/index.vue`、`src/store/modules/user.ts`、`src/api/backend/api/auth.ts`、`account.ts`、`typings.d.ts`、`src/utils/request.ts` 和开发代理配置。当前讲解登录请求的方法、路径、请求体和响应结构；用户理解程度待练习确认，尚未执行真实登录验收。

- 登录请求函数声明 `POST /api/auth/login`，请求体包含 `username`、`password`、`captchaId`、`verifyCode`。
- 请求封装要求响应体的 `code` 为 `200`，默认提取响应体的 `data`；登录调用方读取其中的 `token`。
- 登录相关接口函数还声明 `GET /api/auth/captcha/img`、`GET /api/account/profile`、`GET /api/account/menus`、`GET /api/account/permissions`；登录后还会初始化 SSE，相关连接在后续学习中单独核查。
- 开发配置的 `baseURL` 与接口函数路径均包含 `/api`，代理去除最前面的 `/api`；浏览器最终地址与后端接收路径需要在联调中验证。
- 下一项练习：根据 `authLogin` 源码说明请求方法、路径以及 `data: body` 的作用。完成理解确认后继续环境准备及 NestJS 基础学习。

2026-10-22，教学方式调整：已完整阅读用户粘贴的文章，按“核心思考框架 → 设计取舍 → 诊断练习及反馈”更新教学安排，并核对 NestJS 官方 Controller、Provider、Module、Validation、请求生命周期及 Fastify 文档。已讲解前端字段类型来源、后端 Controller 和 LoginDto；尚未通过独立练习确认掌握，也未执行 NestJS 登录请求。根据用户的前端背景，后续按照“实际需求 → 具体问题 → 对应代码 → 真实运行结果 → 设计理由”讲解，每次引入一个主题，环境和功能阶段保持待验收状态。

2026-10-22，Todo 创建需求阅读：已核查前端 `src/api/backend/api/businessTodo.ts` 的 `todoCreate`，以及后端 `src/modules/todo/todo.controller.ts`、`todo.dto.ts`。创建接口接收字段 `value`，Controller 使用 `@Body() dto: TodoDto` 读取请求体，再将 `dto` 传给 `TodoService.create`。当前仅进行源码阅读及请求体练习，尚未运行创建请求，未标记功能或用户掌握完成。下一项练习：根据传入的任务内容说明 `dto.value` 的结果。

2026-10-22，独立编写练习准备：用户选择亲自实现业务模块，已创建 `nest-admin-study/` 基础工程及仅含提示的 TodoController 文件。NestJS `11.2.7`、TypeScript `5.9.3`、ts-node `10.9.2`，使用独立 npm 锁文件。类型检查通过，普通启动和开发监听启动成功；真实 POST、GET 请求返回 404，验证空白业务状态，验证后已停止服务并确认释放 7001 端口。练习不依赖数据库，未执行数据库操作，未实现或验证 Todo 创建成功。下一项任务：用户编写 TodoController 接收并返回请求体中的 `value`，在 AppModule 注册后，由 AI 验证两组不同内容的真实请求。

2026-10-22，阶段 2，Controller 请求体读取验收：重新读取用户编写的 `todo.controller.ts` 和 `app.module.ts`，确认 POST 方法及根模块注册。`npm run typecheck` 通过，启动日志确认映射 `POST /api/todos`；两次真实 JSON 请求分别发送“学习 NestJS”和“完成今天的练习”，均返回 HTTP 201 及各自的 `value`，断言状态码和内容一致通过。验证后停止本次服务并确认释放 7001 端口。当前只验收数据接收，尚未保存任务、添加运行时校验或认证；概念迁移能力仍需后续练习确认。下一项任务：用户创建 TodoModule 并调整 AppModule 的注册方式。

2026-10-22，阶段 2，TodoModule 注册验收：用户创建 TodoModule 并在 AppModule 的 imports 中引入，TodoController 在业务模块中注册。清理根模块未使用的 Controller 导入及 Controller 文件中过时的练习注释。类型检查通过，启动日志确认加载 AppModule、TodoModule 并注册 POST 路由；两次真实请求分别发送“学习 NestJS”和“通过 TodoModule 接收任务”，均返回 HTTP 201 及各自输入内容。验证后停止本次服务并确认释放 7001 端口。下一项任务：用户创建 TodoService 的类声明，继续学习 Provider 注册和构造函数注入。

## 阅读资料

- [项目 README](https://github.com/buqiyuan/nest-admin/blob/main/README.md)
- [项目依赖与命令](https://github.com/buqiyuan/nest-admin/blob/main/package.json)
- [项目 AppModule](https://github.com/buqiyuan/nest-admin/blob/main/src/app.module.ts)
- [Todo 模块](https://github.com/buqiyuan/nest-admin/tree/main/src/modules/todo)
- [Controller 与路由](https://docs.nestjs.com/controllers)
- [Provider 与依赖注入](https://docs.nestjs.com/providers)
- [Module 与公开边界](https://docs.nestjs.com/modules)
- [DTO 与运行时校验](https://docs.nestjs.com/techniques/validation)
- [NestJS 11 HTTP adapter](https://docs.nestjs.com/v11/techniques/performance)
- [请求生命周期](https://docs.nestjs.com/faq/request-lifecycle)
- [NestJS 11 测试设施](https://docs.nestjs.com/v11/fundamentals/testing)

阅读官方资料时核对 NestJS 11 和 TypeORM 0.3 的适用范围；主线学习副本的实际版本以阶段 0 的记录为准。
