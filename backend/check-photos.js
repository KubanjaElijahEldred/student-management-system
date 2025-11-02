// Check Photo URLs in Database
const mongoose = require('mongoose');
const Student = require('./models/Student');
const path = require('path');

require('dotenv').config();

async function checkPhotos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/student_management');
    console.log('✅ Connected to MongoDB\n');
    
    const students = await Student.find().limit(5);
    console.log(`Found ${students.length} students (showing first 5):\n`);
    
    students.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name} (${s.registrationNo})`);
      console.log(`   photoPath: ${s.photoPath || 'NULL'}`);
      if (s.photoPath) {
        const filename = path.basename(s.photoPath);
        console.log(`   photoUrl should be: /uploads/${filename}`);
      }
      console.log('');
    });
    
    console.log('\n📸 Check if these URLs work in browser:');
    students.forEach(s => {
      if (s.photoPath) {
        const filename = path.basename(s.photoPath);
        console.log(`http://localhost:8080/uploads/${filename}`);
      }
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  }
}

checkPhotos();
