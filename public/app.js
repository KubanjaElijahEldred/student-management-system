// app.js
const api = (path, opts) => fetch(`/api${path}`, opts).then(r => r.json());
function authHeaders() {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Role-based access control
const ROLE_RESTRICTIONS = {
  classesPanel: ['admin', 'teacher'],
  enrollmentPanel: ['admin', 'teacher']
};

function getUserRole() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
}

function canAccessPanel(panelId) {
  const requiredRoles = ROLE_RESTRICTIONS[panelId];
  if (!requiredRoles) return isAuthed(); // No restriction, just need to be logged in
  const userRole = getUserRole();
  return userRole && requiredRoles.includes(userRole);
}

const panelLoaders = {
  homePanel: () => { loadHome(); },
  studentsPanel: () => { loadStudents(); },
  coursesPanel: () => { loadCourses(); },
  teachersPanel: () => { loadTeachers(); },
  resultsPanel: () => { loadResults(); },
  attendancePanel: () => { loadAttendance(); },
  enrollmentPanel: () => { loadEnrollments(); },
  classesPanel: () => { loadClasses(); },
  authPanel: () => {},
};

const loadedPanels = new Set();

function showPanel(target) {
  // Check if user is logged in
  if (target !== 'authPanel' && !isAuthed()) {
    alert('Please login to access this page.');
    showPanel('authPanel');
    return;
  }
  
  // Check if user has role permission
  if (!canAccessPanel(target)) {
    const userRole = getUserRole();
    const requiredRoles = ROLE_RESTRICTIONS[target];
    alert(`Access Denied!\n\nYou need ${requiredRoles.join(' or ')} role to access this page.\nYour current role: ${userRole || 'unknown'}`);
    showPanel('homePanel');
    return;
  }
  
  document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
  const panel = document.getElementById(target);
  if (panel) panel.style.display = 'block';
  if (!loadedPanels.has(target) && panelLoaders[target]) {
    panelLoaders[target]();
    loadedPanels.add(target);
  }
  
  // Hide navigation on auth panel
  updateNavVisibility(target === 'authPanel');
}

function isAuthed() {
  return !!localStorage.getItem('token');
}

function updateNavVisibility(forceHide = false) {
  const nav = document.querySelector('.tabs');
  if (nav) {
    // Hide nav if forced (auth page) or if not authenticated
    nav.style.display = (forceHide || !isAuthed()) ? 'none' : 'flex';
  }
  
  // Update button states based on role
  const userRole = getUserRole();
  document.querySelectorAll('.tabs button').forEach(btn => {
    const target = btn.dataset.target;
    const requiredRoles = ROLE_RESTRICTIONS[target];
    
    if (requiredRoles && userRole && !requiredRoles.includes(userRole)) {
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
      btn.title = `Requires ${requiredRoles.join(' or ')} role`;
    } else {
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.title = '';
    }
  });
}

document.querySelectorAll('.tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    if (target !== 'authPanel' && !isAuthed()) {
      alert('Please login to access this page.');
      showPanel('authPanel');
      return;
    }
    showPanel(target);
  });
});

// forms
document.getElementById('addStudentForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData();
  const formData = new FormData(form);
  const courseIds = (formData.get('course_ids') || '')
    .split(',')
    .map(s => Number(String(s).trim()))
    .filter(n => !Number.isNaN(n));
  const sid = (formData.get('_id') || '').trim();
  if (sid) fd.append('_id', String(Number(sid)));
  fd.append('name', formData.get('name') || '');
  if (formData.get('age')) fd.append('age', String(Number(formData.get('age'))));
  if (formData.get('gender')) fd.append('gender', formData.get('gender'));
  // Send course_ids as multiple form fields (backend will receive as array)
  courseIds.forEach(id => fd.append('course_ids', id));
  const file = form.querySelector('input[name="photo"]').files[0];
  const dataUrl = form.querySelector('#studentPhotoData')?.value;
  if (file) {
    fd.append('photo', file);
  } else if (dataUrl) {
    const blob = (function dataURLtoBlob(dataurl){const arr=dataurl.split(',');const mime=arr[0].match(/:(.*?);/)[1];const bstr=atob(arr[1]);let n=bstr.length;const u8=new Uint8Array(n);while(n--)u8[n]=bstr.charCodeAt(n);return new Blob([u8],{type:mime});})(dataUrl);
    fd.append('photo', blob, 'student.jpg');
  }
  const res = await fetch('/api/students', { method: 'POST', headers: { ...authHeaders() }, body: fd });
  let json;
  try { json = await res.json(); } catch { json = { success: res.ok }; }
  if (!res.ok || !json.success) {
    alert(json?.error || 'Failed to add student. You may need admin/teacher role.');
    return;
  }
  e.target.reset();
  loadStudents();
  preloadReferences();
});

document.getElementById('addCourseForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const obj = { 
    name: fd.get('name'),
    code: (fd.get('code') || '').trim().toUpperCase()
  };
  const cid = (fd.get('_id') || '').trim();
  if (cid) obj._id = Number(cid);
  // resolve teacher input to ID (number) if possible
  const tval = (fd.get('teacher_id') || '').trim();
  if (tval) {
    const num = Number(tval);
    if (!Number.isNaN(num)) obj.teacher_id = num;
    else {
      const found = (REF.teachers || []).find(t => (t.name || '').toLowerCase() === tval.toLowerCase());
      if (found && typeof found._id !== 'undefined') obj.teacher_id = Number(found._id);
    }
  }
  await api('/courses', { method: 'POST', headers:{ 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify(obj) });
  e.target.reset();
  loadCourses();
  preloadReferences();
});

document.getElementById('addTeacherForm').addEventListener('submit', async e => {
  e.preventDefault();
  console.log('=== ADD TEACHER FORM SUBMITTED ===');
  
  const form = e.target;
  const formData = new FormData(form);
  const fd = new FormData();
  
  const name = formData.get('name') || '';
  const subject = formData.get('subject') || '';
  
  console.log('Teacher name:', name);
  console.log('Teacher subject:', subject);
  
  if (!name) {
    alert('❌ Please enter teacher name!');
    return;
  }
  
  // Don't send _id for new teachers - let it auto-generate
  // Only send _id if it's a valid positive number (for updates)
  const tid = (formData.get('_id') || '').trim();
  if (tid && !isNaN(Number(tid)) && Number(tid) > 0) {
    fd.append('_id', String(Number(tid)));
  }
  
  fd.append('name', name);
  if (subject) fd.append('subject', subject);
  
  const file = form.querySelector('input[name="photo"]').files[0];
  const dataUrl = form.querySelector('#teacherPhotoData')?.value;
  if (file) {
    fd.append('photo', file);
    console.log('Photo file attached:', file.name);
  } else if (dataUrl) {
    const blob = (function dataURLtoBlob(dataurl){const arr=dataurl.split(',');const mime=arr[0].match(/:(.*?);/)[1];const bstr=atob(arr[1]);let n=bstr.length;const u8=new Uint8Array(n);while(n--)u8[n]=bstr.charCodeAt(n);return new Blob([u8],{type:mime});})(dataUrl);
    fd.append('photo', blob, 'teacher.jpg');
    console.log('Photo from camera attached');
  }
  
  try {
    console.log('Sending request to /api/teachers...');
    const res = await fetch('/api/teachers', { method: 'POST', headers: { ...authHeaders() }, body: fd });
    
    console.log('Response status:', res.status);
    
    let json;
    try { 
      json = await res.json(); 
      console.log('Response data:', json);
    } catch { 
      json = { success: res.ok }; 
    }
    
    if (!res.ok || !json.success) {
      const errorMsg = json?.error || 'Failed to save teacher';
      console.error('❌ Error:', errorMsg);
      
      if (res.status === 403) {
        alert('❌ Permission Denied!\n\nYou need ADMIN or TEACHER role to add teachers.\n\nPlease login with an admin account.');
      } else if (res.status === 401) {
        alert('❌ Not Logged In!\n\nPlease login first.');
      } else {
        alert('❌ Failed to add teacher:\n\n' + errorMsg);
      }
      return;
    }
    
    console.log('✅ Teacher added successfully!');
    alert('✅ Teacher added successfully!');
    form.reset();
    
    // Clear camera snapshot if exists
    const snapshot = document.getElementById('teacherSnapshot');
    if (snapshot) snapshot.style.display = 'none';
    
    // refresh teachers table and datalists so new photo/name appear
    await loadTeachers();
    preloadReferences();
  } catch (err) {
    console.error('❌ Network error:', err);
    alert('❌ Network Error!\n\n' + err.message + '\n\nMake sure server is running!');
  }
});

document.getElementById('addResultForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const studentInput = fd.get('student_id') || '';
  const studentId = resolveStudentId(studentInput) || studentInput;
  
  // Collect all 8 subjects
  const subjects = [];
  for (let i = 1; i <= 8; i++) {
    subjects.push({
      name: fd.get(`subject${i}_name`),
      marks: Number(fd.get(`subject${i}_marks`))
    });
  }
  
  const obj = {
    student_id: studentId,
    semester: fd.get('semester'),
    academicYear: fd.get('academicYear'),
    subjects: subjects
  };
  
  const res = await fetch('/api/results', { 
    method: 'POST', 
    headers: {'Content-Type':'application/json', ...authHeaders()}, 
    body: JSON.stringify(obj) 
  });
  
  const json = await res.json();
  if (!json.success) { 
    alert(json.error || 'Failed to add result');
    return;
  }
  
  alert(`Result added successfully!\n\nTotal: ${json.result.totalMarks}/800\nAverage: ${json.result.averageMarks.toFixed(2)}%\nGrade: ${json.result.overallGrade}\nGPA: ${json.result.gpa.toFixed(2)}/4.0\nStatus: ${json.result.status}`);
  e.target.reset();
  loadResults();
});

