const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User } = require('../models/user') // User modelini import qilish
require('dotenv').config() // .env faylini o'qish

const router = express.Router()

// JWT uchun maxfiy kalit
const SECRET_KEY = process.env.SECRET_KEY

// 1. Signup (Ro'yxatdan o'tish)
router.post('/signup', async (req, res) => {
  try {
    const { first_name, last_name, username, password, role } = req.body

    // Username tekshirish
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' })
    }

    // Parolni hash qilish
    const hashedPassword = await bcrypt.hash(password, 10)

    // Yangi o'qituvchi yaratish
    const teacher = new User({
      first_name,
      last_name,
      username,
      role,
      password: hashedPassword
    })

    await teacher.save()
    res.status(201).json({ message: 'Teacher registered successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error registering teacher', error })
  }
})

// 2. Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    console.log(username, password)
    // Foydalanuvchini topish
    const teacher = await User.findOne({ username })
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' })
    }

    // Parolni tekshirish
    const isPasswordValid = await bcrypt.compare(password, teacher.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // JWT token yaratish
    const token = jwt.sign(
      { id: teacher._id, role: teacher.role },
      SECRET_KEY,
      {
        expiresIn: '1d'
      }
    )

    res.status(200).json({ message: 'Login successful', token })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error logging in', error })
  }
})

module.exports = router
