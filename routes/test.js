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

// Fayl yuklash uchun endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  const { title } = req.body // req.body dan mavzuni olish
  let userId
  if (!req.file || !title) {
    return res.status(400).json({ error: 'Fayl yoki mavzu kiritilmadi' })
  }

  try {
    const questions = await parseWordFile(req.file.path)

    console.log('Process started')
    const encodedData = encodeMsgpackBase64(questions)

    console.log('Process ended')

    // Testni bazaga saqlash
    const newTest = new Test({
      title, // decode qilib saqlanadi
      questions,
      encodedData: encodedData.replace('==', '') // base64 kodlangan holda saqlanadi
    })

    await newTest.save()

    console.timeEnd('Process Duration')
    await fs.unlink(req.file.path) // Yuklangan faylni o'chirish
    res.json({
      message: 'Test muvaffaqiyatli saqlandi',
      success: true,
      link: `https://localhost:3000/${newTest._id}`
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Faylni qayta ishlashda xatolik yuz berdi' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
    if (!test) {
      res.status(404).json({ message: 'Test topilmadi', success: false })
    }
    res.json({ test: decodeMsgpackBase64(test.encodedData), success: true })
  } catch (error) {
    res.status(500).json({ message: "Xato so'rov", success: false })
  }
})
router.post('/check/:id', async (req, res) => {
  let { response_result } = req.body
  let id = req.params.id
  let userid = req.user || '67811fe45c20084d6212a2a3'
  try {
    let testBase = await Test.findById(id)

    // Testni dekodlash
    let testDecode = decodeMsgpackBase64(testBase.encodedData)
    // Savollarni tekshirish va natijani olish
    let result = validateQuestions(response_result, testDecode)

    // Foydalanuvchini olish
    let user = await User.findById(userid)

    // Agar grades maydoni mavjud bo'lmasa, uni bo'sh massivga o'rnatish
    if (!user.grades) {
      user.grades = []
    }

    // Natijani foydalanuvchining grades arrayiga qo'shish
    user.grades.push({
      grade: calculatePercentage(result.grade, result.total), // 'garde' o'rniga 'grade' deb yozildi
      date: new Date().getTime(),
      examTitle: testBase.title,
      exam: testBase.encodedData
    })

    // Foydalanuvchini yangilash
    await user.save()

    console.log(result)

    // Javob yuborish
    res.status(200).send({ msg: 'success', result })
  } catch (error) {
    console.log(error)

    // Xatolikni qaytarish
    res.status(400).send({ msg: 'error' })
  }
})

module.exports = router
