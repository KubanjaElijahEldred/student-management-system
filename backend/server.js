// server.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');
const queryRoutes = require('./routes/queries');
const authRoutes = require('./routes/auth');

const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true })); // parse form POST
app.use(express.json());

// serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));
// serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes (CRUD)
app.use('/api', apiRoutes);
// Query routes
app.use('/api/queries', queryRoutes);
// Auth routes
app.use('/api/auth', authRoutes);

// fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

async function start() {
  // Connect to MongoDB FIRST
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/schoolDB', {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      bufferCommands: false
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('⚠️  Server will start but database features will not work!');
    console.error('📌 To fix: Check MongoDB connection string and network');
    console.error('');
  }

  // Start server AFTER MongoDB connection attempt
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️  Database not connected - login will not work');
    }
  });
}

start();
