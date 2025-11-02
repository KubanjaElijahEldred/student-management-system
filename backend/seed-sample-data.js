// Seed database with sample students, courses, teachers
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Course = require('./models/Course');
const Teacher = require('./models/Teacher');
const Payment = require('./models/Payment');
const ExamPass = require('./models/ExamPass');

require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/student_management');
    console.log('✅ Connected to MongoDB\n');
    
    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await Payment.deleteMany({});
    await ExamPass.deleteMany({});
    await Student.deleteMany({});
    await Course.deleteMany({});
    await Teacher.deleteMany({});
    console.log('✅ Cleaned\n');
    
    // Add Courses
    console.log('📚 Adding courses...');
    const courses = await Course.insertMany([
      { _id: 101, code: 'BSE', name: 'Bachelor of Software Engineering' },
      { _id: 102, code: 'BCS', name: 'Bachelor of Computer Science' },
      { _id: 103, code: 'BIT', name: 'Bachelor of Information Technology' },
      { _id: 104, code: 'DAI', name: 'Diploma in Artificial Intelligence' }
    ]);
    console.log(`✅ Added ${courses.length} courses\n`);
    
    // Add Teachers
    console.log('👨‍🏫 Adding teachers...');
    const teachers = await Teacher.insertMany([
      { name: 'Dr. John Smith', subject: 'Software Engineering' },
      { name: 'Prof. Jane Doe', subject: 'Database Systems' },
      { name: 'Mr. Mike Johnson', subject: 'Web Development' }
    ]);
    console.log(`✅ Added ${teachers.length} teachers\n`);
    
    // Add Students
    console.log('👥 Adding students...');
    const students = await Student.insertMany([
      { 
        name: 'Sarah Williams', 
        age: 20, 
        gender: 'female', 
        course_ids: [104],
        courses: ['Diploma in Artificial Intelligence']
      },
      { 
        name: 'Cyrus Kabanja', 
        age: 22, 
        gender: 'male', 
        course_ids: [104],
        courses: ['Diploma in Artificial Intelligence']
      },
      { 
        name: 'Alice Johnson', 
        age: 21, 
        gender: 'female', 
        course_ids: [101],
        courses: ['Bachelor of Software Engineering']
      },
      { 
        name: 'Bob Smith', 
        age: 23, 
        gender: 'male', 
        course_ids: [102],
        courses: ['Bachelor of Computer Science']
      },
      { 
        name: 'Emma Davis', 
        age: 20, 
        gender: 'female', 
        course_ids: [103],
        courses: ['Bachelor of Information Technology']
      }
    ]);
    console.log(`✅ Added ${students.length} students\n`);
    
    // Display added students with registration numbers
    console.log('📋 Students Added:');
    students.forEach(s => {
      console.log(`   - ${s.name} (${s.registrationNo}) - ${s.courses[0]}`);
    });
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Students: ${students.length}`);
    console.log(`   Courses: ${courses.length}`);
    console.log(`   Teachers: ${teachers.length}`);
    console.log('\n🎯 Next Steps:');
    console.log('   1. Refresh your browser (Ctrl + F5)');
    console.log('   2. Go to Students page - you should see 5 students');
    console.log('   3. Go to Payments - submit an Exam Fee payment');
    console.log('   4. Confirm it - exam pass will generate!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  }
}

seedDatabase();
