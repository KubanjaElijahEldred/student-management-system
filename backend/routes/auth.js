// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '.jpg');
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

function makeUserDTO(u) {
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    photoUrl: u.photoPath ? `/uploads/${path.basename(u.photoPath)}` : null,
    createdAt: u.createdAt,
  };
}

router.post('/register', upload.single('photo'), async (req, res) => {
  try {
    console.log('📝 Registration request received:');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, error: 'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const photoPath = req.file ? req.file.path : undefined;
    const user = await User.create({ name, email, passwordHash, photoPath, role: ['admin','teacher','student'].includes(role) ? role : undefined });
    const token = jwt.sign({ sub: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    const userDTO = makeUserDTO(user);
    console.log('✅ User created successfully:', { email, role });
    console.log('👤 User DTO being sent to client:', userDTO);
    res.json({ success: true, user: userDTO, token });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database temporarily unavailable. Please try again in a moment.' 
      });
    }
    
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email }).maxTimeMS(5000);
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const token = jwt.sign({ sub: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.json({ success: true, user: makeUserDTO(user), token });
  } catch (err) {
    console.error('Login error:', err);
    if (err.name === 'MongooseServerSelectionError' || err.message.includes('buffering timed out')) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database temporarily unavailable. Please try again in a moment.' 
      });
    }
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

module.exports = router;