document.getElementById('addAttendanceForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const studentInput = fd.get('student_id') || '';
  const courseInput = fd.get('course_id') || '';
  const studentId = resolveStudentId(studentInput) || studentInput;
  const courseId = resolveCourseId(courseInput);
  const obj = { student_id: studentId, course_id: courseId, date: fd.get('date'), present: !!fd.get('present') };
  const res = await fetch('/api/attendance', { method: 'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(obj) });
  const json = await res.json();
  if (!json.success) { alert(json.error || 'Failed to add attendance'); return; }
  e.target.reset();
  loadAttendance();
});

// load functions
async function loadHome() {
  try {
    const [students, courses, teachers, results, attendance] = await Promise.all([
      api('/students'),
      api('/courses'),
      api('/teachers'),
      api('/results'),
      api('/attendance')
    ]);
    document.getElementById('countStudents').textContent = students.length;
    document.getElementById('countCourses').textContent = courses.length;
    document.getElementById('countTeachers').textContent = teachers.length;
    document.getElementById('countResults').textContent = results.length;
    document.getElementById('countAttendance').textContent = attendance.length;
  } catch (err) {
    console.error('Failed to load home stats:', err);
  }
}

window.loadStudents = async function() {
  const tbody = document.querySelector('#studentsTable tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';
  }
  try {
    const res = await fetch('/api/students', { headers: { ...authHeaders() } });
    if (!res.ok) {
      if (tbody) {
        const errorMsg = res.status === 401 ? 'Please login to view students.' : res.status === 403 ? 'Access denied.' : 'Failed to load students.';
        tbody.innerHTML = `<tr><td colspan="8">${errorMsg}</td></tr>`;
      }
      return;
    }
    let students = await res.json();
    console.log('✅ Students loaded:', students.length);
    console.log('📸 Photo URLs:', students.map(s => ({ name: s.name, photoUrl: s.photoUrl })));
    // Filter out any students without _id (corrupted data)
    students = students.filter(s => {
      if (!s._id) {
        console.warn('⚠️ Student without _id found:', s.name || 'Unknown');
        return false;
      }
      return true;
    });
    
    if (tbody) {
      tbody.innerHTML = students.map(s => `
        <tr>
          <td>${s.photoUrl ? `<img src="${s.photoUrl}" alt="photo" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid gold;">` : ''}</td>
          <td>${s.registrationNo ?? ''}</td>
          <td>${s.name ?? ''}</td>
          <td>${s.age ?? ''}</td>
          <td>${s.gender ?? ''}</td>
          <td>${(s.course_ids || []).join(', ')}</td>
          <td>${(s.courses || []).join(', ')}</td>
          <td>
            <button class="view-student" data-id="${s._id}">View</button>
            <button class="del-student" data-id="${s._id}">Delete</button>
            <button class="edit-student" data-id="${s._id}">Edit</button>
          </td>
        </tr>
      `).join('');
      // Attach delete button handlers
      tbody.querySelectorAll('.del-student').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const studentId = btn.dataset.id;
          
          console.log('=== DELETE BUTTON CLICKED ===');
          console.log('Student ID:', studentId);
          console.log('ID type:', typeof studentId);
          console.log('ID valid?', studentId && studentId !== 'undefined');
          
          if (!studentId || studentId === 'undefined') {
            alert('Error: Invalid student ID!\nThe student data may be corrupted.');
            return;
          }
          
          if (!confirm('Are you sure you want to delete this student?')) {
            return;
          }
          
          try {
            const url = `/api/students/${studentId}`;
            console.log('DELETE URL:', url);
            console.log('Auth headers:', authHeaders());
            
            const res = await fetch(url, { 
              method: 'DELETE', 
              headers: { ...authHeaders() } 
            });
            
            console.log('Response status:', res.status);
            console.log('Response ok:', res.ok);
            
            const data = await res.json();
            console.log('Response data:', data);
            
            if (!res.ok) {
              throw new Error(data.error || `Server error: ${res.status}`);
            }
            
            alert('✅ Student deleted successfully!');
            loadStudents();
          } catch (err) {
            console.error('❌ Delete error:', err);
            
            if (err.message.includes('fetch')) {
              alert('❌ Cannot connect to server!\n\n' +
                    'Server may have stopped.\n\n' +
                    'Please restart the server:\n' +
                    'cd backend\n' +
                    'npm start');
            } else {
              alert('❌ Failed to delete student:\n' + err.message);
            }
          }
        });
      });
      
      // Attach view button handlers
      tbody.querySelectorAll('.view-student').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          console.log('View clicked for student:', btn.dataset.id);
          try {
            const id = btn.dataset.id;
            const res = await fetch(`/api/students/${id}`, { headers: { ...authHeaders() } });
            const s = await res.json();
            console.log('Student data:', s);
            openStudentProfile(s);
          } catch (err) {
            console.error('View error:', err);
            alert('Failed to load student: ' + err.message);
          }
        });
      });
      
      // Attach edit button handlers
      tbody.querySelectorAll('.edit-student').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          console.log('Edit clicked for student:', btn.dataset.id);
          try {
            const id = btn.dataset.id;
            const res = await fetch(`/api/students/${id}`, { headers: { ...authHeaders() } });
            const s = await res.json();
            console.log('Student data for edit:', s);
            openEditStudent(s);
          } catch (err) {
            console.error('Edit error:', err);
            alert('Failed to load student for editing: ' + err.message);
          }
        });
      });
      
      console.log('✅ Button handlers attached:', {
        delete: tbody.querySelectorAll('.del-student').length,
        view: tbody.querySelectorAll('.view-student').length,
        edit: tbody.querySelectorAll('.edit-student').length
      });
    }
  } catch (err) {
    console.error('Failed to load students:', err);
    if (tbody) tbody.innerHTML = '<tr><td colspan="8">Error loading students. Check console for details.</td></tr>';
  }
}

function openStudentProfile(s) {
  const modal = document.getElementById('studentProfileModal');
  const content = document.getElementById('studentProfileContent');
  if (!modal || !content) return;
  
  // Format the student data with professional print layout
  // IMPORTANT: Use actual img tag with src for printing to work
  const photoHTML = s.photoUrl 
    ? `<img src="${s.photoUrl}" alt="${s.name}" class="student-photo-print" style="width:150px; height:150px; border-radius:12px; object-fit:cover; border:4px solid #00BCD4; box-shadow:0 2px 8px rgba(0,0,0,0.1); display:block;">` 
    : '<div style="width:150px; height:150px; border-radius:12px; background:#e0e0e0; display:flex; align-items:center; justify-content:center; font-size:48px; border:4px solid #00BCD4;">👤</div>';
  
  // Get course names if available
  const courseNames = (s.course_ids || []).map(id => {
    const course = REF.courses?.find(c => c._id == id || c.code == id);
    return course ? `${course.name} (${course.code || id})` : id;
  }).join(', ') || 'Not enrolled in any courses';
  
  content.innerHTML = `
    <style>
      @media print {
        body * { visibility: hidden; }
        #studentProfileModal, #studentProfileModal * { visibility: visible; }
        #studentProfileModal { position: absolute; left: 0; top: 0; }
        .no-print { display: none !important; }
      }
      .profile-section {
        margin: 20px 0;
        page-break-inside: avoid;
      }
      .profile-header {
        background: var(--primary-color);
        color: white;
        padding: 12px 15px;
        border-radius: 8px 8px 0 0;
        font-weight: bold;
        font-size: 16px;
      }
      .profile-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--card-bg);
        border: 2px solid var(--border-color);
        border-radius: 0 0 8px 8px;
        overflow: hidden;
      }
      .profile-table tr {
        border-bottom: 1px solid var(--border-color);
      }
      .profile-table tr:last-child {
        border-bottom: none;
      }
      .profile-table td {
        padding: 12px 15px;
        color: var(--text-primary);
      }
      .profile-table td:first-child {
        font-weight: 600;
        background: var(--main-bg);
        width: 35%;
        color: var(--text-secondary);
      }
    </style>
    
    <!-- Student Header with Photo -->
    <div style="display: flex; align-items: center; gap: 25px; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)); border-radius: 12px; color: white;">
      ${photoHTML}
      <div style="flex: 1;">
        <h2 style="margin: 0 0 8px 0; font-size: 28px;">${s.name || 'Unknown Student'}</h2>
        <p style="margin: 0; font-size: 18px; opacity: 0.9;">📋 ${s.registrationNo || 'No Registration Number'}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">Student ID: ${s._id || 'N/A'}</p>
      </div>
    </div>
    
    <!-- Personal Information -->
    <div class="profile-section">
      <div class="profile-header">👤 Personal Information</div>
      <table class="profile-table">
        <tr>
          <td>Full Name</td>
          <td><strong>${s.name || 'N/A'}</strong></td>
        </tr>
        <tr>
          <td>Registration Number</td>
          <td><strong>${s.registrationNo || 'N/A'}</strong></td>
        </tr>
        <tr>
          <td>Gender</td>
          <td>${s.gender || 'Not specified'}</td>
        </tr>
        <tr>
          <td>Age</td>
          <td>${s.age || 'Not specified'} years</td>
        </tr>
        <tr>
          <td>Date of Birth</td>
          <td>${s.dob ? new Date(s.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}</td>
        </tr>
        <tr>
          <td>Student Number</td>
          <td>${s.studentNumber || 'Not assigned'}</td>
        </tr>
      </table>
    </div>
    
    <!-- Contact Information -->
    <div class="profile-section">
      <div class="profile-header">📞 Contact Information</div>
      <table class="profile-table">
        <tr>
          <td>Phone Number</td>
          <td>${(s.contact && s.contact.phone) || 'Not provided'}</td>
        </tr>
        <tr>
          <td>Email Address</td>
          <td>${(s.contact && s.contact.email) || 'Not provided'}</td>
        </tr>
        <tr>
          <td>Physical Address</td>
          <td>${(s.contact && s.contact.address) || 'Not provided'}</td>
        </tr>
      </table>
    </div>
    
    <!-- Academic Information -->
    <div class="profile-section">
      <div class="profile-header">📚 Academic Information</div>
      <table class="profile-table">
        <tr>
          <td>Enrolled Courses</td>
          <td>${courseNames}</td>
        </tr>
        <tr>
          <td>Number of Courses</td>
          <td><strong>${(s.course_ids || []).length}</strong> course(s)</td>
        </tr>
        <tr>
          <td>Course IDs</td>
          <td>${(s.course_ids || []).join(', ') || 'None'}</td>
        </tr>
      </table>
    </div>
    
    <!-- Metadata -->
    <div class="profile-section">
      <div class="profile-header">ℹ️ Record Information</div>
      <table class="profile-table">
        <tr>
          <td>Student ID (Database)</td>
          <td style="font-family: monospace; font-size: 12px;">${s._id || 'N/A'}</td>
        </tr>
        <tr>
          <td>Record Created</td>
          <td>${s.createdAt ? new Date(s.createdAt).toLocaleString() : 'Unknown'}</td>
        </tr>
        <tr>
          <td>Last Updated</td>
          <td>${s.updatedAt ? new Date(s.updatedAt).toLocaleString() : 'Unknown'}</td>
        </tr>
      </table>
    </div>
    
    <div style="margin-top: 30px; padding: 15px; background: var(--main-bg); border-left: 4px solid var(--primary-color); border-radius: 4px; font-size: 13px; color: var(--text-secondary);">
      <strong>Note:</strong> This profile can be printed using the "Print Profile" button below. The layout is optimized for A4 paper.
    </div>
  `;
  modal.style.display = 'flex';
}

// Modal handlers
(function initStudentProfileModal(){
  const modal = document.getElementById('studentProfileModal');
  const btnClose = document.getElementById('closeStudentProfile');
  const btnPrint = document.getElementById('printStudentProfile');
  if (btnClose) btnClose.addEventListener('click', () => modal.style.display = 'none');
  if (btnPrint) btnPrint.addEventListener('click', () => {
    // Simply use window.print() - much more reliable!
    // The CSS @media print rules will handle the styling
    
    // Add a temporary print class to body
    document.body.classList.add('printing');
    
    // Wait a moment for images to fully render before printing
    setTimeout(() => {
      window.print();
      
      // Remove print class after printing
      setTimeout(() => {
        document.body.classList.remove('printing');
      }, 500);
    }, 300);
  });
})();

// ===== Enrollment =====
document.getElementById('addEnrollmentForm').addEventListener('submit', async e => {
  e.preventDefault();
  console.log('=== ADD ENROLLMENT SUBMITTED ===');
  
  const fd = new FormData(e.target);
  const studentInput = (fd.get('student_id') || '').trim();
  const semester = (fd.get('semester') || '').trim();
  const courseInput = (fd.get('course_ids') || '').trim();
  const status = fd.get('status') || 'pending';
  
  console.log('Student input:', studentInput);
  console.log('Semester:', semester);
  console.log('Courses:', courseInput);
  
  if (!studentInput) {
    alert('❌ Please select a student!');
    return;
  }
  
  if (!semester) {
    alert('❌ Please enter semester!');
    return;
  }
  
  // Resolve student name/reg number to ObjectId
  const studentId = resolveStudentId(studentInput);
  console.log('Resolved student ID:', studentId);
  
  if (!studentId) {
    alert('❌ Student not found!\n\nPlease select a valid student from the dropdown.');
    return;
  }
  
  const payload = {
    student_id: studentId,
    semester: semester,
    course_ids: normalizeCourseIds(courseInput),
    status: status
  };
  
  console.log('Payload:', payload);
  
  try {
    const res = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      let errorMsg = 'Failed to add enrollment.';
      
      if (res.status === 401) {
        errorMsg = '❌ Not logged in!\n\nPlease login first.';
      } else if (res.status === 403) {
        errorMsg = '❌ Permission Denied!\n\nYou need ADMIN or TEACHER role to add enrollments.';
      } else {
        try {
          const json = await res.json();
          errorMsg = json.error || errorMsg;
        } catch {}
      }
      
      alert(errorMsg);
      return;
    }
    
    const json = await res.json();
    console.log('Response:', json);
    
    alert('✅ Enrollment added successfully!');
    e.target.reset();
    loadEnrollments();
  } catch (err) {
    console.error('❌ Network error:', err);
    alert('❌ Network Error!\n\n' + err.message);
  }
});

window.loadEnrollments = async function() {
  const tbody = document.querySelector('#enrollmentsTable tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
  try {
    const res = await fetch('/api/enrollments', { headers: { ...authHeaders() } });
    if (!res.ok) {
      const errorText = res.status === 401 ? 'Please login to view enrollments.' : res.status === 403 ? 'You need admin, teacher, or student role to view enrollments.' : 'Failed to load enrollments.';
      if (tbody) tbody.innerHTML = `<tr><td colspan="6">${errorText}</td></tr>`;
      return;
    }
    const list = await res.json();
    if (!Array.isArray(list)) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="6">No data.</td></tr>';
      return;
    }
    if (list.length === 0) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="6">No enrollments yet. Create one using the form above.</td></tr>';
      return;
    }
  if (tbody) {
    // Ensure REF.students is an array
    if (!Array.isArray(REF.students)) REF.students = [];
    
    tbody.innerHTML = list.map(en => {
      const stu = REF.students.find(s => String(s._id) === String(en.student_id));
      const regNo = stu ? (stu.registrationNo || '-') : '-';
      const stuName = stu ? stu.name : (en.student_id || 'Unknown');
      
      return `
      <tr>
        <td>${regNo}</td>
        <td>${stuName}</td>
        <td>${en.semester || ''}</td>
        <td>${(en.course_ids || []).join(', ')}</td>
        <td>${en.status || ''}</td>
        <td>
          <button class="en-approve" data-id="${en._id}">Approve</button>
          <button class="en-reject" data-id="${en._id}">Reject</button>
        </td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('.en-approve').forEach(btn => btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const enrollmentId = btn.dataset.id;
      console.log('=== APPROVE CLICKED ===');
      console.log('Enrollment ID:', enrollmentId);
      
      if (!enrollmentId || enrollmentId === 'undefined') {
        alert('❌ Invalid enrollment ID!');
        return;
      }
      
      if (confirm('Approve this enrollment?')) {
        await updateEnrollment(enrollmentId, { status: 'approved' });
      }
    }));
    
    tbody.querySelectorAll('.en-reject').forEach(btn => btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const enrollmentId = btn.dataset.id;
      console.log('=== REJECT CLICKED ===');
      console.log('Enrollment ID:', enrollmentId);
      
      if (!enrollmentId || enrollmentId === 'undefined') {
        alert('❌ Invalid enrollment ID!');
        return;
      }
      
      if (confirm('Reject this enrollment?')) {
        await updateEnrollment(enrollmentId, { status: 'rejected' });
      }
    }));
    
    console.log('✅ Enrollment buttons attached:', {
      approve: tbody.querySelectorAll('.en-approve').length,
      reject: tbody.querySelectorAll('.en-reject').length
    });
  }
  } catch (err) {
    console.error('Error loading enrollments:', err);
    if (tbody) tbody.innerHTML = '<tr><td colspan="6">Error loading enrollments. Check console for details.</td></tr>';
  }
}

