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
    class: {
      type: mongoose.Types.ObjectId,
      ref: 'Class'
    },
    role: {
      type: String,
      enum: ['student', 'director', 'teacher'],
      required: true
    },
    password: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    },
    
  },
  {
    timestamps: true // Time-stamping qo'shildi
  }
)

// Create the User model
const User = mongoose.model('User', userSchema)

module.exports = { User, userSchema }
