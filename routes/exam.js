// Import required modules
const express = require('express')
const mongoose = require('mongoose')
const Exam = require('../models/exam') // Exam modelini import qilish
const Test = require('../models/test') // Exam modelini import qilish
const { decodeMsgpackBase64 } = require('../utils/coding')
const { User } = require('../models/user')
const Class = require('../models/class')
const { validateQuestions, calculatePercentage } = require('../utils/word')
const ResponseExam = require('../models/response')
const router = express.Router()

// CREATE: Yangi exam qo'shish
router.post('/', async (req, res) => {
  try {
    const user = req.user
    const { testId, title, classId, startTime, endTime } = req.body
    // console.log(req.body)
    if (startTime.length === 0 && startTime.length === 0) {
      res.status(400).send({ message: 'Required all fields' })
    }
    // startTime va endTime qiymatlarini Date obyektiga o'zgartirish

    let test = await Test.findById(testId)
    // console.log(test)
    if (!test) {
      return res.status(404).send({ message: 'Test topilmadi' })
    }

    const newExam = new Exam({
      title,
      encodedData: test.encodedData,
      who: user,
      class: classId,
      startTime,
      endTime,
      type: test.type
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

    res.status(201).send({
      title: savedExam.title,
      id: savedExam._id,
      questions: decodedExamQuestions
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// READ: Barcha examlarni olish
router.get('/', async (req, res) => {
  let user = req.user

  // Pagination uchun query parametrlari
  const page = parseInt(req.query.page) || 1 // Default: 1-sahifa
  const limit = parseInt(req.query.limit) || 10 // Default: 10 ta yozuv
  const skip = (page - 1) * limit

  try {
    // Examlarni olish
    const exams = await Exam.find(
      { who: user, status: true }, // Foydalanuvchiga tegishli examlar
      { encodedData: 0 } // encodedData maydonini chiqarib tashlash
    )
      .populate({
        path: 'class',
        select: 'name'
      })
      .skip(skip) // Sahifani o'tkazib yuborish
      .limit(limit) // Cheklangan miqdordagi yozuvlarni olish

    // Umumiy examlar sonini olish
    const total = await Exam.countDocuments({ who: user, status: true })

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

// READ: Bitta examni ID orqali olish
router.get('/:id', async (req, res) => {
  let role = req.role
  let user = req.user
  try {
    const { id } = req.params
    const exam = await Exam.findById(id)
    // console.log(exam)
    if (!exam) return res.status(404).json({ message: 'Exam not found' })
    const decodedExam = decodeMsgpackBase64(`${exam.encodedData}`, role)
    const response_exams = await ResponseExam.find({ exam: exam, who: user })
    if (response_exams.length) {
      return res.status(200).send({
        title: exam.title + " Ushbu Test oldin ishlangan",
        questions: [],
        status: false,
        type: exam.type
      })

    }

    res.status(200).json({
      title: exam.title,
      questions: decodedExam,
      status: exam.status,
      type: exam.type
    })
  } catch (error) {
    res.status(500).send({ message: error.message })
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
  // console.log(response_result)
  let id = req.params.id
  let userId = req.user
  try {
    let testBase = await Exam.findById(id)
    // console.log(testBase)
    // Testni dekodlash
    let testDecode = decodeMsgpackBase64(testBase?.encodedData)
    // Savollarni tekshirish va natijani olish
    // console.log(testDecode)
    let result = validateQuestions(response_result, testDecode, "test")

    if (!result) {
      return res.status(400).send({ msg: 'Invalid response' })
    }
    // Foydalanuvchini olish
    let user = await User.findById(userId)

    if (!user?.grades?.length || !user?.grades) {
      user.grades = []
    }

    // console.log(result)
    let response = new ResponseExam({
      exam_response: JSON.stringify(result.result),
      who: userId,
      class: user.class,
      type: "test",
      status: "pending",
      exam: id,
      grade: { grade: result?.grade, total: result?.total },
    })
    response.save()
    // Natijani foydalanuvchining grades arrayiga qo'shish

    // Foydalanuvchini yangilash
    await user.save()

    res.status(200).send({ msg: 'success', result: response })
  } catch (error) {
    // console.log(error)

    // Xatolikni qaytarish
    res.status(400).send({ msg: 'error' })
  }
})
router.get('/students/:examId', async (req, res) => {
  try {
    // const exam = await Exam.findById(req.params.examId)
    const result = await Exam.findById(req.params.examId)
    console.log(result)
    const questions = decodeMsgpackBase64(result.encodedData)
    res.status(200).send({
      "title": result.title,
      questions,
      "status": result.status,
      "type": result.type

    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})
router.get('/students/:examId/results', async (req, res) => {
  const page = parseInt(req.query.page) || 1 // Default: 1-sahifa
  const limit = parseInt(req.query.limit) || 10 // Default: 10 ta yozuv
  const skip = (page - 1) * limit
  try {
    // const exam = await Exam.findById(req.params.examId)
    const result = await ResponseExam.find(
      { exam: req.params.examId },
      { exam_response: 0 }
    ).populate([
      { path: "who", select: "-password" },
      { path: "exam", select: "-encodedData" }
    ]).skip(skip) // Sahifani o'tkazib yuborish
      .limit(limit);

    const total = await ResponseExam.countDocuments({ exam: req.params.examId })

    res.status(200).send({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: result
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
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
    res.status(200).send({
      first_name: result?.first_name,
      last_name: result?.last_name,
      grade: result?.grades[0].grade,
      result: JSON.parse(result?.grades[0].exam_response)?.result
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
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

router.delete('/response/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(id)
    const deletedExam = await ResponseExam.findByIdAndDelete(id)
    if (!deletedExam) return res.status(404).json({ message: 'Exam not found' })
    res.status(200).json({ message: 'Exam deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})
module.exports = router