async function updateEnrollment(id, changes) {
  try {
    console.log('Updating enrollment:', id, 'with changes:', changes);
    
    const url = `/api/enrollments/${id}`;
    console.log('PUT URL:', url);
    
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(changes)
    });
    
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      let errorMsg = 'Failed to update enrollment.';
      
      if (res.status === 401) {
        errorMsg = '❌ Not logged in!\n\nPlease login first.';
      } else if (res.status === 403) {
        errorMsg = '❌ Permission Denied!\n\nYou need ADMIN or TEACHER role to approve/reject enrollments.';
      } else {
        try {
          const json = await res.json();
          errorMsg = json.error || errorMsg;
        } catch {}
      }
      
      console.error('❌ Error:', errorMsg);
      alert(errorMsg);
      return;
    }
    
    const json = await res.json();
    console.log('Response data:', json);
    
    if (!json.success) {
      alert('❌ ' + (json.error || 'Failed to update enrollment'));
      return;
    }
    
    console.log('✅ Enrollment updated successfully!');
    alert(`✅ Enrollment ${changes.status} successfully!`);
    loadEnrollments();
  } catch (err) {
    console.error('❌ Network error:', err);
    alert('❌ Network Error!\n\n' + err.message + '\n\nMake sure server is running!');
  }
}

// ===== Global datalists and helpers =====
let REF = { students: [], courses: [], teachers: [] };

async function preloadReferences() {
  try {
    const [s, c, t] = await Promise.all([
      fetch('/api/students', { headers: { ...authHeaders() } })
        .then(r => r.ok ? r.json() : [])
        .catch(() => []),
      fetch('/api/courses', { headers: { ...authHeaders() } })
        .then(r => r.ok ? r.json() : [])
        .catch(() => []),
      fetch('/api/teachers', { headers: { ...authHeaders() } })
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
    ]);
    
    REF.students = Array.isArray(s) ? s : [];
    REF.courses = Array.isArray(c) ? c : [];
    REF.teachers = Array.isArray(t) ? t : [];
    
    console.log('References loaded:', { 
      students: REF.students.length, 
      courses: REF.courses.length, 
      teachers: REF.teachers.length 
    });
    
    renderDatalists();
  } catch (err) {
    console.error('Error preloading references:', err);
    // Initialize as empty arrays to prevent errors
    REF.students = REF.students || [];
    REF.courses = REF.courses || [];
    REF.teachers = REF.teachers || [];
  }
}

function renderDatalists() {
  const dlS = document.getElementById('dlStudents');
  const dlC = document.getElementById('dlCourses');
  const dlT = document.getElementById('dlTeachers');
  
  // Safety checks: ensure arrays exist before mapping
  if (dlS && Array.isArray(REF.students)) {
    // Show both name and reg number for easy selection
    dlS.innerHTML = REF.students.map(s => {
      const display = s.registrationNo 
        ? `${s.name} (${s.registrationNo})`
        : s.name;
      return `<option value="${display}">${display}</option>`;
    }).join('');
  }
  if (dlC && Array.isArray(REF.courses)) {
    dlC.innerHTML = REF.courses.map(c => `<option value="${c._id || c.id || c.code || c.name}">${c.name}${c._id ? ' (#'+c._id+')':''}</option>`).join('');
  }
  if (dlT && Array.isArray(REF.teachers)) {
    dlT.innerHTML = REF.teachers.map(t => `<option value="${t._id}">${t.name}</option>`).join('');
  }
}

function normalizeCourseIds(input) {
  if (!input) return '';
  const tokens = String(input).split(',').map(s => s.trim()).filter(Boolean);
  
  // Safety check: ensure REF.courses is an array
  if (!Array.isArray(REF.courses)) {
    console.warn('REF.courses is not loaded yet, returning input as-is');
    return input;
  }
  
  const mapByName = new Map(REF.courses.map(c => [String(c.name).toLowerCase(), c]));
  const ids = tokens.map(tok => {
    const num = Number(tok);
    if (!Number.isNaN(num)) return num;
    const byName = mapByName.get(tok.toLowerCase());
    return byName ? (byName._id ?? byName.id ?? byName.code) : tok;
  });
  // backend currently expects comma-separated numbers for course_ids; filter to numbers
  const numeric = ids.map(v => Number(v)).filter(n => !Number.isNaN(n));
  return numeric.join(',');
}

function resolveStudentId(input) {
  if (!input) return '';
  
  // Ensure REF.students is an array
  if (!Array.isArray(REF.students)) return '';
  
  const trimmed = String(input).trim();
  
  // If already looks like ObjectId
  if (/^[a-f\d]{24}$/i.test(trimmed)) return trimmed;
  
  // Check if input matches "Name (RegNo)" format
  const match = trimmed.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (match) {
    const name = match[1].trim();
    const regNo = match[2].trim();
    const found = REF.students.find(s => 
      s.name && s.registrationNo &&
      s.name.toLowerCase() === name.toLowerCase() &&
      s.registrationNo.toLowerCase() === regNo.toLowerCase()
    );
    if (found) return found._id;
  }
  
  // Search by registration number only
  const byRegNo = REF.students.find(s => 
    s.registrationNo && 
    s.registrationNo.toLowerCase() === trimmed.toLowerCase()
  );
  if (byRegNo) return byRegNo._id;
  
  // Search by name only (case-insensitive)
  const byName = REF.students.find(s => 
    s.name && 
    s.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (byName) return byName._id;
  
  return '';
}

function resolveCourseId(input) {
  if (!input) return '';
  const num = Number(input);
  if (!Number.isNaN(num)) return num;
  const found = REF.courses.find(c => (c.name || '').toLowerCase() === String(input).toLowerCase());
  return found ? (found._id || found.id || found.code) : input;
}

function toCSV(arr) {
  if (!Array.isArray(arr)) return '';
  return arr.join(', ');
}

function openEditStudent(s) {
  const modal = document.getElementById('editStudentModal');
  if (!modal) {
    console.error('❌ Edit modal not found!');
    return;
  }
  
  // Safely set values - check if elements exist first
  const setIfExists = (id, value) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = value;
    } else {
      console.warn(`⚠️ Element #${id} not found in edit modal`);
    }
  };
  
  setIfExists('edit_id', s._id || '');
  setIfExists('edit_name', s.name || '');
  setIfExists('edit_gender', s.gender || '');
  setIfExists('edit_age', s.age ?? '');
  setIfExists('edit_dob', s.dob ? new Date(s.dob).toISOString().slice(0,10) : '');
  setIfExists('edit_phone', (s.contact && s.contact.phone) || '');
  setIfExists('edit_email', (s.contact && s.contact.email) || '');
  setIfExists('edit_address', (s.contact && s.contact.address) || '');
  setIfExists('edit_course_ids', toCSV(s.course_ids || []));
  
  modal.style.display = 'flex';
}

