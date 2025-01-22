const express = require('express');
const cors = require('cors');
const testRouter = require('./routes/test');
const userRouter = require('./routes/teachers');
const examRouter = require('./routes/exam');
const classRouter = require('./routes/class');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const authMiddleware = require('./middlewares/auth');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

app.use('/test', authMiddleware, testRouter);
app.use('/teacher', userRouter);
app.use('/exams', authMiddleware, examRouter);
app.use('/class', authMiddleware, classRouter);
app.use('/auth', authRoutes);
app.use('/students', authMiddleware, studentRoutes);

module.exports = app;
