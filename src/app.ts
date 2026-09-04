import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"
import { z,ZodError } from 'zod'

// schema 声明式读法:"对象里有个 title,它是字符串,至少 1 个字符"
const todoSchema = z.object({
  title: z.string().min(1),
})

const todoPatchSchema = z.object({
  title: z.string().min(1).optional(),
  done: z.boolean().optional(),
})

// query 参数的 schema:全部字符串,所以用 coerce 先转型
const todoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  done: z.stringbool().optional(),   // 【修复版】stringbool 专治 "true"/"false" 字符串
})

declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const app = express()

app.use(express.json())

interface Todo {
  id: number
  title: string
  done: boolean
}

// 鉴权中间件:验证 token
const auth = (req: Request, res: Response, next: NextFunction) => {
  // ① 从 header 拿 token
  const token = req.headers.authorization?.split(' ')[1]
  // req.headers.authorization 的值长这样:"Bearer eyJhbGciOi..."
  // 思考:token 是空格后面那一段,用哪个字符串方法取出来?

  // ② 如果没带 token(header 不存在或格式不对)→ 返回 401,别调 next
  if(!token){
    res.status(401).json({message:"未提供token"})
    return 
  }
  try{
    const payload = jwt.verify(token,process.env.JWT_SECRET!)
    req.userId=(payload as any).userId
    next()
  }catch{
    res.status(401).json({message:'token无效或已过期'})
  }
  // ④ 验证通过:把 payload 里的 userId 挂到 req 上,调 next()
}
// 校验中间件工厂:接收 schema,返回一个标准三参数中间件
const validate = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 填空①:用 schema.parse 处理 req.body,把返回值【写回 req.body】
    req.body = schema.parse(req.body)
    // 填空②:调 next() 放行
    next()
    // 思考:parse 抛异常的话,②还会执行到吗?错误会流去哪?
  }
}


app.get('/todos',auth, async (req, res) => {
    const query = todoQuerySchema.parse(req.query)   // ← 新增这行
    const skip = (query.page - 1) * query.pageSize
    const todos = await prisma.todo.findMany({
      where: { userId: req.userId!, done: query.done },
      skip: skip,
      take: query.pageSize,
    })
    res.json(todos)
})


app.get('/todos/:id',auth,async (req, res) => {
    const id = Number(req.params.id)
    const todo = await prisma.todo.findFirst({
      where:{
        id:id,
        userId:req.userId!
      } 
    })
    if (!todo){
      res.status(404).json({ message: 'Todo 不存在' })
      return
    }
    res.json(todo)
})

app.post('/todos', auth,validate(todoSchema),async(req, res) => {
    const todo = await prisma.todo.create({
      data:{
        title:req.body.title,
        userId:req.userId!
      }
    })
    res.status(201).json(todo)
})

app.patch('/todos/:id', auth,validate(todoPatchSchema),async(req, res) => {
    const id=Number(req.params.id)
    const todo = await prisma.todo.findFirst({
      where:{id,userId:req.userId!}
    })
    if(!todo){
      res.status(404).json({message:'Todo不存在'})
      return
    }
    const updated = await prisma.todo.update({
      where:{id},
      data:req.body,
    })
    res.json(updated)
})

app.delete('/todos/:id',auth,async (req, res) => {
    const id = Number(req.params.id)
    const todo = await prisma.todo.findFirst({
      where:{id,userId:req.userId!}
    })
    if(!todo){
      res.status(404).json({message:'todo不存在'})
      return
    }
    const deleted = await prisma.todo.delete({
      where:{id},
    })
    res.json(deleted)
})

app.post("/auth/register",async(req,res)=>{
    const {username,password} = req.body
    const existUser = await prisma.user.findUnique({where:{username}})
    if (existUser){
      res.status(409).json({message:'用户名已被占用'})
      return
    }
    const hashPassword=await bcrypt.hash(password, 10)
    const user= await prisma.user.create({
      data:{username,password:hashPassword}
    })

    res.status(201).json({id:user.id,username:user.username})
})

app.post("/auth/login",async(req,res)=>{
    const {username,password}=req.body
    const user = await prisma.user.findUnique({where:{username}})
    if (!user){
      res.status(401).json({message:"用户名或密码错误"})
      return
    }
    const isMatch= await bcrypt.compare(password,user.password)
    if(!isMatch){
      res.status(401).json({message:'用户名或密码错误'})
      return
    }
    const token =jwt.sign({userId:user.id},process.env.JWT_SECRET!,{expiresIn:'7d'})
    res.json({token})
})

// 错误处理中间件:四个参数是身份标识,Express 靠参数个数认出它
// 决策链:ZodError(客户端传参不合格)→400 / P2025(记录不存在)→404 / 其他→500
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // 全量日志留在服务端,客户端只拿到模糊文案
  console.log(err)
  // ZodError:zod 校验失败抛的错,锅在客户端 → 400
  if (err instanceof ZodError) {
    // 每条 issue 拼成 "字段名: 原因",多条用分号连接
    const msg = err.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    res.status(400).json({ message: msg })
  } else if((err as any).code=='P2025'){
    res.status(404).json({message:'todo不存在'})
  }else{
    res.status(500).json({message:'服务端错误'})
  }
})

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})