(function initEditStudentModal(){
  const modal = document.getElementById('editStudentModal');
  const closeBtn = document.getElementById('closeEditStudent');
  const form = document.getElementById('editStudentForm');
  if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
  if (form) form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fdSrc = new FormData(form);
    const id = fdSrc.get('_id');
    const fd = new FormData();
    if (fdSrc.get('name')) fd.append('name', fdSrc.get('name'));
    if (fdSrc.get('gender')) fd.append('gender', fdSrc.get('gender'));
    if (fdSrc.get('age')) fd.append('age', String(Number(fdSrc.get('age'))));
    if (fdSrc.get('dob')) fd.append('dob', fdSrc.get('dob'));
    if (fdSrc.get('contact.phone')) fd.append('contact.phone', fdSrc.get('contact.phone'));
    if (fdSrc.get('contact.email')) fd.append('contact.email', fdSrc.get('contact.email'));
    if (fdSrc.get('contact.address')) fd.append('contact.address', fdSrc.get('contact.address'));
    if (fdSrc.get('course_ids')) fd.append('course_ids', fdSrc.get('course_ids'));
    const file = document.getElementById('edit_photo').files[0];
    if (file) fd.append('photo', file);
    const res = await fetch(`/api/students/${id}`, { method: 'PUT', headers: { ...authHeaders() }, body: fd });
    const json = await res.json();
    if (!json.success) {
      alert(json.error || 'Failed to update student. You may need admin/teacher role.');
      return;
    }
    modal.style.display = 'none';
    loadStudents();
    preloadReferences();
  });
})();

window.loadCourses = async function() {
  const tbody = document.querySelector('#coursesTable tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
  }
  const items = await api('/courses', { headers: { ...authHeaders() } });
  if (tbody) {
    tbody.innerHTML = items.map(c => {
      const t = (REF.teachers || []).find(x => String(x._id) === String(c.teacher_id));
      const teacherDisplay = t ? `${t.name}` : (c.teacher_id ?? 'Not Assigned');
      return `
      <tr>
        <td>${c._id ?? ''}</td>
        <td><strong>${c.code ?? ''}</strong></td>
        <td>${c.name ?? ''}</td>
        <td>${teacherDisplay}</td>
        <td>${c.credits || 'N/A'}</td>
        <td>
          <button onclick="editCourse('${c._id}')" style="padding: 5px 10px; font-size: 0.85em; background: #FF9800;">✏️ Edit</button>
          <button onclick="deleteCourse('${c._id}')" style="padding: 5px 10px; font-size: 0.85em; background: #f44336;">🗑️ Delete</button>
        </td>
      </tr>`;
    }).join('');
  }
}

// Edit course
window.editCourse = async function(courseId) {
  try {
    const courses = await api('/courses', { headers: { ...authHeaders() } });
    const course = courses.find(c => String(c._id) === String(courseId));
    
    if (!course) {
      alert('Course not found');
      return;
    }
    
    const newCode = prompt('Edit Course Code:', course.code);
    if (newCode === null) return;
    
    const newName = prompt('Edit Course Name:', course.name);
    if (newName === null) return;
    
    const newCredits = prompt('Edit Credits:', course.credits || '3');
    if (newCredits === null) return;
    
    const payload = {
      code: newCode.trim(),
      name: newName.trim(),
      credits: Number(newCredits) || 3,
      teacher_id: course.teacher_id
    };
    
    const res = await fetch(`/api/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    });
    
    const json = await res.json();
    
    if (json.success || res.ok) {
      alert('✅ Course updated successfully!');
      loadCourses();
      preloadReferences();
    } else {
      alert('❌ Failed to update course: ' + (json.error || 'Unknown error'));
    }
  } catch (err) {
    alert('❌ Error updating course: ' + err.message);
  }
}

// Delete course
window.deleteCourse = async function(courseId) {
  if (!confirm('⚠️ Are you sure you want to delete this course? This action cannot be undone.')) {
    return;
  }
  
  try {
    const res = await fetch(`/api/courses/${courseId}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    
    const json = await res.json();
    
    if (json.success || res.ok) {
      alert('✅ Course deleted successfully!');
      loadCourses();
      preloadReferences();
    } else {
      alert('❌ Failed to delete course: ' + (json.error || 'Unknown error'));
    }
  } catch (err) {
    alert('❌ Error deleting course: ' + err.message);
  }
}

window.loadTeachers = async function() {
  const tbody = document.querySelector('#teachersTable tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
  }
  const items = await api('/teachers', { headers: { ...authHeaders() } });
  if (tbody) {
    tbody.innerHTML = items.map(t => `
      <tr>
        <td>${t.photoUrl ? `<img src="${t.photoUrl}" alt="photo" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid gold;">` : ''}</td>
        <td>${t._id ?? ''}</td>
        <td>${t.name ?? ''}</td>
        <td>${t.subject ?? ''}</td>
      </tr>`).join('');
  }
}

// ===== Classes =====
document.getElementById('addClassForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = {
    name: fd.get('name'),
    department: fd.get('department') || undefined,
    year: fd.get('year') ? Number(fd.get('year')) : undefined,
    section: fd.get('section') || undefined,
  };
  const res = await fetch('/api/classes', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(payload) });
  const json = await res.json();
  if (!json.success) { 
    const errorMsg = json.error === 'Forbidden' 
      ? 'You need admin or teacher role to create classes.' 
      : (json.error || 'Failed to create class');
    alert(errorMsg); 
    return; 
  }
  e.target.reset();
  loadClasses();
});

window.loadClasses = async function() {
  const tbody = document.querySelector('#classesTable tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
  try {
    const res = await fetch('/api/classes', { headers: { ...authHeaders() } });
    if (!res.ok) {
      const errorMsg = res.status === 401 ? 'Please login to view classes.' : res.status === 403 ? 'Access denied. Need admin or teacher role.' : 'Failed to load classes.';
      if (tbody) tbody.innerHTML = `<tr><td colspan="6">${errorMsg}</td></tr>`;
      return;
    }
    const list = await res.json();
    if (tbody) {
      // Ensure REF.teachers is an array
      if (!Array.isArray(REF.teachers)) REF.teachers = [];
      
      tbody.innerHTML = (list || []).map(c => {
        const t = REF.teachers.find(x => String(x._id) === String(c.teacher_id));
        const teacherDisplay = t ? `${t.name} (#${t._id})` : (c.teacher_id ?? '');
        return `
        <tr>
          <td>${c.name || ''}</td>
          <td>${c.department || ''}</td>
          <td>${c.year ?? ''}</td>
          <td>${c.section || ''}</td>
          <td><button class="open-members" data-id="${c._id}" data-name="${(c.name||'').replace(/\"/g,'&quot;')}">${(c.student_ids || []).length} manage</button></td>
          <td><button class="del-class" data-id="${c._id}">Delete</button></td>
        </tr>
      `}).join('');
      tbody.querySelectorAll('.del-class').forEach(btn => btn.addEventListener('click', async () => {
        const res = await fetch(`/api/classes/${btn.dataset.id}`, { method: 'DELETE', headers: { ...authHeaders() } });
        if (!res.ok) { alert('Failed to delete'); return; }
        loadClasses();
      }));
      tbody.querySelectorAll('.open-members').forEach(btn => btn.addEventListener('click', () => openClassMembers(btn.dataset.id, btn.dataset.name)));
    }
  } catch (err) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6">Error loading classes. Make sure you are logged in.</td></tr>';
    console.error('Failed to load classes:', err);
  }
}

function openClassMembers(classId, className) {
  const modal = document.getElementById('classMembersModal');
  const listEl = document.getElementById('classMembersList');
  const addInput = document.getElementById('classMembersAddStudent');
  const addBtn = document.getElementById('classMembersAddBtn');
  if (!modal || !listEl || !addInput || !addBtn) return;
  modal.dataset.classId = classId;
  listEl.innerHTML = 'Loading...';
  modal.style.display = 'flex';
  // load class and render students
  api('/classes').then(all => {
    const c = (all || []).find(x => String(x._id) === String(classId));
    const stus = (c && c.student_ids) || [];
    renderClassMembers(stus);
  });
  addBtn.onclick = async () => {
    const input = addInput.value.trim();
    if (!input) return;
    const sid = resolveStudentId(input) || input;
    const res = await fetch(`/api/classes/${classId}/students`, { method: 'POST', headers: { 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify({ student_id: sid }) });
    const json = await res.json();
    if (!json.success) { alert(json.error || 'Failed to add student'); return; }
    addInput.value = '';
    renderClassMembers(json.class.student_ids || []);
    loadClasses();
  };
  const closeBtn = document.getElementById('closeClassMembers');
  if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };
}

function renderClassMembers(studentIds) {
  const listEl = document.getElementById('classMembersList');
  const classId = document.getElementById('classMembersModal').dataset.classId;
  const items = (studentIds || []).map(sid => {
    const s = (REF.students || []).find(x => String(x._id) === String(sid));
    const label = s ? `${s.name}${s.registrationNo ? ' ('+s.registrationNo+')':''}` : sid;
    return `<li style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:6px 0; border-bottom:1px solid #333;">
      <span>${label}</span>
      <button class="rm-stu" data-id="${sid}">Remove</button>
    </li>`;
  }).join('');
  listEl.innerHTML = `<ul style="list-style:none; padding:0; margin:0;">${items || ''}</ul>`;
  listEl.querySelectorAll('.rm-stu').forEach(btn => btn.addEventListener('click', async () => {
    const res = await fetch(`/api/classes/${classId}/students/${btn.dataset.id}`, { method: 'DELETE', headers: { ...authHeaders() } });
    const json = await res.json();
    if (!json.success) { alert(json.error || 'Failed to remove'); return; }
    renderClassMembers(json.class.student_ids || []);
    loadClasses();
  }));
}

window.loadResults = async function() {
  const tbody = document.querySelector('#resultsTable tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="9">Loading...</td></tr>';
  }
  const items = await api('/results', { headers: { ...authHeaders() } });
  if (tbody) {
    if (!Array.isArray(items) || items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9">No results yet</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(r => {
      const student = r.student_id;
      const studentDisp = student ? `${student.name}${student.registrationNo ? ' (' + student.registrationNo + ')' : ''}` : 'N/A';
      
      // Status badge with color
      const statusBadge = r.status === 'Pass' 
        ? `<span style="background: #4CAF50; color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.85em;">✓ Pass</span>`
        : `<span style="background: #f44336; color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.85em;">✗ Fail</span>`;
      
      // Grade color coding
      const gradeColor = r.overallGrade?.startsWith('A') ? '#4CAF50' : 
                        r.overallGrade?.startsWith('B') ? '#8BC34A' : 
                        r.overallGrade?.startsWith('C') ? '#FFC107' : 
                        r.overallGrade?.startsWith('D') ? '#FF9800' : '#f44336';
      
      return `
      <tr>
        <td>${studentDisp}</td>
        <td>${r.semester || 'N/A'}</td>
        <td>${r.academicYear || 'N/A'}</td>
        <td>${r.totalMarks || 0}/800</td>
        <td>${r.averageMarks ? r.averageMarks.toFixed(2) + '%' : 'N/A'}</td>
        <td style="font-weight: bold; color: ${gradeColor};">${r.overallGrade || 'N/A'}</td>
        <td style="font-weight: bold;">${r.gpa ? r.gpa.toFixed(2) : '0.0'}/4.0</td>
        <td>${statusBadge}</td>
        <td>
          <button onclick="viewResultDetails('${r._id}')" style="padding: 5px 10px; font-size: 0.85em;">👁️ View</button>
          <button onclick="editResult('${r._id}')" style="padding: 5px 10px; font-size: 0.85em; background: #FF9800;">✏️ Edit</button>
          <button onclick="deleteResult('${r._id}')" style="padding: 5px 10px; font-size: 0.85em; background: #f44336;">🗑️ Delete</button>
        </td>
      </tr>`;
    }).join('');
  }
}

