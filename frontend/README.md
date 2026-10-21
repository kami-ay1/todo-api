# 拾序 Todo 前端

Vue 3 + TypeScript + Vite，连接本仓库的 Express API。页面包含注册登录、任务新增与编辑、完成状态切换、删除确认、分页筛选排序和图片上传。

## 启动

在仓库根目录启动后端：

```powershell
npm run dev
```

在另一个终端进入前端目录并启动：

```powershell
cd frontend
npm install
npm run dev
```

打开 `http://localhost:5173`。端口被占用时 Vite 直接终止，避免实际地址与后端跨域配置不一致。

后端地址默认为 `http://localhost:3000`。需要修改时，在 `frontend/.env.local` 配置 `VITE_API_URL`，同时根据实际前端来源修改后端 CORS 配置。

## 实现说明

- `src/api.ts`：请求封装和 Zod 响应校验，自动携带 token；收到已登录请求的 `401` 时清除登录信息并返回登录页面。
- `src/components/AuthPanel.vue`：注册和登录。token 保存在当前标签页的 `sessionStorage`，刷新后继续使用，退出时清除。
- `src/components/TaskBoard.vue`：读取服务器分页数据，支持筛选、排序、任务操作和删除确认。
- `src/components/UploadPanel.vue`：使用 `FormData` 上传图片，读取返回地址的真实内容并预览。图片独立存储，后端尚未提供任务附件关联。
- `src/App.vue`：账号状态和页面布局。
- `src/style.css`：响应式样式。

所有任务数据来自真实 API。HTTP 业务错误直接显示服务器文案；响应格式错误及网络异常会直接暴露。文件静态地址目前公开访问。

## 类型检查

```powershell
npm run typecheck
```

## 登录状态组件测试

```powershell
npm test
```

`tests/src/App.test.ts` 使用 Vitest、Vue Test Utils 和 jsdom 加载完整 App 组件，通过真实 Express 服务及 PostgreSQL 验证有效 token、无效 token、过期 token、退出登录和重新登录。

测试需要根目录后端依赖、有效的 `.env` 及运行中的 PostgreSQL，会自行启动并终止使用 3000 端口的后端进程。运行前该端口需要空闲。每次运行会创建并保留一个专用测试账号。

此项测试覆盖 DOM 测试环境中的组件交互；真实浏览器的布局、刷新及导航行为仍需单独验证。
