// add-course-codes.js - Add codes to existing courses
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function addCourseCodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/schoolDB');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');

    // Get all courses
    const courses = await coursesCollection.find({}).toArray();
    console.log(`\nFound ${courses.length} courses`);

    // Suggested course codes based on common patterns
    const suggestedCodes = {
      'math': 'MAT',
      'mathematics': 'MAT',
      'science': 'SCI',
      'english': 'ENG',
      'physics': 'PHY',
      'chemistry': 'CHE',
      'biology': 'BIO',
      'computer': 'CSE',
      'software': 'BSE',
      'engineering': 'ENG',
      'business': 'BUS',
      'economics': 'ECO',
      'history': 'HIS',
      'geography': 'GEO',
    };

    for (const course of courses) {
      if (!course.code) {
        // Try to suggest a code based on course name
        let suggestedCode = 'GEN';
        const courseName = (course.name || '').toLowerCase();
        
        for (const [keyword, code] of Object.entries(suggestedCodes)) {
          if (courseName.includes(keyword)) {
            suggestedCode = code;
            break;
          }
        }

        // If no match, use first 3 letters of course name
        if (suggestedCode === 'GEN' && course.name && course.name.length >= 3) {
          suggestedCode = course.name.substring(0, 3).toUpperCase();
        }

        // Update the course
        await coursesCollection.updateOne(
          { _id: course._id },
          { $set: { code: suggestedCode } }
        );
        console.log(`✓ Course ID ${course._id} "${course.name}" → Code: ${suggestedCode}`);
      } else {
        console.log(`- Course ID ${course._id} "${course.name}" already has code: ${course.code}`);
      }
    }

    console.log('\n✓ All courses updated with codes!');
    console.log('\nNow run: node fix-indexes.js');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

addCourseCodes();
