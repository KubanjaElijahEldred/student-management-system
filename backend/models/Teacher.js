// models/Teacher.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeacherSchema = new Schema({
  _id: Number,
  name: String,
  subject: String,
  photoPath: { type: String }
});

module.exports = mongoose.model('Teacher', TeacherSchema);
