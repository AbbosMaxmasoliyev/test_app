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

// CREATE: Yangi exam qo'shish
router.post('/', async (req, res) => {
  try {
    const user = req.user 
    const { testId = '67239e65ff4a6b69f233f7b8', title, classId } = req.body
    let test = await Test.findById(testId)
    console.log(test)
    const newExam = new Exam({
      title,
      encodedData: test.encodedData,
      who: user,
      class: classId
    })
    const savedExam = await newExam.save()
    const classBase = await Class.findById(classId)
    if (!classBase.exams.length) {
      classBase.exams = [newExam._id]
    } else {
      classBase.exams.push(newExam._id)
    }
    await classBase.save()
    let decodedExamQuestions = decodeMsgpackBase64(savedExam.encodedData)
    res
      .status(201)
      .json({ title: savedExam.title, questions: decodedExamQuestions })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// READ: Barcha examlarni olish
router.get('/', async (req, res) => {
  let user = req.user 
  try {
    const exams = await Exam.find({ who: user }, { encodedData: 0 })
    res.status(200).json({ exams })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// READ: Bitta examni ID orqali olish
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const exam = await Exam.findById(id)
    if (!exam) return res.status(404).json({ message: 'Exam not found' })
    const decodedExam = decodeMsgpackBase64(`${exam.encodedData}`)

    res
      .status(200)
      .json({ title: exam.title, questions: decodedExam, status: exam.status })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// UPDATE: Examni yangilash
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, encodedData, status } = req.body
    const updatedExam = await Exam.findByIdAndUpdate(
      id,
      { title, encodedData, status },
      { new: true, runValidators: true }
    )
    if (!updatedExam) return res.status(404).json({ message: 'Exam not found' })
    res.status(200).json(updatedExam)
  } catch (error) {
    res.status(400).json({ message: error.message })
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
    if (!user.grades.length) {
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
      { $match: { 'grades.exam':new mongoose.Types.ObjectId(req.params.examId) } },
      { $project: { 'grades.exam_response': 0 } },
      { $unwind: '$grades' },
      { $match: { 'grades.exam': new mongoose.Types.ObjectId(req.params.examId) } }
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
