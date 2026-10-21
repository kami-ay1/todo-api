# 当前主机部署

使用当前电脑的 Node.js 和 PostgreSQL 运行生产构建后的应用，前端页面、API 和上传文件通过同一个地址访问。

## 准备

安装根目录与前端依赖，按根目录 `.env.example` 配置本地 `.env`。PostgreSQL 需要运行，数据库已有与项目模型一致的表结构。

```powershell
npm ci
npm --prefix frontend ci
```

当前学习数据库已经存在表结构。新建空数据库可以执行 `npm run db:migrate`；已有数据库需要首次登记迁移时，按根目录 README 操作。

## 构建并启动

在项目根目录执行：

```powershell
npm run local
```

命令依次执行后端构建、前端生产构建，并使用 Node 运行 `dist/app.js`。任一步骤失败会立即终止。

访问地址由 `.env` 中的 `PORT` 决定，例如 `PORT=3000` 时打开 `http://localhost:3000`。无需单独启动 Vite。

启动命令会为当前进程设置 `NODE_ENV=production`，并将前端 `VITE_API_URL` 和后端 `CORS_ORIGIN` 设置为同一个本机地址。数据库连接及 JWT 密钥继续使用本地 `.env`，配置文件内容不会被改写。

该过程会覆盖 `frontend/dist/` 中的前端构建产物，使其指向本机地址。后续发布到其他地址时需要按对应环境重新构建。

## 文件与进程

- 上传文件继续保存在项目根目录的 `uploads/` 中，重新启动及重新构建不会清除该目录。
- 终端需要保持运行，按 `Ctrl+C` 终止服务；当前配置没有安装开机启动或后台系统服务。
- `localhost` 地址仅供本机浏览器使用。外部设备访问需要另外配置实际主机地址、网络及访问来源。
- 此命令不修改数据库结构，也不自动登记迁移历史。

## 检查

打开页面后，可以使用现有账号登录，检查任务列表及文件上传。后端接口仍为 `/auth/`、`/todos` 和 `/uploads`，文件地址为 `/uploads/文件名称`。

根目录 README 记录独立构建、启动及数据库迁移命令，学习记录见 `EXPRESS_LEARNING_PLAN.md`。
