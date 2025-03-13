const mammoth = require('mammoth')
const questionRegex = /~\s*([^\n]+)/g // Savol matnini ajratish regexi
const optionRegex = /([+-])([A-D])\)\s*(.+)/g // Variantlarni ajratish regexi
const { v4: uuidv4 } = require('uuid')

function parseQuestionsAndOptions (text) {
  const questions = {}
  const questionMatches = [...text.matchAll(questionRegex)]

  for (let i = 0; i < questionMatches.length; i++) {
    const questionText = questionMatches[i][1].trim()
    const questionSection = text.slice(
      questionMatches[i].index,
      questionMatches[i + 1]?.index
    ) // Keyingi savol boshlangunga qadar bo'lgan qismni olamiz

    const options = []
    let correctAnswer = null
    let optionMatch

    // Ushbu savolga tegishli variantlarni olish
    while ((optionMatch = optionRegex.exec(questionSection)) !== null) {
      const sign = optionMatch[1] // `+` yoki `-` belgisini olamiz
      const optionText = optionMatch[3].trim()

      const option = {
        text: optionText
      }

      if (sign === '+' && !correctAnswer) {
        correctAnswer = optionText
      }
      options.push(option)
    }

    questions[uuidv4()] = {
      question: questionText,
      options,
      correctAnswer
    }
  }

  return questions
}

function validateQuestions (response, test, type) {
  if (!response || !test) {
    return null
  }
  let count = 0
  const result = {}
  // console.log(response, '=>>>> Response')
  let keys = Object.keys(test)
  if (type === 'test') {
    keys.forEach(value => {
      // result[value] obyektini yaratish
      // console.log(test[value], '=>>>> Salom')
      let checked = response[value]?.option === test[value].correctAnswer
      checked ? count++ : false
      result[value] = {
        question: test[value].question,
        option: response[value]?.option || null, // response[value] mavjudligini tekshirish
        check: checked // Javobni tekshirish
      }
    })
  }
  return { result, grade: count, total: keys.length }
}

function calculatePercentage (part, total) {
  return (part / total) * 100
}

// Savollarni parsing qilish uchun funktsiya
async function parseWordFile (filePath) {
  const { value } = await mammoth.extractRawText({ path: filePath })

  const questions = parseQuestionsAndOptions(value)

  return questions
}

module.exports = { parseWordFile, validateQuestions, calculatePercentage }
