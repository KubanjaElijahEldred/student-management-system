// Global Search Functionality
let globalSearchCache = {
  students: [],
  courses: [],
  teachers: [],
  payments: [],
  lastUpdate: null
};

let searchDebounceTimer = null;

// Handle global search input
window.handleGlobalSearch = async function(event) {
  const query = event.target.value.trim();
  const resultsContainer = document.getElementById('globalSearchResults');
  
  // Clear previous debounce timer
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  
  // Hide results if query is empty
  if (query.length < 2) {
    resultsContainer.classList.remove('active');
    return;
  }
  
  // Debounce search - wait 300ms after user stops typing
  searchDebounceTimer = setTimeout(async () => {
    await performGlobalSearch(query);
  }, 300);
};

// Perform the actual search
async function performGlobalSearch(query) {
  const resultsContainer = document.getElementById('globalSearchResults');
  
  try {
    // Update cache if needed (refresh every 30 seconds or if null)
    const now = Date.now();
    if (!globalSearchCache.lastUpdate || (now - globalSearchCache.lastUpdate > 30000)) {
      await updateSearchCache();
    }
    
    // Search across all cached data
    const results = searchAllData(query);
    
    // Display results
    displaySearchResults(results, query);
    
  } catch (err) {
    console.error('Search error:', err);
    resultsContainer.innerHTML = '<div class="search-no-results">❌ Search failed</div>';
    resultsContainer.classList.add('active');
  }
}

// Update search cache
async function updateSearchCache() {
  try {
    const headers = { ...authHeaders() };
    
    // Fetch all data in parallel
    const [students, courses, teachers, payments] = await Promise.all([
      api('/students', { headers }).catch(() => []),
      api('/courses', { headers }).catch(() => []),
      api('/teachers', { headers }).catch(() => []),
      api('/payments', { headers }).catch(() => [])
    ]);
    
    globalSearchCache = {
      students: Array.isArray(students) ? students : [],
      courses: Array.isArray(courses) ? courses : [],
      teachers: Array.isArray(teachers) ? teachers : [],
      payments: Array.isArray(payments) ? payments : [],
      lastUpdate: Date.now()
    };
    
    console.log('🔍 Search cache updated:', {
      students: globalSearchCache.students.length,
      courses: globalSearchCache.courses.length,
      teachers: globalSearchCache.teachers.length,
      payments: globalSearchCache.payments.length
    });
    
  } catch (err) {
    console.error('Failed to update search cache:', err);
  }
}

// Search across all data types
function searchAllData(query) {
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  // Search students
  globalSearchCache.students.forEach(student => {
    // Skip students without _id (corrupted data)
    if (!student._id) {
      console.warn('⚠️ Skipping student without ID:', student.name);
      return;
    }
    
    const name = (student.name || '').toLowerCase();
    const regNo = (student.registrationNo || '').toLowerCase();
    const courses = (student.courses || []).join(' ').toLowerCase();
    
    if (name.includes(lowerQuery) || regNo.includes(lowerQuery) || courses.includes(lowerQuery)) {
      results.push({
        type: 'student',
        id: student._id,
        name: student.name,
        detail: `${student.registrationNo || 'No Reg No'} • ${student.courses?.[0] || 'No course'}`,
        data: student
      });
    }
  });
  
  // Search courses
  globalSearchCache.courses.forEach(course => {
    // Skip courses without _id
    if (!course._id) return;
    
    const name = (course.name || '').toLowerCase();
    const code = (course.code || '').toLowerCase();
    
    if (name.includes(lowerQuery) || code.includes(lowerQuery)) {
      results.push({
        type: 'course',
        id: course._id,
        name: course.name,
        detail: `Code: ${course.code || 'N/A'} • ID: ${course._id}`,
        data: course
      });
    }
  });
  
  // Search teachers
  globalSearchCache.teachers.forEach(teacher => {
    // Skip teachers without _id
    if (!teacher._id) return;
    
    const name = (teacher.name || '').toLowerCase();
    const subject = (teacher.subject || '').toLowerCase();
    
    if (name.includes(lowerQuery) || subject.includes(lowerQuery)) {
      results.push({
        type: 'teacher',
        id: teacher._id,
        name: teacher.name,
        detail: `Subject: ${teacher.subject || 'N/A'}`,
        data: teacher
      });
    }
  });
  
  // Search payments
  globalSearchCache.payments.forEach(payment => {
    // Skip payments without _id
    if (!payment._id) return;
    
    const studentName = payment.student_id?.name || '';
    const paymentType = (payment.paymentType || '').toLowerCase();
    const receiptNo = (payment.receiptNo || '').toLowerCase();
    
    if (studentName.toLowerCase().includes(lowerQuery) || 
        paymentType.includes(lowerQuery) || 
        receiptNo.includes(lowerQuery)) {
      results.push({
        type: 'payment',
        id: payment._id,
        name: `${studentName} - ${payment.paymentType}`,
        detail: `${payment.amount} UGX • ${payment.receiptNo || 'No receipt'}`,
        data: payment
      });
    }
  });
  
  // Limit to top 10 results
  return results.slice(0, 10);
}

