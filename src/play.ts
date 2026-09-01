// 草稿文件:亲眼观察 zod 的行为,玩完就删,不参与正式项目
// 运行:npx tsx src/play.ts
import { z } from 'zod'

// schema 声明式读法:"对象里有个 title,它是字符串,至少 1 个字符"
const todoSchema = z.object({
  title: z.string().min(1),
})

// --- ② 合法数据 ---
console.log('=== ② 合法数据 ===')
const ok = todoSchema.parse({ title: '合法标题' })
console.log('parse 返回了:', ok)

// --- ③ 非法数据(故意不接住) ---
// 第一遍运行保持下面不解开,体验"parse 会抛异常";
// 看到崩溃后,把 START 到 END 之间两行注释掉,再跑第二遍
console.log('=== ③ 非法数据(没接住) ===')
// ---- START ----
// console.log(todoSchema.parse({}))
// ---- END ----

// --- ④ 抓住它,看 issues 长相 ---
console.log('=== ④ 接住异常 ===')
try {
  todoSchema.parse({})
} catch (err) {
  console.log('错误的类名:', (err as Error).constructor.name)
  console.log('完整错误:', err)
  console.log('issues 数组:', JSON.stringify((err as any).issues, null, 2))
}

// --- ⑤ 加餐:schema 没定义的字段,下场如何 ---
console.log('=== ⑤ 多余字段 ===')
const cleaned = todoSchema.parse({ title: 'hi', hacker: '我想混进去' })
console.log('parse 后的数据:', cleaned)
console.log('hacker 还在吗?', 'hacker' in cleaned)
