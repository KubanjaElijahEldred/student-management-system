// models/Payment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  semester: { type: String, required: true },
  academicYear: { type: String, required: true },
  
  // Payment details
  amount: { type: Number, required: true },
  paymentType: { 
    type: String, 
    required: true,
    enum: ['Tuition Fee', 'Exam Fee', 'Registration Fee', 'Library Fee', 'Other']
  },
  
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Mobile Money', 'Cheque', 'Online Payment'],
    required: true
  },
  
  // Transaction details
  transactionReference: { type: String },
  receiptNumber: { type: String, unique: true },
  
  // Approval workflow
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Rejected'],
    default: 'Pending'
  },
  
  // Financial department details
  confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: { type: Date },
  rejectionReason: { type: String },
  
  // Additional info
  description: { type: String },
  attachmentUrl: { type: String }, // For receipt/proof uploads
  
  // Exam pass generation flag
  examPassGenerated: { type: Boolean, default: false },
  examPassId: { type: Schema.Types.ObjectId, ref: 'ExamPass' }
  
}, { timestamps: true });

// Generate receipt number before saving
PaymentSchema.pre('save', async function(next) {
  if (!this.receiptNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Payment').countDocuments();
    this.receiptNumber = `RCP-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);
