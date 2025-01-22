const request = require('supertest');
const app = require('../app.js'); // Yo'lni mos ravishda sozlang
const { expect } = require('chai');
const mongoose = require('mongoose');

before(async () => {
  try {
    await mongoose.connect(process.env.MONGO_TEST_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Test maʼlumotlar bazasiga ulanish muvaffaqiyatli.');
  } catch (err) {
    console.error('Test maʼlumotlar bazasiga ulanishda xatolik:', err);
  }
});

describe('Auth Routes', () => {
  // Foydalanuvchini ro'yxatdan o'tkazish testi
  it('should register a new user', async () => {
    const res = await request(app).post('/auth/signup').send({
      first_name: 'Otajon Teacher 2',
      last_name: 'Makxmasoliyev',
      username: 'otajon_teacher2',
      password: 'qaqnus3112!',
      role: 'teacher',
    });

    expect(res.statusCode).to.equal(201);
    expect(res.body).to.have.property('message', 'Teacher registered successfully');
  });

  // Foydalanuvchini tizimga kiritish testi
  it('should login a user', async () => {
    const res = await request(app).post('/auth/login').send({
      username: 'otajon_teacher2',
      password: 'qaqnus3112!',
    });

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('token');
    expect(res.body).to.have.property('user');
  });

  // Noto'g'ri login uchun xato qaytarish testi
  it('should return 401 for invalid login', async () => {
    const res = await request(app).post('/auth/login').send({
      username: 'otajon_teacher2',
      password: 'qaqnus3112',
    });

    expect(res.statusCode).to.equal(401);
    expect(res.body).to.have.property('message', 'Invalid credentials');
  });

  // Foydalanuvchi profilini olish testi
  it('should fetch user profile', async () => {
    const loginRes = await request(app).post('/auth/login').send({
      username: 'otajon_teacher2',
      password: 'qaqnus3112!',
    });
    const token = loginRes.body.token;

    const res = await request(app)
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('user');
  });

  // Token yo'q holda profil olish uchun xato qaytarish testi
  it('should return 401 for fetching profile without token', async () => {
    const res = await request(app).get('/auth/profile');

    expect(res.statusCode).to.equal(401);
  });
});

after(async () => {
  try {
    await mongoose.connection.dropDatabase(); // Testdan keyin maʼlumotlar bazasini tozalash
    await mongoose.connection.close();
    console.log('Test maʼlumotlar bazasi yopildi.');
  } catch (err) {
    console.error('Test maʼlumotlar bazasini yopishda xatolik:', err);
  }
});
