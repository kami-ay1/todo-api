# 拾序 Todo 前端

Vue 3 + TypeScript + Vite，连接本仓库的 Express API。页面包含注册登录、任务新增与编辑、完成状态切换、删除确认、分页筛选排序和图片上传。

## 本机部署

在仓库根目录运行 `npm run local`，即可构建前后端并从后端地址提供页面，例如 `http://localhost:3000`。此方式不需要单独启动 Vite，具体说明见 `deploy/README.md`。

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

开发环境通过 `.env.development` 设置 `VITE_API_URL=http://localhost:3000`。需要修改时，参考 `.env.example` 在 `frontend/.env.local` 配置 `VITE_API_URL`，同时将后端 `CORS_ORIGIN` 设置为实际前端来源。

部署时通过部署环境变量或 `frontend/.env.production.local` 设置实际的 `VITE_API_URL`。该配置会写入前端资源，修改后需要重新生成资源。配置缺失或无效时，生产构建会直接失败。

## 生产构建

```powershell
npm run build
```

构建前执行类型检查和环境变量校验，成功后将静态文件写入 `frontend/dist/`。将该目录发布到静态文件服务，后端 `CORS_ORIGIN` 配置为实际前端来源。

本地检查构建结果：

```powershell
npm run preview
```

预览地址为 `http://localhost:4173`。需要在预览页面调用后端时，后端 `CORS_ORIGIN` 应配置为该来源。

## 实现说明

- `src/api.ts`：请求封装和 Zod 响应校验，自动携带 token；收到已登录请求的 `401` 时清除登录信息并返回登录页面。
- `src/components/AuthPanel.vue`：注册和登录。token 保存在当前标签页的 `sessionStorage`，刷新后继续使用，退出时清除。
- `src/components/TaskBoard.vue`：读取服务器分页数据，支持筛选、排序、任务操作和删除确认。
- `src/components/UploadPanel.vue`：使用 `FormData` 上传图片，读取返回地址的真实内容并预览。图片独立存储，后端尚未提供任务附件关联。
- `src/App.vue`：账号状态和页面布局。
- `src/style.css`：响应式样式。
- `src/utils/env.ts`：构建配置和请求模块共用的公开环境变量校验规则。

所有任务数据来自真实 API。HTTP 业务错误直接显示服务器文案；响应格式错误及网络异常会直接暴露。文件静态地址目前公开访问。

## 类型检查

```powershell
npm run typecheck
```
