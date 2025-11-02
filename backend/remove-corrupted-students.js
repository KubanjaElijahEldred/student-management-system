// Remove students without _id field
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function cleanupCorruptedStudents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/schoolDB');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');

    // Find students without _id
    const corruptedStudents = await studentsCollection.find({ _id: { $exists: false } }).toArray();
    
    if (corruptedStudents.length === 0) {
      console.log('✅ No corrupted students found');
    } else {
      console.log(`⚠️  Found ${corruptedStudents.length} corrupted student(s):`);
      corruptedStudents.forEach(s => console.log(`   - ${s.name || 'Unknown'}`));
      
      // Delete corrupted students
      const result = await studentsCollection.deleteMany({ _id: { $exists: false } });
      console.log(`✅ Removed ${result.deletedCount} corrupted student(s)`);
    }

    await mongoose.connection.close();
    console.log('✅ Database cleanup complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

cleanupCorruptedStudents();
