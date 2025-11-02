// models/Enrollment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EnrollmentSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  semester: { type: String, required: true },
  course_ids: [{ type: Number, ref: 'Course' }],
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
