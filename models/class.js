const mongoose = require('mongoose')

const classSchema = new mongoose.Schema({
  name: {
    type: String
  },
  year: {
    type: Number,
    default: new Date().getFullYear()
  },
  students: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    }
  ]
})

// Create the User model
const Class = mongoose.model('Class', classSchema) // Corrected model creation

module.exports = Class
