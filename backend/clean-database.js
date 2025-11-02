// Clean up database - remove orphaned payments
const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Student = require('./models/Student');
const ExamPass = require('./models/ExamPass');

require('dotenv').config();

async function cleanDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/student_management');
    console.log('✅ Connected to MongoDB\n');
    
    // Check students
    const studentCount = await Student.countDocuments();
    console.log(`📊 Students in database: ${studentCount}`);
    
    // Check payments
    const paymentCount = await Payment.countDocuments();
    console.log(`📊 Payments in database: ${paymentCount}`);
    
    // Check exam passes
    const passCount = await ExamPass.countDocuments();
    console.log(`📊 Exam passes in database: ${passCount}\n`);
    
    if (paymentCount > 0 && studentCount === 0) {
      console.log('⚠️ Found payments but no students - these payments reference deleted students!');
      console.log('\nDeleting orphaned payments...');
      const result = await Payment.deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} orphaned payment(s)`);
    }
    
    if (passCount > 0 && studentCount === 0) {
      console.log('\nDeleting orphaned exam passes...');
      const result = await ExamPass.deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} orphaned exam pass(es)`);
    }
    
    // Final counts
    console.log('\n📊 Final Database State:');
    console.log(`   Students: ${await Student.countDocuments()}`);
    console.log(`   Payments: ${await Payment.countDocuments()}`);
    console.log(`   Exam Passes: ${await ExamPass.countDocuments()}`);
    
    console.log('\n✅ Database cleaned! You can now:');
    console.log('   1. Add new students through the UI');
    console.log('   2. Submit new payments');
    console.log('   3. Generate exam passes');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  }
}

cleanDatabase();
