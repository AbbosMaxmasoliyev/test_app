const request = require('supertest');
const app = require('../app.js'); // Yo'lni mos ravishda sozlang
const { expect } = require('chai');
const mongoose = require('mongoose');
const Class = require('../models/class');
const { User } = require('../models/user.js');

let token; // Authorization uchun token
let classId;
let studentId;

before(async () => {
  try {
    await mongoose.connect(process.env.MONGO_TEST_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to test database.');

    // Test uchun foydalanuvchini ro'yxatdan o'tkazish va token olish
    const userRes = await request(app).post('/auth/signup').send({
      first_name: 'Admin',
      last_name: 'User',
      username: 'admin_user',
      password: 'admin123',
      role: 'teacher',
    });

    const loginRes = await request(app).post('/auth/login').send({
      username: 'admin_user',
      password: 'admin123',
    });

    token = loginRes.body.token; // Login orqali olingan token

    // Test uchun o'quvchi yaratish
    const student = new User({
      first_name: 'John',
      last_name: 'Doe',
      username: 'john_doe',
      password: 'password123',
      role: 'student',
    });
    await student.save();
    studentId = student._id;
  } catch (err) {
    console.error('Error setting up test environment:', err);
  }
});

describe('Class Routes', () => {
  // 1. Create (Yangi sinf qo'shish)
  it('should create a new class', async () => {
    const res = await request(app)
      .post('/class')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Math 101',
        year: 2023,
        students: [studentId],
      });

    expect(res.statusCode).to.equal(201);
    expect(res.body).to.have.property('message', 'Class created successfully');
    expect(res.body.class).to.have.property('name', 'Math 101');
    classId = res.body.class._id;
  });

  // 2. Read All (Barcha sinflarni olish)
  it('should fetch all classes', async () => {
    const res = await request(app).get('/class').set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  // 3. Read One (Bitta sinfni olish)
  it('should fetch a single class by ID', async () => {
    const res = await request(app)
      .get(`/class/${classId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('name', 'Math 101');
  });

  // 4. Update (Sinfni yangilash)
  it('should update a class', async () => {
    const res = await request(app)
      .put(`/class/${classId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Math 102',
      });

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('message', 'Class updated successfully');
    expect(res.body.class).to.have.property('name', 'Math 102');
  });

  // 5. Delete (Sinfni o'chirish)
  it('should delete a class', async () => {
    const res = await request(app)
      .delete(`/class/${classId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('message', 'Class deleted successfully');
  });

  // 6. Add Student to Class (Sinfga o'quvchi qo'shish)
  it('should add a student to a class', async () => {
    const newClass = new Class({
      name: 'Science 101',
      year: 2023,
      students: [],
    });
    await newClass.save();
    classId = newClass._id;

    const res = await request(app)
      .post(`/class/${classId}/add-student`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        studentId,
      });

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('message', 'Student added to class successfully');
  });

  // 7. Remove Student from Class (Sinfdan o'quvchini o'chirish)
  it('should remove a student from a class', async () => {
    const res = await request(app)
      .post(`/class/${classId}/remove-student`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        studentId,
      });

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('message', 'Student removed from class successfully');
  });
});

after(async () => {
  try {
    await mongoose.connection.dropDatabase(); // Test maʼlumotlar bazasini tozalash
    await mongoose.connection.close();
    console.log('Test database closed.');
  } catch (err) {
    console.error('Error closing test database:', err);
  }
});