// View detailed result breakdown
window.viewResultDetails = async function(resultId) {
  try {
    const result = await api(`/results/${resultId}`, { headers: { ...authHeaders() } });
    if (!result) {
      // Try to find in the loaded results
      const allResults = await api('/results', { headers: { ...authHeaders() } });
      const found = allResults.find(r => String(r._id) === String(resultId));
      if (!found) {
        alert('Result not found');
        return;
      }
      showResultDetailsModal(found);
    } else {
      showResultDetailsModal(result);
    }
  } catch (err) {
    // Fallback: fetch all and find
    const allResults = await api('/results', { headers: { ...authHeaders() } });
    const found = allResults.find(r => String(r._id) === String(resultId));
    if (found) {
      showResultDetailsModal(found);
    } else {
      alert('Could not load result details');
    }
  }
}

async function showResultDetailsModal(result) {
  const student = result.student_id;
  
  // Get stored data from localStorage first
  const resultKey = `report_${result._id}`;
  const savedData = JSON.parse(localStorage.getItem(resultKey) || '{}');
  
  // Use saved data if available, otherwise use database values
  const studentName = savedData.studentName || (student ? student.name : 'N/A');
  const regNo = savedData.studentRegNo || (student?.registrationNo || 'N/A');
  const photoUrl = student?.photoUrl || '';
  
  // Fetch payment data for tuition status
  let tuitionStatus = 'Unknown';
  let tuitionBalance = 0;
  let totalPaid = 0;
  let expectedFees = 500000; // Default expected fees (adjust as needed)
  
  try {
    const payments = await api('/payments', { headers: { ...authHeaders() } });
    if (Array.isArray(payments)) {
      const studentPayments = payments.filter(p => 
        p.student_id && String(p.student_id._id || p.student_id) === String(student?._id)
      );
      totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      tuitionBalance = expectedFees - totalPaid;
      tuitionStatus = tuitionBalance <= 0 ? 'CLEARED ✓' : 'PENDING';
    }
  } catch (err) {
    console.error('Could not fetch payment data:', err);
  }
  
  // Build subjects table
  let subjectsTable = '<table style="width: 100%; border-collapse: collapse; margin: 15px 0; border: 2px solid #00BCD4;">';
  subjectsTable += '<thead><tr style="background: #00BCD4; color: white;"><th style="padding: 12px; border: 1px solid #00BCD4;">Subject</th><th style="padding: 12px; border: 1px solid #00BCD4;">Marks</th><th style="padding: 12px; border: 1px solid #00BCD4;">Grade</th><th style="padding: 12px; border: 1px solid #00BCD4;">Remarks</th></tr></thead><tbody>';
  
  if (result.subjects && result.subjects.length > 0) {
    result.subjects.forEach((s, idx) => {
      const gradeColor = s.grade?.startsWith('A') ? '#4CAF50' : 
                        s.grade?.startsWith('B') ? '#8BC34A' : 
                        s.grade?.startsWith('C') ? '#FFC107' : 
                        s.grade?.startsWith('D') ? '#FF9800' : '#f44336';
      const bgColor = idx % 2 === 0 ? '#f9f9f9' : 'white';
      const remarks = s.marks >= 75 ? 'Excellent' : s.marks >= 60 ? 'Good' : s.marks >= 50 ? 'Fair' : s.marks >= 40 ? 'Pass' : 'Fail';
      subjectsTable += `<tr style="background: ${bgColor};">
        <td style="padding: 10px; border: 1px solid #ddd;">${s.name}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${s.marks}/100</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: ${gradeColor};">${s.grade}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${remarks}</td>
      </tr>`;
    });
  }
  subjectsTable += '</tbody></table>';
  
  const reportCard = `
    <div id="printableReportCard" style="font-family: 'Segoe UI', Arial, sans-serif;">
      <!-- Header Section -->
      <div style="text-align: center; border-bottom: 3px solid #00BCD4; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #00BCD4; font-size: 28px;">📚 STUDENT MANAGEMENT SYSTEM</h1>
        <p style="margin: 5px 0; font-size: 14px; color: #666;">Academic Report Card</p>
      </div>
      
      <!-- Student Info Section -->
      <div style="display: flex; gap: 20px; margin-bottom: 25px; border: 2px solid #00BCD4; padding: 20px; border-radius: 8px; background: linear-gradient(135deg, #E3F2FD 0%, #FFFFFF 100%);">
        <div style="flex-shrink: 0;">
          ${photoUrl ? `<img src="${photoUrl}" alt="Student Photo" style="width: 120px; height: 120px; border-radius: 8px; object-fit: cover; border: 3px solid #00BCD4; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">` : '<div style="width: 120px; height: 120px; border-radius: 8px; background: #ddd; display: flex; align-items: center; justify-content: center; border: 3px solid #00BCD4;">📷</div>'}
        </div>
        <div style="flex: 1;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 5px; font-weight: bold; width: 180px;">Student Name:</td><td style="padding: 5px;"><input type="text" id="studentName" value="${studentName}" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"></td></tr>
            <tr><td style="padding: 5px; font-weight: bold;">Registration Number:</td><td style="padding: 5px;"><input type="text" id="studentRegNo" value="${regNo}" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"></td></tr>
            <tr><td style="padding: 5px; font-weight: bold;">Academic Year:</td><td style="padding: 5px;">${result.academicYear || 'N/A'}</td></tr>
            <tr><td style="padding: 5px; font-weight: bold;">Semester/Term:</td><td style="padding: 5px;">${result.semester || 'N/A'}</td></tr>
          </table>
        </div>
      </div>
      
      <!-- Subjects Performance -->
      <h3 style="color: #00BCD4; border-bottom: 2px solid #00BCD4; padding-bottom: 5px; margin-top: 25px;">📊 ACADEMIC PERFORMANCE</h3>
      ${subjectsTable}
      
      <!-- Summary Section -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #E8F5E9 0%, #FFFFFF 100%); border: 2px solid #4CAF50; border-radius: 8px;">
        <div><strong>Total Marks:</strong> <span style="font-size: 1.3em; color: #00BCD4;">${result.totalMarks || 0}/800</span></div>
        <div><strong>Average:</strong> <span style="font-size: 1.3em; color: #00BCD4;">${result.averageMarks ? result.averageMarks.toFixed(2) : '0'}%</span></div>
        <div><strong>Overall Grade:</strong> <span style="font-size: 1.5em; font-weight: bold; color: #4CAF50;">${result.overallGrade || 'N/A'}</span></div>
        <div><strong>GPA:</strong> <span style="font-size: 1.5em; font-weight: bold; color: #4CAF50;">${result.gpa ? result.gpa.toFixed(2) : '0.0'}/4.0</span></div>
        <div style="grid-column: span 2;"><strong>Status:</strong> <span style="font-size: 1.3em; padding: 5px 15px; background: ${result.status === 'Pass' ? '#4CAF50' : '#f44336'}; color: white; border-radius: 20px; display: inline-block;">${result.status || 'Pending'}</span></div>
      </div>
      
      <!-- Fees/Tuition Section -->
      <h3 style="color: #00BCD4; border-bottom: 2px solid #00BCD4; padding-bottom: 5px; margin-top: 25px;">💳 FEES STATUS</h3>
      <div style="padding: 15px; background: ${tuitionBalance <= 0 ? '#E8F5E9' : '#FFF3E0'}; border: 2px solid ${tuitionBalance <= 0 ? '#4CAF50' : '#FF9800'}; border-radius: 8px; margin: 15px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold; width: 200px;">Expected Fees:</td><td style="padding: 5px;">${expectedFees.toLocaleString()} UGX</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Total Paid:</td><td style="padding: 5px; color: #4CAF50; font-weight: bold;">${totalPaid.toLocaleString()} UGX</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Balance:</td><td style="padding: 5px; color: ${tuitionBalance <= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold;">${tuitionBalance.toLocaleString()} UGX</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Tuition Status:</td><td style="padding: 5px;"><span style="font-size: 1.2em; font-weight: bold; color: ${tuitionBalance <= 0 ? '#4CAF50' : '#f44336'};">${tuitionStatus}</span></td></tr>
        </table>
      </div>
      
      <!-- Teacher's Comments -->
      <h3 style="color: #00BCD4; border-bottom: 2px solid #00BCD4; padding-bottom: 5px; margin-top: 25px;">👨‍🏫 CLASS TEACHER'S REMARKS</h3>
      <div style="margin: 15px 0;">
        <textarea id="teacherComment" placeholder="Enter class teacher's comments here..." style="width: 100%; min-height: 80px; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-family: inherit; resize: vertical;">${savedData.teacherComment || ''}</textarea>
        <div style="margin-top: 10px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Teacher's Signature:</label>
          <input type="text" id="teacherSignature" placeholder="Teacher's name/signature" value="${savedData.teacherSignature || ''}" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-family: 'Brush Script MT', cursive; font-size: 18px;">
        </div>
      </div>
      
      <!-- Headteacher's Comments -->
      <h3 style="color: #00BCD4; border-bottom: 2px solid #00BCD4; padding-bottom: 5px; margin-top: 25px;">🎓 HEADTEACHER'S REMARKS</h3>
      <div style="margin: 15px 0;">
        <textarea id="headteacherComment" placeholder="Enter headteacher's comments here..." style="width: 100%; min-height: 80px; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-family: inherit; resize: vertical;">${savedData.headteacherComment || ''}</textarea>
        <div style="margin-top: 10px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Headteacher's Signature:</label>
          <input type="text" id="headteacherSignature" placeholder="Headteacher's name/signature" value="${savedData.headteacherSignature || ''}" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-family: 'Brush Script MT', cursive; font-size: 18px;">
        </div>
      </div>
      
      <!-- Save Button -->
      <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 2px solid #ddd;">
        <button onclick="saveReportCardComments('${result._id}')" style="padding: 12px 30px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px;">💾 Save Comments & Signatures</button>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #00BCD4; color: #666; font-size: 12px;">
        <p>Generated on: ${new Date().toLocaleDateString()} | Student Management System</p>
      </div>
    </div>
  `;
  
  const modal = document.getElementById('reportCardModal');
  const content = document.getElementById('reportCardContent');
  if (modal && content) {
    content.innerHTML = reportCard;
    modal.style.display = 'flex';
    
    // Scroll to top of modal content
    setTimeout(() => {
      modal.scrollTop = 0;
      if (content) content.scrollTop = 0;
      // Also scroll the inner content container
      const innerContainer = modal.querySelector('div > div');
      if (innerContainer) innerContainer.scrollTop = 0;
    }, 100);
  }
}

