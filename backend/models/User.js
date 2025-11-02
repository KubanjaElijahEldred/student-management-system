// models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  photoPath: { type: String },
  role: { type: String, enum: ['admin','teacher','student'], default: 'student' },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
