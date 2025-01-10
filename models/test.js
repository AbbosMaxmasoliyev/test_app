const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    title: { type: String, required: true },
    encodedData: { type: String, required: true },
});

module.exports = mongoose.model('Test', testSchema);