// Save report card comments and signatures
window.saveReportCardComments = function(resultId) {
  const studentName = document.getElementById('studentName')?.value || '';
  const studentRegNo = document.getElementById('studentRegNo')?.value || '';
  const teacherComment = document.getElementById('teacherComment')?.value || '';
  const teacherSignature = document.getElementById('teacherSignature')?.value || '';
  const headteacherComment = document.getElementById('headteacherComment')?.value || '';
  const headteacherSignature = document.getElementById('headteacherSignature')?.value || '';
  
  const data = {
    studentName,
    studentRegNo,
    teacherComment,
    teacherSignature,
    headteacherComment,
    headteacherSignature
  };
  
  localStorage.setItem(`report_${resultId}`, JSON.stringify(data));
  alert('✅ Report card data saved successfully!');
}

// Close report card modal
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('closeReportCard');
  const printBtn = document.getElementById('printReportCard');
  const modal = document.getElementById('reportCardModal');
  
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
  
  // Edit result modal close button
  const closeEditResultBtn = document.getElementById('closeEditResult');
  const editResultModal = document.getElementById('editResultModal');
  
  if (closeEditResultBtn && editResultModal) {
    closeEditResultBtn.addEventListener('click', () => {
      editResultModal.style.display = 'none';
    });
  }
  
  // Edit result form submission
  const editResultForm = document.getElementById('editResultForm');
  if (editResultForm) {
    editResultForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const resultId = document.getElementById('editResultId').value;
      const semester = document.getElementById('editResultSemester').value;
      const academicYear = document.getElementById('editResultAcademicYear').value;
      
      // Collect all 8 subjects
      const subjects = [];
      for (let i = 1; i <= 8; i++) {
        const name = document.getElementById(`editSubject${i}Name`).value;
        const marks = Number(document.getElementById(`editSubject${i}Marks`).value);
        subjects.push({ name, marks });
      }
      
      const payload = {
        semester,
        academicYear,
        subjects
      };
      
      try {
        const res = await fetch(`/api/results/${resultId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify(payload)
        });
        
        const json = await res.json();
        
        if (json.success) {
          alert('✅ Result updated successfully!\n\nTotal: ' + json.result.totalMarks + '/800\nAverage: ' + json.result.averageMarks.toFixed(2) + '%\nGrade: ' + json.result.overallGrade + '\nGPA: ' + json.result.gpa.toFixed(2) + '/4.0\nStatus: ' + json.result.status);
          editResultModal.style.display = 'none';
          loadResults();
        } else {
          alert('❌ Failed to update result: ' + (json.error || 'Unknown error'));
        }
      } catch (err) {
        alert('❌ Error updating result: ' + err.message);
      }
    });
  }
});

// Edit result
window.editResult = async function(resultId) {
  try {
    const allResults = await api('/results', { headers: { ...authHeaders() } });
    const result = allResults.find(r => String(r._id) === String(resultId));
    
    if (!result) {
      alert('Result not found');
      return;
    }
    
    openEditResultModal(result);
  } catch (err) {
    alert('Error loading result: ' + err.message);
  }
}

function openEditResultModal(result) {
  const modal = document.getElementById('editResultModal');
  if (!modal) return;
  
  const student = result.student_id;
  const studentName = student ? student.name : 'N/A';
  const regNo = student?.registrationNo || 'N/A';
  
  document.getElementById('editResultId').value = result._id;
  document.getElementById('editResultStudent').value = `${studentName} (${regNo})`;
  document.getElementById('editResultSemester').value = result.semester || '';
  document.getElementById('editResultAcademicYear').value = result.academicYear || '';
  
  // Fill in the 8 subjects
  if (result.subjects && result.subjects.length > 0) {
    result.subjects.forEach((s, idx) => {
      const num = idx + 1;
      const nameField = document.getElementById(`editSubject${num}Name`);
      const marksField = document.getElementById(`editSubject${num}Marks`);
      if (nameField) nameField.value = s.name || '';
      if (marksField) marksField.value = s.marks || '';
    });
  }
  
  modal.style.display = 'flex';
}

// Delete result
window.deleteResult = async function(resultId) {
  if (!confirm('Are you sure you want to delete this result?')) return;
  
  try {
    const res = await fetch(`/api/results/${resultId}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    const json = await res.json();
    
    if (json.success) {
      alert('Result deleted successfully');
      loadResults();
    } else {
      alert('Failed to delete result: ' + (json.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Error deleting result: ' + err.message);
  }
}

window.loadAttendance = async function() {
  const tbody = document.querySelector('#attendanceTable tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
  }
  const items = await api('/attendance', { headers: { ...authHeaders() } });
  if (tbody) {
    if (!Array.isArray(items) || items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No attendance records yet</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(a => {
      const student = REF.students.find(s => String(s._id) === String(a.student_id));
      const studentDisp = student ? `${student.name}${student.registrationNo ? ' ('+student.registrationNo+')':''}` : (a.student_id || '');
      const course = REF.courses.find(c => c._id === a.course_id);
      const courseDisp = course ? `${course.name} (#${course._id})` : (a.course_id ?? '');
      return `
      <tr>
        <td>${a.date ? new Date(a.date).toLocaleDateString() : ''}</td>
        <td>${studentDisp}</td>
        <td>${courseDisp}</td>
        <td>${a.present ? 'Present' : 'Absent'}</td>
      </tr>`;
    }).join('');
  }
};

// Attendance summary mini-form
(function initAttendanceSummary(){
  const form = document.getElementById('attendanceSummaryForm');
  const box = document.getElementById('attendanceSummary');
  if (!form || !box) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const studentInput = fd.get('student_id') || '';
    const courseInput = fd.get('course_id') || '';
    const sid = resolveStudentId(studentInput) || studentInput;
    const cid = courseInput ? resolveCourseId(courseInput) : '';
    box.textContent = 'Loading summary...';
    try {
      const qs = cid ? `?course_id=${encodeURIComponent(cid)}` : '';
      const res = await fetch(`/api/attendance/student/${encodeURIComponent(sid)}/summary${qs}`);
      if (!res.ok) throw new Error('Failed to load summary');
      const data = await res.json();
      const rate = (data.rate * 100).toFixed(1);
      const studentName = REF.students.find(s => s._id === sid)?.name || sid;
      const courseName = cid ? (REF.courses.find(c => c._id === Number(cid))?.name || cid) : '';
      box.innerHTML = `<div style="border:1px solid gold; padding:10px; border-radius:8px;">
        <div><strong>Student:</strong> ${studentName}</div>
        ${cid ? `<div><strong>Course:</strong> ${courseName}</div>` : ''}
        <div><strong>Present:</strong> ${data.present} / ${data.total} (${rate}%)</div>
      </div>`;
    } catch (err) {
      box.textContent = err.message;
    }
  });
})();

// initial: show Auth panel first; other panels require login
document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
const authInitial = document.getElementById('authPanel');
if (authInitial) authInitial.style.display = 'block';

// Set initial navigation visibility based on auth status
// Force hide navigation on auth panel
updateNavVisibility(true);

// ========== AUTH ========== //
function setProfile(user) {
  const logoutBtn = document.getElementById('logoutBtn');
  const sidebarName = document.getElementById('sidebarName');
  const sidebarPhoto = document.getElementById('sidebarPhoto');
  const sidebarRole = document.getElementById('sidebarRole');
  
  if (!user) {
    if (sidebarName) sidebarName.textContent = 'Guest';
    if (sidebarRole) sidebarRole.textContent = 'Not logged in';
    if (sidebarPhoto) {
      sidebarPhoto.style.display = 'none';
      sidebarPhoto.src = '';
    }
    if (logoutBtn) logoutBtn.style.display = 'none';
    updateNavVisibility(); // Hide navigation when logged out
    return;
  }
  
  if (sidebarName) sidebarName.textContent = user.name || 'User';
  if (sidebarRole) sidebarRole.textContent = user.role || 'guest';
  
  if (sidebarPhoto) {
    if (user.photoUrl) {
      sidebarPhoto.src = user.photoUrl;
      sidebarPhoto.style.display = 'block';
    } else {
      sidebarPhoto.style.display = 'none';
    }
  }
  
  if (logoutBtn) logoutBtn.style.display = 'block';
}

// Logout functionality
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        setProfile(null);
        
        // Show auth page and hide dashboard
        const authPageContainer = document.getElementById('authPageContainer');
        const mainSidebar = document.getElementById('mainSidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (authPageContainer) authPageContainer.style.display = 'flex';
        if (mainSidebar) mainSidebar.style.display = 'none';
        if (mainContent) mainContent.style.display = 'none';
        
        alert('Logged out successfully!');
        
        // Reload page to reset state
        window.location.reload();
      }
    });
  }
});

