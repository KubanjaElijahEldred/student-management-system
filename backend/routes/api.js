// routes/api.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roles');

const Student = require('../models/Student');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Result = require('../models/Result');
const Attendance = require('../models/Attendance');
const ClassModel = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const ExamPass = require('../models/ExamPass');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({ storage });

function withPhotoUrl(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, photoUrl: obj.photoPath ? `/uploads/${path.basename(obj.photoPath)}` : null };
}

/* Students */
// create student from form (multipart) or JSON
router.post('/students', authRequired, upload.single('photo'), async (req, res) => {
  try {
    const payload = req.body;
    // Handle course_ids from FormData (comes as array of strings - MongoDB ObjectIds)
    if (payload.course_ids) {
      if (!Array.isArray(payload.course_ids)) {
        payload.course_ids = [payload.course_ids];
      }
      // Filter out empty strings but keep as strings (they're MongoDB ObjectIds)
      payload.course_ids = payload.course_ids.filter(id => id && String(id).trim());
    }
    if (req.file) payload.photoPath = req.file.path;
    
    // Auto-generate registration number if not provided
    if (!payload.registrationNo && payload.course_ids && payload.course_ids.length > 0) {
      try {
        // Get the first course to determine the course code
        const firstCourseId = payload.course_ids[0];
        console.log('🔍 Looking up course with ID:', firstCourseId, 'Type:', typeof firstCourseId);
        
        // Try to find course by _id (MongoDB ObjectId)
        let course = null;
        try {
          course = await Course.findById(firstCourseId);
        } catch (e) {
          console.log('⚠️ Course lookup by ID failed:', e.message);
        }
        
        console.log('📚 Found course:', course ? `${course.name} (${course.code})` : 'NOT FOUND');
        
        // Use course code if found, otherwise default to 'GEN' for General
        const courseCode = (course && course.code) ? course.code.toLowerCase() : 'gen';
        const year = new Date().getFullYear().toString().slice(-2); // Last 2 digits of year (e.g., 25)
        
        // Find the highest sequential number for this course code and year
        const regPattern = new RegExp(`^${year}/${courseCode}/\\d+$`, 'i');
        const existingStudents = await Student.find({ 
          registrationNo: regPattern 
        }).sort({ registrationNo: -1 }).limit(1);
        
        let sequentialNumber = 1;
        if (existingStudents.length > 0) {
          const lastReg = existingStudents[0].registrationNo;
          const match = lastReg.match(/\/(\d+)$/);
          if (match) {
            sequentialNumber = parseInt(match[1]) + 1;
          }
        }
        
        // Format: 25/bse/00001 (5 digits, zero-padded)
        const paddedNumber = String(sequentialNumber).padStart(3, '0');
        payload.registrationNo = `${year}/${courseCode.toUpperCase()}/${paddedNumber}`;
        
        console.log('✅ Generated registration number:', payload.registrationNo);
      } catch (err) {
        console.error('❌ Error generating registration number:', err);
        // Continue without registration number if generation fails
      }
    }
    
    const student = new Student(payload);
    await student.save();
    res.json({ success: true, student: withPhotoUrl(student) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/students', authRequired, async (req, res) => {
  const students = await Student.find();
  res.json(students.map(withPhotoUrl));
});

router.get('/students/:id', authRequired, async (req, res) => {
  try {
    const s = await Student.findById(req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });
    res.json(withPhotoUrl(s));
  } catch (e) {
    res.status(400).json({ success: false, error: 'Invalid id' });
  }
});

router.delete('/students/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID exists and is not undefined
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    
    // Validate ID is a valid MongoDB ObjectId (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid student ID format' });
    }
    
    const result = await Student.deleteOne({ _id: id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/students/:id', authRequired, upload.single('photo'), async (req, res) => {
  try {
    const payload = req.body;
    if (req.file) payload.photoPath = req.file.path;
    // Handle comma-separated course_ids (MongoDB ObjectIds as strings)
    if (typeof payload.course_ids === 'string') {
      payload.course_ids = payload.course_ids
        .split(',')
        .map(s => String(s).trim())
        .filter(s => s);
    }
    // Handle contact fields sent as 'contact.phone', 'contact.email', 'contact.address'
    if (payload['contact.phone'] || payload['contact.email'] || payload['contact.address']) {
      payload.contact = {
        phone: payload['contact.phone'] || undefined,
        email: payload['contact.email'] || undefined,
        address: payload['contact.address'] || undefined
      };
      delete payload['contact.phone'];
      delete payload['contact.email'];
      delete payload['contact.address'];
    }
    const updated = await Student.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, student: withPhotoUrl(updated) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/* Courses */
router.post('/courses', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.json({ success: true, course });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
router.get('/courses', authRequired, async (req, res) => {
  const courses = await Course.find();
  res.json(courses);
});

// Update course
router.put('/courses/:id', authRequired, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, course });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete course
router.delete('/courses/:id', authRequired, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/* Teachers */
router.post('/teachers', authRequired, allowRoles('admin','teacher'), upload.single('photo'), async (req, res) => {
  try {
    const payload = { ...req.body };
    
    // Auto-generate _id if not provided or invalid
    if (!payload._id || Number.isNaN(Number(payload._id)) || Number(payload._id) <= 0) {
      // Find the highest existing teacher _id and add 1
      const maxTeacher = await Teacher.findOne().sort({ _id: -1 }).limit(1);
      payload._id = maxTeacher ? (Number(maxTeacher._id) + 1) : 201;
      console.log('Auto-generated teacher ID:', payload._id);
    } else {
      payload._id = Number(payload._id);
    }
    
    if (req.file) payload.photoPath = req.file.path;
    
    const teacher = new Teacher(payload);
    await teacher.save();
    res.json({ success: true, teacher: withPhotoUrl(teacher) });
  } catch (err) {
    console.error('Teacher save error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});
router.get('/teachers', authRequired, async (req, res) => {
  const teachers = await Teacher.find();
  res.json(teachers.map(withPhotoUrl));
});

router.put('/teachers/:id', authRequired, allowRoles('admin','teacher'), upload.single('photo'), async (req, res) => {
  try {
    const payload = req.body;
    if (req.file) payload.photoPath = req.file.path;
    const updated = await Teacher.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Teacher not found' });
    res.json({ success: true, teacher: withPhotoUrl(updated) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/teachers/:id', authRequired, allowRoles('admin'), async (req, res) => {
  try {
    const deleted = await Teacher.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Teacher not found' });
    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/* Classes */
router.post('/classes', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  try {
    const c = new ClassModel(req.body);
    await c.save();
    res.json({ success: true, class: c });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
router.get('/classes', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  const list = await ClassModel.find().sort({ createdAt: -1 });
  res.json(list);
});
router.put('/classes/:id', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  try {
    const updated = await ClassModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, class: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
router.delete('/classes/:id', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  await ClassModel.deleteOne({ _id: req.params.id });
  res.json({ success: true });
});

// class membership: add student
router.post('/classes/:id/students', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  try {
    const { student_id } = req.body;
    if (!student_id) return res.status(400).json({ success: false, error: 'student_id required' });
    const updated = await ClassModel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { student_ids: student_id } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, class: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// class membership: remove student
router.delete('/classes/:id/students/:studentId', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  try {
    const updated = await ClassModel.findByIdAndUpdate(
      req.params.id,
      { $pull: { student_ids: req.params.studentId } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, class: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/* Results & Attendance basic endpoints (create & list) */
// Create result with 8 subjects
router.post('/results', authRequired, async (req, res) => {
  try {
    const result = new Result(req.body);
    await result.save();
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get all results
router.get('/results', authRequired, async (req, res) => {
  try {
    const results = await Result.find().populate('student_id', 'name registrationNo photoUrl');
    res.json(results);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get results for a specific student
router.get('/results/student/:id', authRequired, async (req, res) => {
  try {
    const results = await Result.find({ student_id: req.params.id })
      .populate('student_id', 'name registrationNo photoUrl')
      .sort({ createdAt: -1 });
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update a result
router.put('/results/:id', authRequired, async (req, res) => {
  try {
    const resultId = req.params.id;
    const { semester, academicYear, subjects } = req.body;
    
    // Find the existing result
    const existingResult = await Result.findById(resultId);
    if (!existingResult) {
      return res.status(404).json({ success: false, error: 'Result not found' });
    }
    
    // Update fields
    if (semester) existingResult.semester = semester;
    if (academicYear) existingResult.academicYear = academicYear;
    if (subjects && Array.isArray(subjects)) existingResult.subjects = subjects;
    
    // Save will trigger the pre-save hook to recalculate grades
    await existingResult.save();
    
    res.json({ success: true, result: existingResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a result
router.delete('/results/:id', authRequired, async (req, res) => {
  try {
    await Result.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GPA/Result summary per student
router.get('/results/student/:id/summary', authRequired, async (req, res) => {
  try {
    const sid = req.params.id;
    const results = await Result.find({ student_id: sid }).sort({ createdAt: -1 });
    
    if (!results || results.length === 0) {
      return res.json({ 
        success: true,
        student_id: sid, 
        overallGPA: 0, 
        totalResults: 0,
        results: [],
        message: 'No results found for this student'
      });
    }
    
    // Calculate overall GPA from all semester results
    const totalGPA = results.reduce((sum, r) => sum + (r.gpa || 0), 0);
    const overallGPA = totalGPA / results.length;
    
    // Format results summary
    const summary = results.map(r => ({
      semester: r.semester,
      academicYear: r.academicYear,
      totalMarks: r.totalMarks,
      averageMarks: r.averageMarks,
      overallGrade: r.overallGrade,
      gpa: r.gpa,
      status: r.status,
      subjects: r.subjects
    }));
    
    res.json({ 
      success: true,
      student_id: sid, 
      overallGPA: overallGPA.toFixed(2),
      totalResults: results.length,
      results: summary
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/attendance', authRequired, async (req, res) => {
  const a = new Attendance(req.body);
  await a.save();
  res.json({ success: true, attendance: a });
});
router.get('/attendance', authRequired, async (req, res) => {
  const attendance = await Attendance.find();
  res.json(attendance);
});

router.put('/attendance/:id', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  try {
    const updated = await Attendance.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Attendance record not found' });
    res.json({ success: true, attendance: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/attendance/:id', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Attendance record not found' });
    res.json({ success: true, message: 'Attendance deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Attendance summary per student (optional filter by course)
router.get('/attendance/student/:id/summary', authRequired, async (req, res) => {
  const sid = req.params.id; // Accept ObjectId as string
  const courseFilter = req.query.course_id ? { course_id: Number(req.query.course_id) } : {};
  const list = await Attendance.find({ student_id: sid, ...courseFilter });
  const present = list.filter(a => !!a.present).length;
  const total = list.length;
  res.json({ student_id: sid, present, total, rate: total ? present / total : 0 });
});

/* Enrollments */
router.post('/enrollments', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  try {
    const payload = { ...req.body };
    // require student_id in payload (must refer to Student._id)
    if (!payload.student_id) {
      return res.status(400).json({ success: false, error: 'student_id is required' });
    }
    // normalize course_ids if provided as comma string
    if (typeof payload.course_ids === 'string') {
      payload.course_ids = payload.course_ids
        .split(',')
        .map(s => Number(String(s).trim()))
        .filter(n => !Number.isNaN(n));
    }
    const enrollment = new Enrollment(payload);
    await enrollment.save();
    res.json({ success: true, enrollment });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/enrollments', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  const list = await Enrollment.find({}).sort({ createdAt: -1 });
  res.json(list);
});

router.put('/enrollments/:id', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  try {
    const payload = req.body;
    if (typeof payload.course_ids === 'string') {
      payload.course_ids = payload.course_ids
        .split(',')
        .map(s => Number(String(s).trim()))
        .filter(n => !Number.isNaN(n));
    }
    const updated = await Enrollment.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, enrollment: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/enrollments/:id', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  try {
    const deleted = await Enrollment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Enrollment not found' });
    res.json({ success: true, message: 'Enrollment deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/* ============================================
   PAYMENT & EXAM PASS MANAGEMENT
   ============================================ */

// Get all payments
router.get('/payments', authRequired, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('student_id', 'name registrationNo')
      .populate('confirmedBy', 'username role')
      .populate('examPassId', 'passNumber expiryDate status')
      .sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get payments by student
router.get('/payments/student/:id', authRequired, async (req, res) => {
  try {
    const payments = await Payment.find({ student_id: req.params.id })
      .populate('confirmedBy', 'username role')
      .populate('examPassId', 'passNumber expiryDate status')
      .sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Create new payment
router.post('/payments', authRequired, async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.json({ success: true, payment, message: 'Payment submitted for approval' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Confirm payment (Financial department only)
router.post('/payments/:id/confirm', authRequired, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    if (payment.status !== 'Pending') {
      return res.status(400).json({ success: false, error: 'Payment already processed' });
    }
    
    // Confirm payment
    payment.status = 'Confirmed';
    payment.confirmedBy = req.user._id;
    payment.confirmedAt = new Date();
    await payment.save();
    
    // Generate exam pass if payment is for exam fee
    let examPass = null;
    if (payment.paymentType === 'Exam Fee' && !payment.examPassGenerated) {
      const examPassData = {
        student_id: payment.student_id,
        payment_id: payment._id,
        semester: payment.semester || 'N/A',
        academicYear: payment.academicYear || new Date().getFullYear().toString(),
        examType: req.body.examType || 'End-Term',
        notes: `Auto-generated from payment ${payment.receiptNumber}`
      };
      
      // Add issuedBy only if user is authenticated
      if (req.user && req.user._id) {
        examPassData.issuedBy = req.user._id;
      }
      
      examPass = new ExamPass(examPassData);
      await examPass.save();
      
      // Link exam pass to payment
      payment.examPassGenerated = true;
      payment.examPassId = examPass._id;
      await payment.save();
    }
    
    await payment.populate('student_id', 'name registrationNo');
    await payment.populate('examPassId');
    
    res.json({ 
      success: true, 
      payment, 
      examPass,
      message: examPass ? 'Payment confirmed and exam pass generated!' : 'Payment confirmed successfully'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Reject payment (Financial department only)
router.post('/payments/:id/reject', authRequired, allowRoles('admin', 'teacher'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    if (payment.status !== 'Pending') {
      return res.status(400).json({ success: false, error: 'Payment already processed' });
    }
    
    payment.status = 'Rejected';
    payment.confirmedBy = req.user._id;
    payment.confirmedAt = new Date();
    payment.rejectionReason = req.body.reason || 'No reason provided';
    await payment.save();
    
    await payment.populate('student_id', 'name registrationNo');
    
    res.json({ success: true, payment, message: 'Payment rejected' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Manually generate exam pass for confirmed payment
router.post('/payments/:id/generate-exam-pass', authRequired, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    if (payment.status !== 'Confirmed') {
      return res.status(400).json({ success: false, error: 'Payment must be confirmed first' });
    }
    
    if (payment.paymentType !== 'Exam Fee') {
      return res.status(400).json({ success: false, error: 'Payment is not for exam fee' });
    }
    
    if (payment.examPassGenerated) {
      return res.status(400).json({ success: false, error: 'Exam pass already generated for this payment' });
    }
    
    // Generate exam pass
    const examPassData = {
      student_id: payment.student_id,
      payment_id: payment._id,
      semester: payment.semester || 'N/A',
      academicYear: payment.academicYear || new Date().getFullYear().toString(),
      examType: req.body.examType || 'End-Term',
      notes: `Manually generated from payment ${payment.receiptNumber}`
    };
    
    // Add issuedBy only if user is authenticated
    if (req.user && req.user._id) {
      examPassData.issuedBy = req.user._id;
    }
    
    const examPass = new ExamPass(examPassData);
    await examPass.save();
    
    // Link exam pass to payment
    payment.examPassGenerated = true;
    payment.examPassId = examPass._id;
    await payment.save();
    
    await payment.populate('student_id', 'name registrationNo');
    await payment.populate('examPassId');
    
    res.json({ 
      success: true, 
      payment, 
      examPass,
      message: 'Exam pass generated successfully'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update payment
router.put('/payments/:id', authRequired, allowRoles('admin','teacher'), async (req, res) => {
  try {
    const updated = await Payment.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Payment not found' });
    res.json({ success: true, payment: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete payment
router.delete('/payments/:id', authRequired, allowRoles('admin'), async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ============ EXAM PASS ENDPOINTS ============

// Get all exam passes
router.get('/exam-passes', authRequired, async (req, res) => {
  try {
    const examPasses = await ExamPass.find()
      .populate('student_id', 'name registrationNo')
      .populate('payment_id')
      .populate('issuedBy', 'username role')
      .sort({ createdAt: -1 });
    res.json({ success: true, examPasses });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get exam passes by student
router.get('/exam-passes/student/:id', authRequired, async (req, res) => {
  try {
    const examPasses = await ExamPass.find({ student_id: req.params.id })
      .populate('payment_id')
      .populate('issuedBy', 'username role')
      .sort({ createdAt: -1 });
    res.json({ success: true, examPasses });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get single exam pass
router.get('/exam-passes/:id', authRequired, async (req, res) => {
  try {
    const examPass = await ExamPass.findById(req.params.id)
      .populate('student_id', 'name registrationNo age gender course_ids')
      .populate('payment_id')
      .populate('issuedBy', 'username role');
    if (!examPass) {
      return res.status(404).json({ success: false, error: 'Exam pass not found' });
    }
    res.json({ success: true, examPass, isValid: examPass.isValid() });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Revoke exam pass (Admin only)
router.post('/exam-passes/:id/revoke', authRequired, allowRoles('admin'), async (req, res) => {
  try {
    const examPass = await ExamPass.findById(req.params.id);
    if (!examPass) {
      return res.status(404).json({ success: false, error: 'Exam pass not found' });
    }
    examPass.status = 'Revoked';
    examPass.notes = (examPass.notes || '') + '\nRevoked: ' + (req.body.reason || 'No reason provided');
    await examPass.save();
    res.json({ success: true, examPass, message: 'Exam pass revoked' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Verify exam pass by pass number
router.get('/exam-passes/verify/:passNumber', authRequired, async (req, res) => {
  try {
    const examPass = await ExamPass.findOne({ passNumber: req.params.passNumber })
      .populate('student_id', 'name registrationNo')
      .populate('issuedBy', 'username role');
    
    if (!examPass) {
      return res.status(404).json({ success: false, error: 'Invalid exam pass number' });
    }
    
    const isValid = examPass.isValid();
    res.json({ 
      success: true, 
      examPass, 
      isValid,
      message: isValid ? 'Valid exam pass' : 'Exam pass is not valid (expired or revoked)'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
