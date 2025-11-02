// Dashboard JavaScript - MongoDB Query Demonstrations

// Auth helper
function authHeaders() {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ============ MongoDB Query Builder Functions ============

// Comparison Operators
async function runComparisonQuery() {
  const field = document.getElementById('comparisonField').value;
  const operator = document.getElementById('comparisonOp').value;
  const value = document.getElementById('comparisonValue').value;
  
  if (!value) {
    alert('Please enter a value');
    return;
  }
  
  const resultsDiv = document.getElementById('comparisonResults');
  resultsDiv.innerHTML = '<p>Loading...</p>';
  
  try {
    const res = await fetch('/api/queries/comparison', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ field, operator, value })
    });
    
    const data = await res.json();
    
    if (data.success) {
      const queryDisplay = JSON.stringify(data.query, null, 2);
      const resultsTable = data.results.map(s => `
        <tr>
          <td>${s.registrationNo || 'N/A'}</td>
          <td>${s.name}</td>
          <td>${s.age || 'N/A'}</td>
          <td>${s.gender || 'N/A'}</td>
        </tr>
      `).join('');
      
      resultsDiv.innerHTML = `
        <h4>📋 Query:</h4>
        <pre>${queryDisplay}</pre>
        <h4>📊 Results (${data.count} found):</h4>
        <table class="widget-table">
          <thead>
            <tr><th>Reg No</th><th>Name</th><th>Age</th><th>Gender</th></tr>
          </thead>
          <tbody>${resultsTable || '<tr><td colspan="4">No results</td></tr>'}</tbody>
        </table>
      `;
    } else {
      resultsDiv.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
    }
  } catch (err) {
    resultsDiv.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
  }
}

// Logical Operators
async function runLogicalQuery() {
  const operator = document.getElementById('logicalOp').value;
  
  const resultsDiv = document.getElementById('logicalResults');
  resultsDiv.innerHTML = '<p>Loading...</p>';
  
  try {
    const res = await fetch('/api/queries/logical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ operator })
    });
    
    const data = await res.json();
    
    if (data.success) {
      const queryDisplay = JSON.stringify(data.query, null, 2);
      const resultsTable = data.results.map(s => `
        <tr>
          <td>${s.registrationNo || 'N/A'}</td>
          <td>${s.name}</td>
          <td>${s.age || 'N/A'}</td>
          <td>${s.gender || 'N/A'}</td>
        </tr>
      `).join('');
      
      resultsDiv.innerHTML = `
        <h4>📋 Query:</h4>
        <pre>${queryDisplay}</pre>
        <h4>📊 Results (${data.count} found):</h4>
        <table class="widget-table">
          <thead>
            <tr><th>Reg No</th><th>Name</th><th>Age</th><th>Gender</th></tr>
          </thead>
          <tbody>${resultsTable || '<tr><td colspan="4">No results</td></tr>'}</tbody>
        </table>
      `;
    } else {
      resultsDiv.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
    }
  } catch (err) {
    resultsDiv.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
  }
}

// Sort and Limit
async function runSortQuery() {
  const sortField = document.getElementById('sortField').value;
  const sortOrder = document.getElementById('sortOrder').value;
  const limit = document.getElementById('limitValue').value;
  
  const resultsDiv = document.getElementById('sortResults');
  resultsDiv.innerHTML = '<p>Loading...</p>';
  
  try {
    const res = await fetch('/api/queries/sort', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ sortField, sortOrder, limit })
    });
    
    const data = await res.json();
    
    if (data.success) {
      const sortDisplay = JSON.stringify(data.sortBy, null, 2);
      const resultsTable = data.results.map(s => `
        <tr>
          <td>${s.registrationNo || 'N/A'}</td>
          <td>${s.name}</td>
          <td>${s.age || 'N/A'}</td>
          <td>${s.gender || 'N/A'}</td>
        </tr>
      `).join('');
      
      resultsDiv.innerHTML = `
        <h4>📋 Sort By:</h4>
        <pre>${sortDisplay}</pre>
        <h4>Limit: ${data.limit}</h4>
        <h4>📊 Results (${data.count} found):</h4>
        <table class="widget-table">
          <thead>
            <tr><th>Reg No</th><th>Name</th><th>Age</th><th>Gender</th></tr>
          </thead>
          <tbody>${resultsTable || '<tr><td colspan="4">No results</td></tr>'}</tbody>
        </table>
      `;
    } else {
      resultsDiv.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
    }
  } catch (err) {
    resultsDiv.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
  }
}

// Search Function
async function searchStudents(query) {
  try {
    const res = await fetch(`/api/queries/search?q=${encodeURIComponent(query)}`, {
      headers: { ...authHeaders() }
    });
    
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
}

// Filter Function
async function filterStudents(filters) {
  try {
    const res = await fetch('/api/queries/filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(filters)
    });
    
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Filter error:', err);
    return [];
  }
}

// Make functions globally available
window.runComparisonQuery = runComparisonQuery;
window.runLogicalQuery = runLogicalQuery;
window.runSortQuery = runSortQuery;
window.searchStudents = searchStudents;
window.filterStudents = filterStudents;

console.log('✅ MongoDB Query Builder loaded!');
console.log('📘 All comparison operators ready: $eq, $ne, $gt, $lt, $gte, $lte');
console.log('🔗 All logical operators ready: $and, $or, $nor');
console.log('📊 Sorting and limiting ready');
console.log('🔍 Search and filter ready');
