const express = require('express')
const mongoose = require('mongoose')
const testRouter = require('./routes/test')
const userRouter = require('./routes/teachers')
const examRouter = require('./routes/exam')
const classRouter = require('./routes/class')
const authRoutes = require('./routes/auth')
const studentRoutes = require('./routes/student')
require('dotenv').config() // .env faylini o'qish

const cors = require('cors')
const authMiddleware = require('./middlewares/auth')
const app = express()
app.use(express.json())

// MongoDB ulanishi
const mongoURL =
  process.env.NODE_ENV === 'production'
    ? 'mongodb+srv://abbos:uzEgqsSDnf6rTLuq@cluster0.adosdaq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    : 'mongodb://127.0.0.1:27017/testdb'
mongoose
  .connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB ulanishi muvaffaqiyatli amalga oshirildi'))
  .catch(err => console.error('MongoDB ulanishida xatolik yuz berdi:', err))
app.use(
  cors({
    origin: '*', // Barcha domenlarga ruxsat berish
    methods: ['GET', 'POST', 'PUT', 'DELETE'] // Qaysi metodlarga ruxsat berish
  })
)
// Fayllarni saqlash uchun `multer` konfiguratsiyasi
app.use('/test', authMiddleware, testRouter)
app.use('/teacher', userRouter)
app.use('/exams', authMiddleware, examRouter)
app.use('/class', authMiddleware, classRouter)
app.use('/auth', authRoutes)
app.use('/students', authMiddleware, studentRoutes)
// Serverni ishga tushirish
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishlamoqda`)
})
