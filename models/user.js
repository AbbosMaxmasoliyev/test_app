const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true
    },
    last_name: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    classes: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Class'
      }
    ],
    role: {
      type: String,
      enum: ['student', 'director', 'teacher'],
      required: true
    },
    active: {
      type: Boolean,
      default: true
    },
    grades: {
      type: [
        {
          grade: Number,
          date: Number,
          exam: String,
          examTitle: String
        }
      ],
      default: undefined,
      validate: {
        validator: function (value) {
          // Faqat 'student' roli uchun grades berilishi mumkin
          return this.role === 'student' || value === undefined
        },
        message: 'Grades can only be assigned to students.'
      }
    },
    exams: {
      type: mongoose.Types.ObjectId,
      ref: 'Test',
      validate: {
        validator: function (value) {
          // Faqat 'teacher' roli uchun exams berilishi mumkin
          return this.role === 'teacher' || value === undefined
        },
        message: 'Exams can only be assigned to teachers.'
      }
    }
  },
  {
    timestamps: true // Time-stamping qo'shildi
  }
)

// Create the User model
const User = mongoose.model('User', userSchema)

module.exports = { User, userSchema }