(function initAuth() {
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const signupMsg = document.getElementById('signupMsg');
  const loginMsg = document.getElementById('loginMsg');
  const openCameraBtn = document.getElementById('openCameraBtn');
  const captureBtn = document.getElementById('captureBtn');
  const video = document.getElementById('camera');
  const canvas = document.getElementById('snapshot');
  const photoData = document.getElementById('photoData');
  const fileInput = signupForm ? signupForm.querySelector('input[name="photo"]') : null;

  let stream;

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) return;
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.style.display = 'block';
    canvas.style.display = 'none';
    captureBtn.disabled = false;
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    video.srcObject = null;
    video.style.display = 'none';
  }

  function capturePhoto() {
    if (!video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    canvas.style.display = 'block';
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    photoData.value = dataUrl;
    stopCamera();
  }

  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  if (openCameraBtn) openCameraBtn.addEventListener('click', startCamera);
  if (captureBtn) captureBtn.addEventListener('click', capturePhoto);

  if (signupForm) signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get message element once at the start
    const signupMsg = document.getElementById('signupMsg');
    
    try {
      if (signupMsg) signupMsg.textContent = 'Submitting...';
      
      const fd = new FormData();
      const formData = new FormData(signupForm);
      fd.append('name', formData.get('name'));
      fd.append('email', formData.get('email'));
      fd.append('password', formData.get('password'));
      fd.append('role', formData.get('role'));

      const dataUrl = formData.get('photoData');
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (file) {
        fd.append('photo', file);
      } else if (dataUrl) {
        const blob = dataURLtoBlob(dataUrl);
        fd.append('photo', blob, 'camera.jpg');
      }

      const res = await fetch('/api/auth/register', { method: 'POST', body: fd });
      const json = await res.json();
      
      if (!json.success) throw new Error(json.error || 'Signup failed');
      
      localStorage.setItem('token', json.token);
      setProfile(json.user);
      updateNavVisibility(); // Show navigation after signup
      
      if (signupMsg) signupMsg.textContent = 'Account created!';
      
      // Hide auth page and show dashboard
      const authPageContainer = document.getElementById('authPageContainer');
      const mainSidebar = document.getElementById('mainSidebar');
      const mainContent = document.getElementById('mainContent');
      
      if (authPageContainer) authPageContainer.style.display = 'none';
      if (mainSidebar) mainSidebar.style.display = 'flex';
      if (mainContent) mainContent.style.display = 'block';
      
      // Navigate to dashboard
      const dashboardPage = document.getElementById('dashboardPage');
      if (dashboardPage) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        dashboardPage.classList.add('active');
        
        // Load dashboard data after signup
        if (typeof loadDashboardStats === 'function') {
          loadDashboardStats();
        }
      }
      
      // preload references for datalists
      preloadReferences();
    } catch (err) {
      console.error('Signup error:', err);
      if (signupMsg) {
        signupMsg.textContent = err.message;
      } else {
        alert('Signup failed: ' + err.message);
      }
    }
  });

  if (loginForm) loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get message element once at the start
    const loginMsg = document.getElementById('loginMsg');
    
    try {
      if (loginMsg) loginMsg.textContent = 'Signing in...';
      
      const formData = new FormData(loginForm);
      const payload = { email: formData.get('email'), password: formData.get('password') };
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      
      if (!json.success) throw new Error(json.error || 'Login failed');
      
      localStorage.setItem('token', json.token);
      setProfile(json.user);
      updateNavVisibility(); // Show navigation after login
      
      if (loginMsg) loginMsg.textContent = 'Logged in.';
      
      // Hide auth page and show dashboard
      const authPageContainer = document.getElementById('authPageContainer');
      const mainSidebar = document.getElementById('mainSidebar');
      const mainContent = document.getElementById('mainContent');
      
      console.log('Auth container:', authPageContainer);
      console.log('Sidebar:', mainSidebar);
      console.log('Main content:', mainContent);
      
      if (authPageContainer) {
        authPageContainer.style.display = 'none';
        console.log('✅ Auth page hidden');
      }
      if (mainSidebar) {
        mainSidebar.style.display = 'flex';
        console.log('✅ Sidebar shown');
      }
      if (mainContent) {
        mainContent.style.display = 'block';
        console.log('✅ Main content shown');
      }
      
      // Navigate to dashboard
      const dashboardPage = document.getElementById('dashboardPage');
      console.log('Dashboard page:', dashboardPage);
      
      if (dashboardPage) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        dashboardPage.classList.add('active');
        console.log('✅ Dashboard set to active');
        
        // Load dashboard data after login
        if (typeof loadDashboardStats === 'function') {
          loadDashboardStats();
          console.log('✅ Dashboard stats loading');
        }
      }
      
      // Update theme toggle button icon based on saved theme
      setTimeout(() => {
        const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('theme');
        if (themeToggle && savedTheme === 'dark') {
          themeToggle.textContent = '☀️';
          themeToggle.title = 'Switch to Light Theme';
        }
      }, 100);
      
      // Load dashboard stats after login
      setTimeout(() => {
        if (typeof window.loadDashboardStats === 'function') {
          console.log('🔄 Calling loadDashboardStats after login...');
          window.loadDashboardStats();
        } else {
          console.error('❌ loadDashboardStats function not found!');
        }
      }, 300);
      
      // preload references for datalists
      preloadReferences();
    } catch (err) {
      console.error('Login error:', err);
      if (loginMsg) {
        loginMsg.textContent = err.message;
      } else {
        alert('Login failed: ' + err.message);
      }
    }
  });
})();

// ===== CAMERA FUNCTIONALITY (Global for all forms) =====
let cameraStreams = {};

window.openCamera = async function(type) {
  const video = document.getElementById(`${type}Camera`);
  const captureBtn = document.getElementById(`capture${type.charAt(0).toUpperCase() + type.slice(1)}Btn`);
  const closeBtn = document.getElementById(`close${type.charAt(0).toUpperCase() + type.slice(1)}CameraBtn`);
  const canvas = document.getElementById(`${type}Snapshot`);
  
  if (!video) {
    alert('Camera element not found!');
    return;
  }
  
  try {
    // Check if browser supports camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('❌ Camera not supported by your browser!\n\nPlease use Chrome, Firefox, or Edge.');
      return;
    }
    
    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    
    // Save stream reference
    cameraStreams[type] = stream;
    
    // Show video feed
    video.srcObject = stream;
    video.style.display = 'block';
    
    // Hide canvas if it was showing
    if (canvas) canvas.style.display = 'none';
    
    // Show capture and close buttons
    if (captureBtn) captureBtn.style.display = 'inline-block';
    if (closeBtn) closeBtn.style.display = 'inline-block';
    
    console.log('✅ Camera opened for:', type);
  } catch (err) {
    console.error('Camera error:', err);
    alert('❌ Failed to access camera!\n\n' + 
          'Error: ' + err.message + '\n\n' +
          'Please allow camera permission in your browser.');
  }
};

window.capturePhoto = function(type) {
  const video = document.getElementById(`${type}Camera`);
  const canvas = document.getElementById(`${type}Snapshot`);
  const photoData = document.getElementById(`${type}PhotoData`);
  const captureBtn = document.getElementById(`capture${type.charAt(0).toUpperCase() + type.slice(1)}Btn`);
  const closeBtn = document.getElementById(`close${type.charAt(0).toUpperCase() + type.slice(1)}CameraBtn`);
  
  if (!video || !canvas || !photoData) {
    alert('Camera elements not found!');
    return;
  }
  
  if (!video.videoWidth) {
    alert('Camera not ready yet! Please wait a moment.');
    return;
  }
  
  // Set canvas size to match video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Draw video frame to canvas
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  // Show canvas with captured image
  canvas.style.display = 'block';
  video.style.display = 'none';
  
  // Convert to base64 and save
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  photoData.value = dataUrl;
  
  // Stop camera
  closeCamera(type);
  
  // Hide buttons
  if (captureBtn) captureBtn.style.display = 'none';
  if (closeBtn) closeBtn.style.display = 'none';
  
  alert('✅ Photo captured! Click "Add" button to save.');
  console.log('✅ Photo captured for:', type);
};

window.closeCamera = function(type) {
  const video = document.getElementById(`${type}Camera`);
  const captureBtn = document.getElementById(`capture${type.charAt(0).toUpperCase() + type.slice(1)}Btn`);
  const closeBtn = document.getElementById(`close${type.charAt(0).toUpperCase() + type.slice(1)}CameraBtn`);
  
  // Stop camera stream
  if (cameraStreams[type]) {
    cameraStreams[type].getTracks().forEach(track => track.stop());
    delete cameraStreams[type];
  }
  
  // Hide video
  if (video) {
    video.srcObject = null;
    video.style.display = 'none';
  }
  
  // Hide buttons
  if (captureBtn) captureBtn.style.display = 'none';
  if (closeBtn) closeBtn.style.display = 'none';
  
  console.log('✅ Camera closed for:', type);
};

/* ============================================
   PAYMENT & EXAM PASS MANAGEMENT
   ============================================ */

// Payment form submission
document.getElementById('addPaymentForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const studentInput = fd.get('student_id') || '';
  const studentId = resolveStudentId(studentInput) || studentInput;
  
  const obj = {
    student_id: studentId,
    paymentType: fd.get('paymentType'),
    amount: Number(fd.get('amount')),
    paymentMethod: fd.get('paymentMethod'),
    semester: fd.get('semester'),
    academicYear: fd.get('academicYear'),
    transactionReference: fd.get('transactionReference'),
    description: fd.get('description')
  };
  
  try {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: {'Content-Type':'application/json', ...authHeaders()},
      body: JSON.stringify(obj)
    });
    const json = await res.json();
    
    if (!json.success) {
      alert('Failed to submit payment: ' + (json.error || 'Unknown error'));
      return;
    }
    
    alert(`Payment submitted successfully!\n\nReceipt Number: ${json.payment.receiptNumber}\nStatus: ${json.payment.status}\n\nThe payment is now pending confirmation from the financial department.`);
    e.target.reset();
    loadPayments();
  } catch (err) {
    alert('Error submitting payment: ' + err.message);
  }
});

