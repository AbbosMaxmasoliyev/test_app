const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User } = require('../models/user') // User modelini import qilish

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
    const teacher = await User.findOne({ username, role: 'teacher' })
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
        expiresIn: '1h'
      }
    )

    res.status(200).json({ message: 'Login successful', token })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error logging in', error })
  }
})

// 3. Create (Yangi o'qituvchi qo'shish)
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, username, password } = req.body

    // Parolni hash qilish
    const hashedPassword = await bcrypt.hash(password, 10)

    const teacher = new User({
      first_name,
      last_name,
      username,
      role: 'teacher',
      password: hashedPassword
    })

    await teacher.save()
    res.status(201).json({ message: 'Teacher created successfully', teacher })
  } catch (error) {
    res.status(500).json({ message: 'Error creating teacher', error })
  }
})

// 4. Read (O'qituvchilarni olish)
router.get('/', async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
    res.status(200).json(teachers)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teachers', error })
  }
})

// 5. Update (O'qituvchini yangilash)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const updatedTeacher = await User.findByIdAndUpdate(id, updates, {
      new: true
    })

    if (!updatedTeacher) {
      return res.status(404).json({ message: 'Teacher not found' })
    }

    res
      .status(200)
      .json({ message: 'Teacher updated successfully', updatedTeacher })
  } catch (error) {
    res.status(500).json({ message: 'Error updating teacher', error })
  }
})

// 6. Delete (O'qituvchini o'chirish)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const deletedTeacher = await User.findByIdAndUpdate(id, { status: false })

    if (!deletedTeacher) {
      return res.status(404).json({ message: 'Teacher not found' })
    }

    res.status(200).json({ message: 'Teacher deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting teacher', error })
  }
})

// router.get('/my-exams', async (req, res) => {
//   let userid = req.user || '67811fe45c20084d6212a2a3'
//   try {
//     let exams = await User.findById(userid).populate('exams')
//     res.send(exams)
//   } catch (error) {}
// })

module.exports = router
