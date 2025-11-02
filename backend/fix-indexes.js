// fix-indexes.js - Run this script to fix database indexes after field rename
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/schoolDB');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');

    // Get current indexes
    const indexes = await studentsCollection.indexes();
    console.log('\nCurrent indexes:', JSON.stringify(indexes, null, 2));

    // Drop old studentId index if it exists
    try {
      await studentsCollection.dropIndex('studentId_1');
      console.log('\n✓ Dropped old studentId index');
    } catch (err) {
      if (err.code === 27) {
        console.log('\n- studentId index does not exist (already removed)');
      } else {
        console.log('\n- Could not drop studentId index:', err.message);
      }
    }

    // Ensure the new registrationNo index is sparse
    try {
      await studentsCollection.createIndex(
        { registrationNo: 1 }, 
        { unique: true, sparse: true, background: true }
      );
      console.log('✓ Created/updated registrationNo sparse unique index');
    } catch (err) {
      console.log('- Index already exists or error:', err.message);
    }

    // Update all existing students to have registrationNo if they don't
    // Find students with old format (starts with 4-digit year like 2025) OR no registration number
    const studentsToUpdate = await studentsCollection.find({
      $or: [
        { registrationNo: { $exists: false } }, 
        { registrationNo: null }, 
        { registrationNo: '' },
        { registrationNo: /^20\d{2}\// } // Matches old format starting with 2024, 2025, etc.
      ]
    }).toArray();

    console.log(`\nFound ${studentsToUpdate.length} students to update to new format (YY/CCC/nnn)`);

    // Track student numbers per year/course combination
    const counters = {};

    const coursesCollection = db.collection('courses');
    
    for (const student of studentsToUpdate) {
      const currentYear = new Date().getFullYear();
      
      let courseCode = 'GEN'; // Default if no course
      
      // Get the first course and its code
      if (student.course_ids && student.course_ids.length > 0) {
        const courseId = student.course_ids[0];
        const course = await coursesCollection.findOne({ _id: courseId });
        if (course && course.code) {
          courseCode = course.code.toUpperCase().substring(0, 3);
        }
      }
      
      const shortYear = String(currentYear).slice(-2); // Last 2 digits
      const key = `${shortYear}/${courseCode}`;
      
      // Initialize counter for this year/course combination
      if (!counters[key]) {
        // Find existing students with this pattern
        const pattern = new RegExp(`^${shortYear}/${courseCode}/`);
        const existing = await studentsCollection.find({ 
          registrationNo: pattern 
        }).sort({ studentNumber: -1 }).limit(1).toArray();
        
        counters[key] = existing.length > 0 ? (existing[0].studentNumber || 0) : 0;
      }
      
      // Increment counter
      counters[key]++;
      const studentNumber = counters[key];
      // Format: YY/CCC/nnn (e.g., 25/BSE/001)
      const regNo = `${shortYear}/${courseCode}/${String(studentNumber).padStart(3, '0')}`;

      await studentsCollection.updateOne(
        { _id: student._id },
        { $set: { 
          registrationNo: regNo,
          studentNumber: studentNumber 
        } }
      );
      const oldRegNo = student.registrationNo || 'none';
      console.log(`  Updated student ${student.name}: ${oldRegNo} -> ${regNo}`);
    }

    console.log('\n✓ Student indexes fixed successfully!');
    
    // Fix Enrollment indexes
    console.log('\n--- Fixing Enrollment Indexes ---');
    const enrollmentsCollection = db.collection('enrollments');
    
    const enrollIndexes = await enrollmentsCollection.indexes();
    console.log('Current enrollment indexes:', JSON.stringify(enrollIndexes, null, 2));
    
    // Ensure registrationNo index is sparse
    try {
      await enrollmentsCollection.createIndex(
        { registrationNo: 1 }, 
        { unique: true, sparse: true, background: true }
      );
      console.log('✓ Created/updated enrollment registrationNo sparse unique index');
    } catch (err) {
      console.log('- Enrollment index already exists or error:', err.message);
    }

    console.log('\n✓ All database indexes fixed successfully!');
    console.log('\nFinal student indexes:');
    const finalIndexes = await studentsCollection.indexes();
    console.log(JSON.stringify(finalIndexes, null, 2));
    
    console.log('\nFinal enrollment indexes:');
    const finalEnrollIndexes = await enrollmentsCollection.indexes();
    console.log(JSON.stringify(finalEnrollIndexes, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error fixing indexes:', err);
    process.exit(1);
  }
}

fixIndexes();
