// models/Result.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Subject schema for 8 subjects
const SubjectSchema = new Schema({
  name: { type: String, required: true },
  marks: { type: Number, required: true, min: 0, max: 100 },
  grade: { type: String },
  remarks: { type: String }
}, { _id: false });

const ResultSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  semester: { type: String, required: true }, // e.g., "Semester 1, Year 1"
  academicYear: { type: String, required: true }, // e.g., "2024/2025"
  
  // 8 Subjects with marks
  subjects: {
    type: [SubjectSchema],
    validate: [arrayLimit, '{PATH} must have exactly 8 subjects']
  },
  
  // Calculated fields
  totalMarks: { type: Number },
  averageMarks: { type: Number },
  overallGrade: { type: String },
  gpa: { type: Number },
  status: { type: String, enum: ['Pass', 'Fail', 'Pending'], default: 'Pending' },
  remarks: { type: String }
}, { timestamps: true });

// Validator to ensure exactly 8 subjects
function arrayLimit(val) {
  return val.length === 8;
}

// Auto-calculate grades before saving
ResultSchema.pre('save', function(next) {
  if (this.subjects && this.subjects.length === 8) {
    // Calculate grade for each subject
    this.subjects.forEach(subject => {
      subject.grade = calculateGrade(subject.marks);
    });
    
    // Calculate totals
    this.totalMarks = this.subjects.reduce((sum, s) => sum + s.marks, 0);
    this.averageMarks = this.totalMarks / 8;
    this.overallGrade = calculateGrade(this.averageMarks);
    this.gpa = calculateGPA(this.averageMarks);
    
    // Determine pass/fail status (pass if all subjects >= 40)
    const allPassed = this.subjects.every(s => s.marks >= 40);
    this.status = allPassed ? 'Pass' : 'Fail';
  }
  next();
});

// Grading function based on marks
function calculateGrade(marks) {
  if (marks >= 90) return 'A+';
  if (marks >= 80) return 'A';
  if (marks >= 75) return 'B+';
  if (marks >= 70) return 'B';
  if (marks >= 65) return 'C+';
  if (marks >= 60) return 'C';
  if (marks >= 55) return 'D+';
  if (marks >= 50) return 'D';
  if (marks >= 40) return 'E';
  return 'F'; // Fail
}

// GPA calculation (4.0 scale)
function calculateGPA(averageMarks) {
  if (averageMarks >= 90) return 4.0;
  if (averageMarks >= 80) return 3.7;
  if (averageMarks >= 75) return 3.3;
  if (averageMarks >= 70) return 3.0;
  if (averageMarks >= 65) return 2.7;
  if (averageMarks >= 60) return 2.3;
  if (averageMarks >= 55) return 2.0;
  if (averageMarks >= 50) return 1.7;
  if (averageMarks >= 40) return 1.0;
  return 0.0; // Fail
}

module.exports = mongoose.model('Result', ResultSchema);
