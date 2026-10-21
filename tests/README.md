# 后端真实接口测试

在项目根目录执行：

```powershell
npm test
npm run test:typecheck
```

需要已安装根目录依赖、本地 PostgreSQL 正常运行，以及 `.env` 中有效的 `DATABASE_URL` 和 `JWT_SECRET`。

测试会先检查 3000 端口是否空闲，然后启动当前 `src/app.ts`，发送真实 HTTP 请求，并在结束后终止自行启动的服务。端口占用、服务启动失败、网络异常和数据库错误会直接导致测试失败。

`tests/src/app.test.ts` 对应 `src/app.ts`，覆盖注册成功、重复注册、正确登录、错误密码、不存在账号，以及有效、缺失、无效、过期 token 的任务接口访问。登录成功时还会验证 JWT 签名、账号编号和七天有效期，注册响应会检查密码字段没有泄露。

测试使用 Node 自带运行器和项目现有的 tsx、jsonwebtoken、Zod，通过真实 Express 服务和 PostgreSQL 执行。每次运行会新增并保留两个用户名分别以 `api_auth_`、`api_register_` 开头的专用账号。

测试代码使用独立 TypeScript 配置进行类型检查。前端测试在 `frontend/` 中单独运行，避免两个测试运行器同时占用 3000 端口。