// Load all payments
window.loadPayments = async function() {
  const tbody = document.querySelector('#paymentsTable tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="9">Loading...</td></tr>';
  }
  
  try {
    const data = await api('/payments', { headers: { ...authHeaders() } });
    const payments = data.payments || [];
    
    if (tbody) {
      if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9">No payments yet</td></tr>';
        return;
      }
      
      tbody.innerHTML = payments.map(p => {
        const student = p.student_id;
        const studentDisp = student ? `${student.name}${student.registrationNo ? ' (' + student.registrationNo + ')' : ''}` : 'N/A';
        
        // Status badge
        const statusBadge = p.status === 'Confirmed' 
          ? `<span style="background: #4CAF50; color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.85em;">✓ Confirmed</span>`
          : p.status === 'Rejected'
          ? `<span style="background: #f44336; color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.85em;">✗ Rejected</span>`
          : `<span style="background: #FFC107; color: black; padding: 3px 8px; border-radius: 3px; font-size: 0.85em;">⏳ Pending</span>`;
        
        // Exam Pass Number display
        const examPassDisplay = p.examPassId && p.examPassId.passNumber
          ? `<span onclick="quickVerifyPass('${p.examPassId.passNumber}')" style="background: #2196F3; color: white; padding: 4px 8px; border-radius: 3px; font-size: 0.85em; font-weight: bold; cursor: pointer; text-decoration: underline;" title="Click to verify">🎫 ${p.examPassId.passNumber}</span>`
          : p.status === 'Confirmed' && p.paymentType === 'Exam Fee'
          ? `<span style="color: #999; font-size: 0.85em;">⏳ Generating...</span>`
          : `<span style="color: #999; font-size: 0.85em;">—</span>`;
        
        const actions = p.status === 'Pending'
          ? `<button onclick="confirmPayment('${p._id}')" style="padding: 5px 10px; font-size: 0.85em; background: #4CAF50;">✅ Confirm</button>
             <button onclick="rejectPayment('${p._id}')" style="padding: 5px 10px; font-size: 0.85em; background: #f44336;">❌ Reject</button>`
          : p.status === 'Confirmed' && p.paymentType === 'Exam Fee' && !p.examPassGenerated
          ? `<button onclick="generateExamPassManually('${p._id}')" style="padding: 5px 10px; font-size: 0.85em; background: #2196F3;">🎫 Generate Pass</button>`
          : p.status === 'Confirmed' && p.examPassGenerated
          ? `<button onclick="viewPaymentDetails('${p._id}')" style="padding: 5px 10px; font-size: 0.85em;">👁️ View</button>`
          : `<button onclick="viewPaymentDetails('${p._id}')" style="padding: 5px 10px; font-size: 0.85em;">👁️ View</button>`;
        
        return `
        <tr>
          <td>${p.receiptNumber || 'N/A'}</td>
          <td>${studentDisp}</td>
          <td>${p.paymentType || 'N/A'}</td>
          <td>$${p.amount?.toFixed(2) || '0.00'}</td>
          <td>${p.paymentMethod || 'N/A'}</td>
          <td>${statusBadge}</td>
          <td>${examPassDisplay}</td>
          <td>${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</td>
          <td>${actions}</td>
        </tr>`;
      }).join('');
    }
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="9">Error loading payments: ${err.message}</td></tr>`;
  }
};

// Confirm payment
window.confirmPayment = async function(paymentId) {
  if (!confirm('Are you sure you want to confirm this payment? This will generate an exam pass if it\'s an exam fee payment.')) return;
  
  try {
    const res = await fetch(`/api/payments/${paymentId}/confirm`, {
      method: 'POST',
      headers: {'Content-Type':'application/json', ...authHeaders()},
      body: JSON.stringify({})
    });
    const json = await res.json();
    
    if (!json.success) {
      alert('Failed to confirm payment: ' + (json.error || 'Unknown error'));
      return;
    }
    
    let message = 'Payment confirmed successfully!';
    if (json.examPass) {
      message += `\n\n🎫 Exam Pass Generated!\nPass Number: ${json.examPass.passNumber}\nValid Until: ${new Date(json.examPass.expiryDate).toLocaleDateString()}`;
    }
    alert(message);
    loadPayments();
    if (json.examPass) loadExamPasses();
  } catch (err) {
    alert('Error confirming payment: ' + err.message);
  }
};

// Reject payment
window.rejectPayment = async function(paymentId) {
  const reason = prompt('Please enter reason for rejection:');
  if (!reason) return;
  
  try {
    const res = await fetch(`/api/payments/${paymentId}/reject`, {
      method: 'POST',
      headers: {'Content-Type':'application/json', ...authHeaders()},
      body: JSON.stringify({ reason })
    });
    const json = await res.json();
    
    if (!json.success) {
      alert('Failed to reject payment: ' + (json.error || 'Unknown error'));
      return;
    }
    
    alert('Payment rejected successfully.');
    loadPayments();
  } catch (err) {
    alert('Error rejecting payment: ' + err.message);
  }
};

// Manually generate exam pass for confirmed payment
window.generateExamPassManually = async function(paymentId) {
  if (!confirm('Generate exam pass for this payment?')) return;
  
  try {
    const res = await fetch(`/api/payments/${paymentId}/generate-exam-pass`, {
      method: 'POST',
      headers: {'Content-Type':'application/json', ...authHeaders()},
      body: JSON.stringify({})
    });
    const json = await res.json();
    
    if (!json.success) {
      alert('Failed to generate exam pass: ' + (json.error || 'Unknown error'));
      return;
    }
    
    alert(`🎫 Exam Pass Generated!\n\nPass Number: ${json.examPass.passNumber}\nValid Until: ${new Date(json.examPass.expiryDate).toLocaleDateString()}`);
    loadPayments();
    loadExamPasses();
  } catch (err) {
    alert('Error generating exam pass: ' + err.message);
  }
};

// View payment details
window.viewPaymentDetails = async function(paymentId) {
  alert('Payment details view - implementation pending');
};

// Filter payments
window.filterPayments = function(status) {
  loadPayments().then(() => {
    const tbody = document.querySelector('#paymentsTable tbody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      if (status === 'All') {
        row.style.display = '';
      } else {
        const statusCell = row.cells[5];
        if (statusCell && statusCell.textContent.includes(status)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      }
    });
  });
};

// ============ EXAM PASS FUNCTIONS ============

// Load all exam passes
window.loadExamPasses = async function() {
  const tbody = document.querySelector('#examPassesTable tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';
  }
  
  try {
    const data = await api('/exam-passes', { headers: { ...authHeaders() } });
    const examPasses = data.examPasses || [];
    
    if (tbody) {
      if (examPasses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No exam passes yet</td></tr>';
        return;
      }
      
      tbody.innerHTML = examPasses.map(ep => {
        const student = ep.student_id;
        const studentDisp = student ? `${student.name}${student.registrationNo ? ' (' + student.registrationNo + ')' : ''}` : 'N/A';
        
        // Check if valid
        const isExpired = new Date(ep.expiryDate) < new Date();
        const statusBadge = ep.status === 'Active' && !isExpired
          ? `<span style="background: #4CAF50; color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.85em;">✅ Active</span>`
          : ep.status === 'Revoked'
          ? `<span style="background: #f44336; color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.85em;">🚫 Revoked</span>`
          : `<span style="background: #9E9E9E; color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.85em;">⏰ Expired</span>`;
        
        const actions = ep.status === 'Active'
          ? `<button onclick="viewExamPassDetails('${ep._id}')" style="padding: 5px 10px; font-size: 0.85em;">👁️ View</button>
             <button onclick="printExamPass('${ep._id}')" style="padding: 5px 10px; font-size: 0.85em; background: #2196F3;">🖨️ Print</button>
             <button onclick="revokeExamPass('${ep._id}')" style="padding: 5px 10px; font-size: 0.85em; background: #f44336;">🚫 Revoke</button>`
          : `<button onclick="viewExamPassDetails('${ep._id}')" style="padding: 5px 10px; font-size: 0.85em;">👁️ View</button>`;
        
        return `
        <tr>
          <td><strong>${ep.passNumber || 'N/A'}</strong></td>
          <td>${studentDisp}</td>
          <td>${ep.semester || 'N/A'}</td>
          <td>${ep.examType || 'N/A'}</td>
          <td>${ep.issueDate ? new Date(ep.issueDate).toLocaleDateString() : 'N/A'}</td>
          <td>${ep.expiryDate ? new Date(ep.expiryDate).toLocaleDateString() : 'N/A'}</td>
          <td>${statusBadge}</td>
          <td>${actions}</td>
        </tr>`;
      }).join('');
    }
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="8">Error loading exam passes: ${err.message}</td></tr>`;
  }
};

// Verify exam pass
window.verifyExamPass = async function() {
  let passNumber = document.getElementById('verifyPassNumber').value.trim();
  const resultDiv = document.getElementById('verifyPassResult');
  
  if (!passNumber) {
    resultDiv.innerHTML = '<p style="color: orange;">Please enter a pass number.</p>';
    return;
  }
  
  // Clean the pass number: remove emojis and extra spaces
  passNumber = passNumber.replace(/[^\w-]/g, '').trim();
  
  if (!passNumber || !passNumber.startsWith('EP-')) {
    resultDiv.innerHTML = '<p style="color: orange;">Please enter a valid pass number (e.g., EP-2025-000001).</p>';
    return;
  }
  
  try {
    const data = await api(`/exam-passes/verify/${passNumber}`, { headers: { ...authHeaders() } });
    
    if (!data.success) {
      resultDiv.innerHTML = `<div style="background: #ffebee; padding: 15px; border-radius: 5px; border-left: 4px solid #f44336;">
        <h4 style="margin: 0 0 10px 0; color: #c62828;">❌ Invalid Pass</h4>
        <p>${data.error || 'Pass not found'}</p>
      </div>`;
      return;
    }
    
    const ep = data.examPass;
    const student = ep.student_id;
    const validIcon = data.isValid ? '✅' : '❌';
    const validText = data.isValid ? 'VALID' : 'INVALID';
    const validColor = data.isValid ? '#4CAF50' : '#f44336';
    
    resultDiv.innerHTML = `<div style="background: ${data.isValid ? '#e8f5e9' : '#ffebee'}; padding: 15px; border-radius: 5px; border-left: 4px solid ${validColor};">
      <h3 style="margin: 0 0 15px 0; color: ${validColor};">${validIcon} Pass ${validText}</h3>
      <p><strong>Pass Number:</strong> ${ep.passNumber}</p>
      <p><strong>Student:</strong> ${student?.name} ${student?.registrationNo ? '(' + student.registrationNo + ')' : ''}</p>
      <p><strong>Semester:</strong> ${ep.semester}</p>
      <p><strong>Exam Type:</strong> ${ep.examType}</p>
      <p><strong>Issue Date:</strong> ${new Date(ep.issueDate).toLocaleDateString()}</p>
      <p><strong>Expiry Date:</strong> ${new Date(ep.expiryDate).toLocaleDateString()}</p>
      <p><strong>Status:</strong> ${ep.status}</p>
      ${data.message ? `<p style="margin-top: 10px; font-style: italic;">${data.message}</p>` : ''}
    </div>`;
  } catch (err) {
    resultDiv.innerHTML = `<p style="color: red;">Error verifying pass: ${err.message}</p>`;
  }
};

// Quick verify pass from payment table
window.quickVerifyPass = function(passNumber) {
  // Navigate to exam passes page
  if (typeof showPage === 'function') {
    showPage('examPasses');
  }
  
  // Wait a moment for page to load, then fill and trigger verification
  setTimeout(() => {
    const input = document.getElementById('verifyPassNumber');
    if (input) {
      input.value = passNumber;
      input.focus();
      // Auto-trigger verification
      if (typeof verifyExamPass === 'function') {
        verifyExamPass();
      }
    }
  }, 300);
};

// View exam pass details
window.viewExamPassDetails = async function(examPassId) {
  try {
    const data = await api(`/exam-passes/${examPassId}`, { headers: { ...authHeaders() } });
    if (!data.success) {
      alert('Failed to load exam pass details');
      return;
    }
    
    const ep = data.examPass;
    const student = ep.student_id;
    const payment = ep.payment_id;
    
    const details = `
Exam Pass Details
==================
Pass Number: ${ep.passNumber}
Student: ${student?.name} ${student?.registrationNo ? '(' + student.registrationNo + ')' : ''}
Semester: ${ep.semester}
Academic Year: ${ep.academicYear}
Exam Type: ${ep.examType}

Issue Date: ${new Date(ep.issueDate).toLocaleDateString()}
Expiry Date: ${new Date(ep.expiryDate).toLocaleDateString()}
Status: ${ep.status}
Valid: ${data.isValid ? 'Yes ✅' : 'No ❌'}

Payment Receipt: ${payment?.receiptNumber || 'N/A'}
Amount Paid: $${payment?.amount?.toFixed(2) || 'N/A'}

${ep.notes ? '\nNotes: ' + ep.notes : ''}
    `;
    
    alert(details);
  } catch (err) {
    alert('Error loading exam pass details: ' + err.message);
  }
};

// Print exam pass
window.printExamPass = function(examPassId) {
  alert('Print exam pass feature - Opens printable exam pass document (implementation pending)');
};

// Revoke exam pass
window.revokeExamPass = async function(examPassId) {
  const reason = prompt('Please enter reason for revoking this exam pass:');
  if (!reason) return;
  
  try {
    const res = await fetch(`/api/exam-passes/${examPassId}/revoke`, {
      method: 'POST',
      headers: {'Content-Type':'application/json', ...authHeaders()},
      body: JSON.stringify({ reason })
    });
    const json = await res.json();
    
    if (!json.success) {
      alert('Failed to revoke exam pass: ' + (json.error || 'Unknown error'));
      return;
    }
    
    alert('Exam pass revoked successfully.');
    loadExamPasses();
  } catch (err) {
    alert('Error revoking exam pass: ' + err.message);
  }
};

// Filter exam passes
window.filterExamPasses = function(status) {
  loadExamPasses().then(() => {
    const tbody = document.querySelector('#examPassesTable tbody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      if (status === 'All') {
        row.style.display = '';
      } else {
        const statusCell = row.cells[6];
        if (statusCell && statusCell.textContent.includes(status)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      }
    });
  });
};