// Display search results
function displaySearchResults(results, query) {
  const resultsContainer = document.getElementById('globalSearchResults');
  
  if (results.length === 0) {
    resultsContainer.innerHTML = `
      <div class="search-no-results">
        <p>No results found for "${query}"</p>
      </div>
    `;
  } else {
    const html = results.map(result => `
      <div class="search-result-item" onclick="handleSearchResultClick('${result.type}', '${result.id}')">
        <span class="search-result-type ${result.type}">${capitalizeFirst(result.type)}</span>
        <div class="search-result-name">${result.name}</div>
        <div class="search-result-detail">${result.detail}</div>
      </div>
    `).join('');
    
    resultsContainer.innerHTML = html;
  }
  
  resultsContainer.classList.add('active');
}

// Handle clicking on a search result
window.handleSearchResultClick = function(type, id) {
  console.log(`📍 Navigate to ${type}:`, id);
  
  // Hide search results
  const resultsContainer = document.getElementById('globalSearchResults');
  resultsContainer.classList.remove('active');
  
  // Clear search input
  document.getElementById('globalSearch').value = '';
  
  // Navigate to appropriate page
  switch(type) {
    case 'student':
      showPage('students');
      setTimeout(() => {
        // Find and highlight the student in the table
        const rows = document.querySelectorAll('#studentsTable tbody tr');
        rows.forEach(row => {
          if (row.dataset.studentId === id) {
            row.style.background = '#FFF9C4';
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              row.style.background = '';
            }, 3000);
          }
        });
      }, 500);
      break;
      
    case 'course':
      showPage('courses');
      setTimeout(() => {
        const rows = document.querySelectorAll('#coursesTable tbody tr');
        rows.forEach(row => {
          if (row.dataset.courseId === id) {
            row.style.background = '#E1BEE7';
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              row.style.background = '';
            }, 3000);
          }
        });
      }, 500);
      break;
      
    case 'teacher':
      showPage('teachers');
      setTimeout(() => {
        const rows = document.querySelectorAll('#teachersTable tbody tr');
        rows.forEach(row => {
          if (row.dataset.teacherId === id) {
            row.style.background = '#C8E6C9';
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              row.style.background = '';
            }, 3000);
          }
        });
      }, 500);
      break;
      
    case 'payment':
      showPage('payments');
      setTimeout(() => {
        const rows = document.querySelectorAll('#paymentsTable tbody tr');
        rows.forEach(row => {
          if (row.dataset.paymentId === id) {
            row.style.background = '#FFE0B2';
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              row.style.background = '';
            }, 3000);
          }
        });
      }, 500);
      break;
  }
};

// Helper function
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Close search results when clicking outside
document.addEventListener('click', function(event) {
  const searchContainer = document.querySelector('.global-search-container');
  const resultsContainer = document.getElementById('globalSearchResults');
  
  if (searchContainer && !searchContainer.contains(event.target)) {
    if (resultsContainer) {
      resultsContainer.classList.remove('active');
    }
  }
});

// Pre-load search cache after login
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit after login, then pre-load cache
  setTimeout(() => {
    const token = localStorage.getItem('token');
    if (token) {
      updateSearchCache();
    }
  }, 2000);
});

console.log('🔍 Global search loaded');
