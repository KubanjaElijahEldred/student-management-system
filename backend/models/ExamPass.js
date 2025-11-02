// models/ExamPass.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExamPassSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  payment_id: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  
  // Exam details
  semester: { type: String, required: true },
  academicYear: { type: String, required: true },
  examType: { 
    type: String, 
    enum: ['Mid-Term', 'End-Term', 'Final', 'Supplementary'],
    default: 'End-Term'
  },
  
  // Pass details
  passNumber: { type: String, unique: true },
  issueDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Revoked', 'Used'],
    default: 'Active'
  },
  
  // Issued by (financial staff who confirmed payment)
  issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // Additional info
  notes: { type: String },
  qrCode: { type: String }, // For digital verification
  
}, { timestamps: true });

// Generate exam pass number before saving
ExamPassSchema.pre('save', async function(next) {
  if (!this.passNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('ExamPass').countDocuments();
    this.passNumber = `EP-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Set expiry date (default: 90 days from issue)
  if (!this.expiryDate) {
    const issueDate = this.issueDate || new Date();
    this.expiryDate = new Date(issueDate);
    this.expiryDate.setDate(this.expiryDate.getDate() + 90);
  }
  
  next();
});

// Method to check if exam pass is valid
ExamPassSchema.methods.isValid = function() {
  return this.status === 'Active' && new Date() < this.expiryDate;
};

module.exports = mongoose.model('ExamPass', ExamPassSchema);
