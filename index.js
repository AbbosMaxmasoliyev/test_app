const express = require('express')
const mongoose = require('mongoose')
const testRouter = require('./routes/test')
const userRouter = require('./routes/teachers')
const app = express()
app.use(express.json())

// MongoDB ulanishi
mongoose
  .connect('mongodb://127.0.0.1:27017/testdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB ulanishi muvaffaqiyatli amalga oshirildi'))
  .catch(err => console.error('MongoDB ulanishida xatolik yuz berdi:', err))

// Fayllarni saqlash uchun `multer` konfiguratsiyasi
app.use('/test', testRouter)
app.use('/teacher', userRouter)
// Serverni ishga tushirish
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishlamoqda`)
})
