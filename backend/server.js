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
  // Start server FIRST, then try MongoDB
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log('Attempting to connect to MongoDB...');
  });

  // Try to connect to MongoDB (but don't stop server if it fails)
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/schoolDB');
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('⚠️  Server is running but database features will not work!');
    console.error('📌 To fix: Start MongoDB service or install MongoDB');
    console.error('');
    
    // Retry connection every 10 seconds
    setInterval(async () => {
      try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/schoolDB');
        console.log('✅ Connected to MongoDB');
      } catch (e) {
        // Silent retry
      }
    }, 10000);
  }
}

start();
