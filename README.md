# Todo API

Express + Prisma + PostgreSQL 后端，前端位于 `frontend/`。

## 当前电脑部署

配置根目录 `.env`，确认本地 PostgreSQL 正常运行且数据库表结构已准备好，然后在项目根目录执行：

```powershell
npm ci
npm --prefix frontend ci
npm run local
```

`local` 命令依次构建后端与前端，使用 Node 运行生产编译产物。前端页面、API 和上传文件使用同一个本机地址，例如 `PORT=3000` 时访问 `http://localhost:3000`。

此命令为当前进程配置生产模式及对应的前端地址和跨域来源，原 `.env` 内容保持不变。终端需要持续运行，按 `Ctrl+C` 终止服务。具体操作见 `deploy/README.md`。

## 后端配置与启动

首次配置时，将根目录 `.env.example` 复制为 `.env`，填写真实的数据库连接和 JWT 密钥。已有 `.env` 时直接补充所需字段。

| 环境变量 | 用途 | 配置要求 |
|---|---|---|
| `PORT` | 后端监听端口 | 必填，1 至 65535 的整数 |
| `CORS_ORIGIN` | 允许访问后端的前端来源 | 必填，HTTP 或 HTTPS 地址，不包含路径、查询参数、片段或账号信息 |
| `DATABASE_URL` | PostgreSQL 连接地址 | 必填，使用 `postgresql://` 或 `postgres://` |
| `JWT_SECRET` | JWT 签名密钥 | 必填，使用自行生成的随机密钥 |

生成随机密钥后填入本地 `.env`：

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

安装依赖并生成客户端：

```powershell
npm install
npm exec prisma -- generate
```

数据库表结构准备方式见下方迁移说明。开发环境启动服务：

```powershell
npm run dev
```

`src/config.ts` 在启动时校验全部后端环境变量，配置缺失或无效时直接终止。配置错误消息只包含字段名称和校验规则。启动后会显示实际监听地址。系统注入的同名环境变量优先于 `.env`。

配置校验不代表数据库已经能够连接；数据库连通性需要通过实际接口请求验证。

## 前端配置与启动

开发环境读取 `frontend/.env.development`，后端地址为 `http://localhost:3000`。需要本地覆盖时，参考 `frontend/.env.example` 创建 `frontend/.env.local`。

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

打开 `http://localhost:5173`。后端 `CORS_ORIGIN` 必须与浏览器中的前端来源一致。

部署时在前端环境中配置实际的 `VITE_API_URL`，例如通过部署平台环境变量或 `frontend/.env.production.local`。该地址在 Vite 处理前端代码时写入页面资源，修改后需要重新生成前端资源。`VITE_` 变量可被浏览器读取，不应包含密码或 JWT 签名密钥。

前端构建与请求模块共用 `frontend/src/utils/env.ts` 的校验规则。缺少 `VITE_API_URL` 或填写无效地址时，生产构建立即失败。

## 数据库迁移

迁移文件位于 `prisma/migrations/`。执行前确认 `DATABASE_URL` 指向目标数据库。

新建的空数据库直接执行：

```powershell
npm run db:migrate
npm run db:status
```

已有通过 `db push` 创建的数据库，首次使用迁移前执行：

```powershell
npm run db:baseline
npm run db:migrate
npm run db:status
```

`db:baseline` 会先只读比对数据库和 `prisma/schema.prisma`，仅在结构一致时，将 `0_init` 登记为已应用；结构不一致时直接终止。登记操作写入 Prisma 的迁移记录表，既有业务记录保持不变。此命令只适用于尚未登记初始迁移的已有数据库。

后续模型变更需要在开发环境生成并提交新的迁移文件，再通过 `db:migrate` 应用到部署数据库。

## 部署构建与启动

后端在具备完整依赖的部署准备环境执行：

```powershell
npm ci
npm run build
npm run db:migrate
npm run db:status
npm start
```

`build` 先生成 Prisma Client，再通过 `tsconfig.build.json` 将后端源码编译至 `dist/`。`start` 使用 Node 运行 `dist/app.js`。运行环境设置 `NODE_ENV=production`，并注入上方四项必填配置。

首次接入已有数据库时，先按前述步骤完成 `db:baseline`。`db:migrate` 需要 Prisma CLI，因此应在包含开发依赖的迁移阶段执行。

前端配置实际 `VITE_API_URL` 后执行：

```powershell
npm --prefix frontend ci
npm --prefix frontend run build
```

将 `frontend/dist/` 发布到静态文件服务，后端 `CORS_ORIGIN` 配置为实际前端来源。本地查看构建产物：

```powershell
npm --prefix frontend run preview
```

预览地址为 `http://localhost:4173`，该命令用于本地检查。部署时为 `uploads/` 配置持久化目录，确保服务更新后仍能读取上传文件。

## 检查

```powershell
npm exec prisma -- validate
npm exec tsc -- --project tsconfig.build.json --noEmit
npm --prefix frontend run typecheck
npm audit
npm --prefix frontend audit
```

学习记录见 `EXPRESS_LEARNING_PLAN.md`。当前使用本机部署，生产构建、页面与 API 共用地址、上传文件访问及数据库迁移流程已经验证；公网访问和开机启动尚未配置。
