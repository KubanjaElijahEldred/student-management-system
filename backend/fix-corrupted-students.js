// Fix corrupted students without _id
const mongoose = require('mongoose');
const Student = require('./models/Student');

require('dotenv').config();

async function fixCorruptedStudents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/student_management');
    console.log('✅ Connected to MongoDB\n');
    
    // Find all students
    const allStudents = await Student.find();
    console.log(`Total students in database: ${allStudents.length}\n`);
    
    // Check for students without _id
    const corrupted = allStudents.filter(s => !s._id);
    
    if (corrupted.length === 0) {
      console.log('✅ No corrupted students found!');
    } else {
      console.log(`❌ Found ${corrupted.length} corrupted student(s):\n`);
      corrupted.forEach((s, i) => {
        console.log(`${i + 1}. Name: ${s.name || 'Unknown'}`);
        console.log(`   Age: ${s.age || 'N/A'}`);
        console.log(`   Gender: ${s.gender || 'N/A'}`);
        console.log(`   Reg No: ${s.registrationNo || 'N/A'}`);
        console.log('');
      });
      
      console.log('\n⚠️ These students have no _id and should be deleted or recreated.');
      console.log('\nTo delete them, run: db.students.deleteMany({ _id: { $exists: false } })');
      console.log('Or recreate them through the UI with proper data.');
    }
    
    // List all valid students
    const valid = allStudents.filter(s => s._id);
    console.log(`\n✅ Valid students (${valid.length}):`);
    valid.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name} (${s.registrationNo || 'No Reg No'}) - ID: ${s._id}`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  }
}

fixCorruptedStudents();
