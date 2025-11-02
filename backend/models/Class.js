// models/Class.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClassSchema = new Schema({
  name: { type: String, required: true },
  department: { type: String },
  year: { type: Number },
  section: { type: String },
  student_ids: [{ type: Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);
