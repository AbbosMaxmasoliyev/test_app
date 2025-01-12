const mongoose = require('mongoose');



const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    class: {
      type: mongoose.Types.ObjectId,
      ref: 'Class',
    },
    role: {
      type: String,
      enum: ['student', 'director', 'teacher'],
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    grades: {
      type: [
        {
          grade: {
            type: Number,
            required: true,
          },
          date: {
            type: Number,
            required: true,
          },
          exam: {
            type: mongoose.Types.ObjectId,
            ref: 'Exam',
            required: true,
          },
          status: {
            type: String,
            enum: ['incomplete', 'complete', 'cheated', 'pending'],
            required: true,
          },
          exam_response:{
            type:String,
          }
        },
      ],
      default: undefined,
      validate: {
        validator: function (value) {
          return this.role === 'student' || value === undefined;
        },
        message: 'Grades can only be assigned to students.',
      },
    },
    // exams: {
    //   type: [
    //     {
    //       type: mongoose.Types.ObjectId,
    //       ref: 'Exam',
    //     },
    //   ],
    //   validate: {
    //     validator: function (value) {
    //       return this.role === 'teacher' || value === undefined;
    //     },
    //     message: 'Exams can only be assigned to teachers.',
    //   },
    // },
  },
  {
    timestamps: true, // Time-stamping qo'shildi
  }
);

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = { User, userSchema };
