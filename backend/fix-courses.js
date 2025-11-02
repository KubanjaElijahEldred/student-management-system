// Fix courses - remove old numeric ID courses and add new ones with ObjectIds
const mongoose = require('mongoose');
const Course = require('./models/Course');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-management';

async function fixCourses() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Remove ALL old courses with numeric IDs
    console.log('\n🧹 Removing old courses...');
    const deleteResult = await Course.deleteMany({});
    console.log(`✅ Removed ${deleteResult.deletedCount} old courses`);
    
    // Add new courses with proper structure
    console.log('\n📚 Adding new courses...');
    const newCourses = [
      {
        name: 'Bachelor of Software Engineering',
        code: 'BSE',
        credits: 120,
        description: 'Comprehensive software engineering program'
      },
      {
        name: 'Diploma in Artificial Intelligence',
        code: 'DAI',
        credits: 90,
        description: 'AI and machine learning fundamentals'
      },
      {
        name: 'Certificate in Web Development',
        code: 'CWD',
        credits: 60,
        description: 'Modern web development technologies'
      },
      {
        name: 'Bachelor of Computer Science',
        code: 'BCS',
        credits: 120,
        description: 'Core computer science principles'
      },
      {
        name: 'Diploma in Data Science',
        code: 'DDS',
        credits: 90,
        description: 'Data analysis and visualization'
      },
      {
        name: 'Certificate in Cybersecurity',
        code: 'CCS',
        credits: 60,
        description: 'Network security and ethical hacking'
      }
    ];
    
    const insertedCourses = await Course.insertMany(newCourses);
    console.log(`✅ Added ${insertedCourses.length} new courses`);
    
    console.log('\n📋 New Courses:');
    insertedCourses.forEach((course, index) => {
      console.log(`   ${index + 1}. ${course.name} (${course.code}) - ID: ${course._id}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('\n🎉 Courses fixed! Now:');
    console.log('   1. Restart your server (Ctrl+C then npm start)');
    console.log('   2. Refresh browser (Ctrl+Shift+R)');
    console.log('   3. Go to Courses page');
    console.log('   4. Try adding/editing/deleting courses');
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fixCourses();
