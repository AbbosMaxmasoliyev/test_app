const xlsx = require('xlsx');
const questionRegex = /~\s*([^\n]+)/g // Savol matnini ajratish regexi
const optionRegex = /([+-])([A-D])\)\s*(.+)/g // Variantlarni ajratish regexi
const { v4: uuidv4 } = require('uuid')
function parseQuestionsAndOptions(data) {
  const questions = {}

  data.forEach(row => {
    const options = []
    let correctAnswer = null

    const optionKeys = ['A', 'B', 'C', 'D']

    optionKeys.forEach(key => {
      const answerText = row[`${key}`]
      if (answerText) {
        const option = { text: answerText }
        options.push(option)
        if (row.Togri === key) {
          correctAnswer = answerText
        }
      }
    })

    questions[uuidv4()] = {
      question: row['Savol'],
      options,
      correctAnswer
    }
  })

  return questions
}
function validateQuestions(response, test, type) {
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

function calculatePercentage(part, total) {
  return (part / total) * 100
}

// Savollarni parsing qilish uchun funktsiya
async function parseWordFile(filePath) {
  const workbook = xlsx.readFile(filePath); // Fayl nomini moslashtiring
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  const questions = parseQuestionsAndOptions(data)

  return questions
}

module.exports = { parseWordFile, validateQuestions, calculatePercentage }
