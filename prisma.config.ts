// Prisma 7 配置文件(放在项目根目录,和 package.json 同级)
// 作用:告诉 Prisma CLI —— schema 在哪、数据库连接串是什么
// 注意:Prisma 7 不再自动读 .env,所以要手动 import 'dotenv/config'

import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  // schema 文件位置
  schema: 'prisma/schema.prisma',

  // 数据库连接串(db push / migrate 时用)
  // Prisma 7:连接串从 schema.prisma 移到了这里
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
