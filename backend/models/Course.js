// models/Course.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  _id: Number,
  name: { type: String, required: true },
  code: { type: String, required: true }, // Course abbreviation (e.g., BSE, CSE, ENG)
  teacher_id: { type: Number, ref: 'Teacher' }
});

module.exports = mongoose.model('Course', CourseSchema);
