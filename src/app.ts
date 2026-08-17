import express from 'express'
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"
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
const auth = (req, res, next) => {
  // ① 从 header 拿 token
  const token = req.headers.authorization?.split(' ')[1]
  // req.headers.authorization 的值长这样:"Bearer eyJhbGciOi..."
  // 思考:token 是空格后面那一段,用哪个字符串方法取出来?

  // ② 如果没带 token(header 不存在或格式不对)→ 返回 401,别调 next
  if(!token){
    res.status(401).json({message:"未提供token"})
    return 
  }
  // ③ 验签
  // 提示:jwt.verify(token, 密钥) 的行为是——
  //   通过:返回你登录时签进去的对象 { userId, iat, exp }
  //   失败:不返回 null,而是抛异常
  // 思考:这种行为该用什么语法结构包住它?
  try{
    const payload = jwt.verify(token,process.env.JWT_SECRET!)
    req.userId=(payload as any).userId
    next()
  }catch{
    res.status(401).json({message:'token无效或已过期'})
  }
  // ④ 验证通过:把 payload 里的 userId 挂到 req 上,调 next()

}



app.get('/todos',auth, async (req, res) => {
  try {
    const todos=await prisma.todo.findMany({where:{
      userId:req.userId
    }
  })
    res.json(todos)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})


app.get('/todos/:id',auth,async (req, res) => {
  try{
    const id = Number(req.params.id)
    const todo = await prisma.todo.findUnique({where:{id} })
    if (!todo){
      res.status(404).json({ message: 'Todo 不存在' })
      return
    }
    res.json(todo)
  } catch(error){
    res.status(500).json({ message: '服务器错误' })
  }
})

app.post('/todos', auth,async(req, res) => {
  try{
    const todo = await prisma.todo.create({
      data:{
        title:req.body.title,
        userId:req.userId
      }
    })
    res.status(201).json(todo)
  }catch(error){
    res.status(500).json({message:'服务器错误'})
  }
})

app.patch('/todos/:id', auth,async(req, res) => {
  try{
    const id=Number(req.params.id)
    const todo = await prisma.todo.update({
      where:{id},
      data:{...req.body}
    })
    res.json(todo)
  }catch(err:any){
    if(err.code=='P2025'){
      res.status(404).json({message:'Todo不存在'})
    }else{
      res.status(500).json({message:"服务器错误"})
    }
  }
})

app.delete('/todos/:id',auth,async (req, res) => {
  try{
    const id = Number(req.params.id)
    const todo = await prisma.todo.delete({where:{id}})
    res.json(todo)
  }catch(err:any){
    if(err.code=="P2025"){
      res.status(404).json({message:"todo不存在"})
    }else{
      res.status(500).json({message:"服务器错误"})
    }
  }
  

})

app.post("/auth/register",async(req,res)=>{
  try{
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
  }catch(err:any){
    res.status(500).json({message:'服务器错误'})
  }
})

app.post("/auth/login",async(req,res)=>{
  try{
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
  }catch(err:any){
    res.status(500).json({message:'服务器错误'})
  }
})


app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})