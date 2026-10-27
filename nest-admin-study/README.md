# NestJS 后端编写练习

本目录根据 nest-admin 的实际需求逐步实现后端，业务代码由学习者编写。原项目源码参考位于 `../.verification/research/nest-admin-main/`，配套前端位于 `../../vue3-antdv-admin/`。

## 运行环境

- Node.js 24，NestJS 11.2.7，Fastify；依赖版本记录在 `package-lock.json`。
- 本目录独立使用 npm 管理依赖。前端和上游后端各自的 pnpm 配置分别维护。
- TypeScript 使用 CommonJS、传统装饰器和元数据配置；本目录的 `package.json`、`tsconfig.json` 独立于外层 Express 项目。
- 本机地址为 `http://127.0.0.1:7001`，全局接口前缀为 `/api`。

在本目录执行：

```powershell
npm ci
npm run dev
```

执行 `npm run typecheck` 检查类型，使用 `Ctrl+C` 停止服务。

## 基础工程中的文件

- `src/main.ts`：创建 Nest 应用、选择 Fastify、设置接口前缀并监听端口。
- `src/app.module.ts`：通过 imports 引入业务模块。
- `src/modules/todo/todo.module.ts`：组织 Todo 功能，目前注册 TodoController。
- `src/modules/todo/todo.controller.ts`：用户编写的 TodoController，接收 POST 请求并返回任务内容。

## 练习 1：接收任务内容

需求背景：用户输入任务内容后，前端需要通过接口把内容交给后端。

本次练习范围为路由声明和读取请求体。数据库保存、业务规则、校验和认证分别在相应练习中实现；返回请求内容仅表示接收结果。

1. 在 `src/modules/todo/todo.controller.ts` 编写并导出 `TodoController`。
2. 使用 `@Controller('todos')`、`@Post()` 声明接口，使用 `@Body()` 读取请求体；需要的装饰器从 `@nestjs/common` 导入。
3. 在方法中返回接收到的 `value`，响应体为 `{ "value": "学习 NestJS" }`。使用 TypeScript 类型说明请求体字段，运行时校验属于后续练习。
4. 在 `src/app.module.ts` 导入该 Controller，并加入 `controllers` 数组。

请求格式：

```http
POST http://127.0.0.1:7001/api/todos
Content-Type: application/json

{
  "value": "学习 NestJS"
}
```

验收内容：启动成功、类型检查通过、上述请求返回实际输入的内容；改变任务内容后响应随之改变。

2026-10-22 验收通过：类型检查及启动成功，真实请求分别提交“学习 NestJS”和“完成今天的练习”，均返回 HTTP 201 及各自的 `value`，状态码与内容断言通过。当前只读取和返回请求内容。

## 练习 2：使用业务模块组织 Controller

1. 创建 `src/modules/todo/todo.module.ts`，导出带有 `@Module()` 的 `TodoModule`，在 `controllers` 中注册 `TodoController`。
2. 在 `AppModule` 的 `imports` 中引入 `TodoModule`，将原先的 TodoController 注册转移到业务模块。
3. AI 检查类型并发送真实 POST 请求，确认模块调整后接口行为保持一致。

2026-10-22 验收通过：TodoModule 已加载，类型检查通过，两次真实 POST 请求均返回 HTTP 201 及各自的任务内容。

## 练习 3：创建 Service 并学习依赖注入

当前任务：用户创建 `src/modules/todo/todo.service.ts`，导出带有 `@Injectable()` 的 TodoService 类。之后在 TodoModule 的 providers 中注册，并通过 TodoController 的构造函数注入，结合实际处理逻辑验证调用过程。
