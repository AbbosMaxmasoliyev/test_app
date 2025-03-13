const multer = require('multer')
const express = require('express')
const Test = require('../models/test')
const {
  testEncodings,
  encodeMsgpackBase64,
  decodeMsgpackBase64
} = require('../utils/coding') // Import encoding function
const {
  parseWordFile,
  validateQuestions,
  calculatePercentage
} = require('../utils/word')
const fs = require('fs').promises
const path = require('path')
const { User } = require('../models/user')
const router = express.Router()
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${Date.now()}${ext}`)
  }
})

const upload = multer({ storage: storage })
router.get('/all', async (req, res) => {
  let userId = req.user

  // Pagination uchun query parametrlari
  const page = parseInt(req.query.page) || 1 // Default: 1-sahifa
  const limit = parseInt(req.query.limit) || 10 // Default: 10 ta yozuv
  const skip = (page - 1) * limit

  try {
    // Testlarni olish
    const tests = await Test.find({ status: true, who: userId })
      .skip(skip)
      .limit(limit)

    // encodedData ni dekodlash va savollar sonini qo'shish
    const result = tests.map(test => {
      const questions = decodeMsgpackBase64(test.encodedData) // encodedData ni dekodlash
      return {
        _id: test._id,
        title: test.title,
        status: test.status,
        date: test?.createdAt,
        who: test?.who, // Test ob'ektini oddiy JavaScript ob'ektga aylantirish
        questions: Object.keys(questions).length // Savollar sonini qo'shish
      }
    })
    // Umumiy yozuvlar sonini olish
    const total = await Test.countDocuments({ status: true, who: userId })

    res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: result
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Testlarni olishda xatolik' })
  }
})

// Fayl yuklash uchun endpoint
router.post('/create', upload.single('file'), async (req, res) => {
  const { title, type } = req.body // req.body dan mavzuni olish
  // console.log(type)
  let userId = req.user
  if (!req.file || !title) {
    return res.status(400).json({ error: 'Fayl yoki mavzu kiritilmadi' })
  }

  try {
    const questions = await parseWordFile(req.file.path)

    // console.log('Process started')
    const encodedData = encodeMsgpackBase64(questions)

    // console.log('Process ended')

    // Testni bazaga saqlash
    const newTest = new Test({
      title, // decode qilib saqlanadi
      questions,
      who: userId,
      type,
      encodedData: encodedData.replace('==', '') // base64 kodlangan holda saqlanadi
    })

    await newTest.save()

    console.timeEnd('Process Duration')
    await fs.unlink(req.file.path) // Yuklangan faylni o'chirish
    res.json({
      message: 'Test muvaffaqiyatli saqlandi',
      success: true,
      link: newTest._id
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Faylni qayta ishlashda xatolik yuz berdi' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, status: true })
    // console.log(test)
    if (!test) {
      res.status(404).json({ message: 'Test topilmadi', success: false })
    }
    res.json({
      test: decodeMsgpackBase64(test.encodedData),
      success: true,
      title: test.title
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Xato so'rov", success: false })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    let deleteTest = await Test.findByIdAndUpdate(req.params.id, {
      status: false
    })
  } catch (error) {}
})
module.exports = router
