// models/Attendance.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AttendanceSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student' },
  course_id: { type: Number, ref: 'Course' },
  date: Date,
  present: Boolean
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
