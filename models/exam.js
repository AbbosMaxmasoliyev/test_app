const mongoose = require('mongoose')

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    encodedData: { type: String, required: true },

    status: {
      type: Boolean,
      default: true
    },
    who: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },
    class: {
      type: mongoose.Types.ObjectId,
      ref: 'Class'
    }
  },

  {
    timestamps: true,
    timeseries: true
  }
)

module.exports = mongoose.model('Exam', examSchema)