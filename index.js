const app = require('./app')
const mongoose = require('mongoose')

const mongoURL =
  process.env.NODE_ENV === 'production'
    ? process.env.MONGO_PROD_URL || 'your-production-mongo-url'
    : process.env.MONGO_DEV_URL || 'mongodb://127.0.0.1:27017/testdb'

const PORT = process.env.PORT || 3000

mongoose
  .connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('MongoDB ulanishi muvaffaqiyatli amalga oshirildi')
    app.listen(PORT, () => {
      console.log(`Server ${PORT}-portda ishlamoqda`)
    })
  })
  .catch(err => console.error('MongoDB ulanishida xatolik yuz berdi:', err))
