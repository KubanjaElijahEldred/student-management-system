// models/Student.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudentSchema = new Schema({
  name: { type: String, required: true },
  registrationNo: { type: String, unique: true, sparse: true },
  studentNumber: { type: Number }, // Sequential number
  age: Number,
  gender: String,
  dob: Date,
  contact: {
    phone: String,
    email: String,
    address: String
  },
  course_ids: [{ type: Number, ref: 'Course' }],
  courses: [String],
  photoPath: { type: String }
}, { timestamps: true });

function pad(n, len=3){ return String(n).padStart(len,'0'); }

StudentSchema.pre('save', async function(next){
  if (!this.registrationNo) {
    try {
      const currentYear = new Date().getFullYear();
      const Student = this.constructor;
      const Course = require('mongoose').model('Course');
      
      let courseCode = 'GEN'; // Default if no course
      
      // Get the first course and its code
      if (this.course_ids && this.course_ids.length > 0) {
        const courseId = this.course_ids[0];
        const course = await Course.findById(courseId);
        if (course && course.code) {
          courseCode = course.code.toUpperCase().substring(0, 3); // Max 3 chars
        }
      }
      
      // Find the highest student number for this year and course code
      const shortYear = String(currentYear).slice(-2); // Last 2 digits of year
      // Escape slashes for regex pattern
      const pattern = new RegExp(`^${shortYear}/${courseCode}/`);
      const existingStudents = await Student.find({ 
        registrationNo: pattern 
      }).sort({ studentNumber: -1 }).limit(1);
      
      const nextNumber = existingStudents.length > 0 
        ? (existingStudents[0].studentNumber || 0) + 1 
        : 1;
      
      this.studentNumber = nextNumber;
      // Format: YY/CCC/nnn (e.g., 25/BSE/001)
      this.registrationNo = `${shortYear}/${courseCode}/${pad(nextNumber, 3)}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Student', StudentSchema);
