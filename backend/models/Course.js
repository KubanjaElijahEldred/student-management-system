// models/Course.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true }, // Course abbreviation (e.g., BSE, CSE, ENG)
  teacher_id: { type: Schema.Types.ObjectId, ref: 'Teacher' },
  credits: { type: Number, default: 3 },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);
