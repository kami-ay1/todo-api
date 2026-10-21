# Todo API

Express + Prisma + PostgreSQL 后端，前端位于 `frontend/`。

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

数据库需要已有与 `prisma/schema.prisma` 一致的表结构。启动服务：

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

前端缺少 `VITE_API_URL` 或填写无效地址时，会在请求模块加载时明确报错。

## 检查

```powershell
npm exec prisma -- validate
npm --prefix frontend run typecheck
npm audit
npm --prefix frontend audit
```

学习记录见 `EXPRESS_LEARNING_PLAN.md`。部署启动命令及生产数据库表结构管理尚未配置。
