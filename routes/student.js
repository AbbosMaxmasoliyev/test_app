// Import required modules
const express = require('express')
const mongoose = require('mongoose')
const Exam = require('../models/exam') // Exam modelini import qilish
const Test = require('../models/test') // Exam modelini import qilish
const { decodeMsgpackBase64 } = require('../utils/coding')
const { User } = require('../models/user')
const Class = require('../models/class')
const { validateQuestions, calculatePercentage } = require('../utils/word')
const router = express.Router()

// READ: Barcha examlarni olish
router.get('/exams/all', async (req, res) => {
  let user = req.user
  console.log(user)

  // Pagination uchun query parametrlari
  const page = parseInt(req.query.page) || 1 // Default: 1-sahifa
  const limit = parseInt(req.query.limit) || 10 // Default: 10 ta yozuv
  const skip = (page - 1) * limit

  try {
    let userBase = await User.findById(user)
    console.log(userBase)

    const now = new Date().getTime() // Hozirgi vaqtni olish
    console.log(now)

    const exams = await Exam.find(
      {
        class: userBase.class,
        startTime: { $gt: 1736965028931 - (6000 * 2400) }
      }, // startTime hozirgi vaqtdan katta bo'lgan examlar
      { encodedData: 0 } // encodedData maydonini chiqarib tashlash
    )
      .skip(skip) // Sahifani o'tkazib yuborish
      .limit(limit) // Cheklangan miqdordagi yozuvlarni olish

    // Umumiy examlar sonini olish
    const total = await Exam.countDocuments({
      class: userBase.class,
      startTime: { $gt: now }
    })

    res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: exams
    })
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Examlarni olishda xatolik', error: error.message })
  }
})

router.get('/grades', async (req, res) => {
  const user = req.user

  // Pagination uchun query parametrlari
  const page = parseInt(req.query.page) || 1 // Default: 1-sahifa
  const limit = parseInt(req.query.limit) || 10 // Default: 10 ta yozuv
  const skip = (page - 1) * limit

  try {
    // Foydalanuvchini olish
    const userBase = await User.findById(user)

    if (!userBase) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
    }

    // grades massivini olish va paginationni qo'llash
    const grades = userBase.grades.slice(skip, skip + limit)

    // Umumiy grades sonini olish
    const total = userBase.grades.length

    res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: grades
    })
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Gradesni olishda xatolik', error: error.message })
  }
})

// READ: Bitta examni ID orqali olish
router.get('/:id', async (req, res) => {
  let role = req.role
  let user = req.user
  try {
    const { id } = req.params
    const exam = await Exam.findById(id)
    if (!exam) return res.status(404).json({ message: 'Exam not found' })
    const decodedExam = decodeMsgpackBase64(`${exam.encodedData}`, role)

    res
      .status(200)
      .json({ title: exam.title, questions: decodedExam, status: exam.status })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/check/:id', async (req, res) => {
  let { response_result, status = 'pending' } = req.body
  let id = req.params.id
  let userId = req.user
  try {
    let testBase = await Exam.findById(id)

    // Testni dekodlash
    let testDecode = decodeMsgpackBase64(testBase.encodedData)
    // Savollarni tekshirish va natijani olish
    let result = validateQuestions(response_result, testDecode)

    // Foydalanuvchini olish
    let user = await User.findById(userId)

    // Agar grades maydoni mavjud bo'lmasa, uni bo'sh massivga o'rnatish
    if (!user?.grades?.length) {
      user.grades = []
    }

    // Natijani foydalanuvchining grades arrayiga qo'shish
    user.grades.push({
      grade: calculatePercentage(result.grade, result.total), // 'garde' o'rniga 'grade' deb yozildi
      date: new Date().getTime(),
      exam: req.params.id,
      exam_response: JSON.stringify(result),
      status
    })

    // Foydalanuvchini yangilash
    await user.save()

    // Javob yuborish
    res.status(200).send({ msg: 'success', result })
  } catch (error) {
    console.log(error)

    // Xatolikni qaytarish
    res.status(400).send({ msg: 'error' })
  }
})
router.get('/students/:examId', async (req, res) => {
  try {
    // const exam = await Exam.findById(req.params.examId)
    const result = await User.aggregate([
      {
        $match: {
          'grades.exam': new mongoose.Types.ObjectId(req.params.examId)
        }
      },
      { $project: { 'grades.exam_response': 0 } },
      { $unwind: '$grades' },
      {
        $match: {
          'grades.exam': new mongoose.Types.ObjectId(req.params.examId)
        }
      }
    ])
    res.status(200).send(result)
  } catch (error) {
    console.log(error)
  }
})
router.get('/result/:examId/:studentId', async (req, res) => {
  try {
    const result = await User.findOne(
      {
        _id: req.params.studentId, // Studentni ID bo‘yicha topish
        grades: {
          $elemMatch: { exam: req.params.examId } // ExamId bo‘yicha filtr
        }
      },
      {
        first_name: 1,
        last_name: 1,
        'grades.$': 1 // Faqat mos keluvchi `grades` elementini qaytaradi
      }
    )
    res.status(200).send(result)
  } catch (error) {}
})
// DELETE: Examni o'chirish
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deletedExam = await Exam.findByIdAndUpdate(id, { status: false })
    if (!deletedExam) return res.status(404).json({ message: 'Exam not found' })
    res.status(200).json({ message: 'Exam deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router