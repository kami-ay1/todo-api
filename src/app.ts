import express from 'express'
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"
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

app.get('/todos', async (req, res) => {
  try {
    const todos=await prisma.todo.findMany()
    res.json(todos)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})


app.get('/todos/:id',async (req, res) => {
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

app.post('/todos', async(req, res) => {
  try{
    const todo = await prisma.todo.create({data:{title:req.body.title}})
    res.status(201).json(todo)
  }catch(error){
    res.status(500).json({message:'服务器错误'})
  }
})

app.patch('/todos/:id', async(req, res) => {
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

app.delete('/todos/:id',async (req, res) => {
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
    const token =jwt.sign({userId:user.id},process.env.JWT_SECRET!,{expiresIn:'7d})
    res.json({token})
  }catch(err:any){
    res.status(500).json({message:'服务器错误'})
  }
})


app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})