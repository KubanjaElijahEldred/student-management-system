// MongoDB Query Functions

// Helper to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

window.runComparisonQuery = async function() {
  const collection = 'students'; // Default to students collection
  const field = document.getElementById('comparisonField').value;
  const operator = document.getElementById('comparisonOp').value;
  const value = document.getElementById('comparisonValue').value;
  const output = document.getElementById('comparisonResults');
  
  if (!field || !value) {
    output.textContent = 'Please fill all fields';
    return;
  }
  
  output.textContent = 'Running query...';
  
  try {
    const query = { [field]: { [operator]: isNaN(value) ? value : Number(value) } };
    const res = await fetch(`/api/${collection}`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    let data = await res.json();
    
    // Filter results based on query
    if (Array.isArray(data)) {
      data = data.filter(item => {
        const itemValue = item[field];
        const compareValue = isNaN(value) ? value : Number(value);
        
        switch(operator) {
          case '$eq': return itemValue == compareValue;
          case '$ne': return itemValue != compareValue;
          case '$gt': return Number(itemValue) > Number(compareValue);
          case '$lt': return Number(itemValue) < Number(compareValue);
          case '$gte': return Number(itemValue) >= Number(compareValue);
          case '$lte': return Number(itemValue) <= Number(compareValue);
          default: return true;
        }
      });
    }
    
    if (data.length === 0) {
      output.innerHTML = '<p style="color: var(--text-secondary);">No results found</p>';
    } else {
      // Create a formatted table
      const table = `
        <p style="margin-bottom: 10px; color: var(--primary-color); font-weight: bold;">Found ${data.length} results:</p>
        <table style="width: 100%; border-collapse: collapse; background: var(--card-bg); color: var(--text-primary);">
          <thead>
            <tr style="background: var(--primary-color); color: white;">
              <th style="padding: 8px; border: 1px solid var(--border-color);">Name</th>
              <th style="padding: 8px; border: 1px solid var(--border-color);">Age</th>
              <th style="padding: 8px; border: 1px solid var(--border-color);">Gender</th>
              <th style="padding: 8px; border: 1px solid var(--border-color);">Reg No</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(s => `
              <tr>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${s.name || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${s.age || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${s.gender || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${s.registrationNo || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      output.innerHTML = table;
    }
  } catch (err) {
    output.textContent = 'Error: ' + err.message;
  }
};

window.runLogicalQuery = async function() {
  const collection = 'students'; // Default to students collection
  const operator = document.getElementById('logicalOp').value;
  const output = document.getElementById('logicalResults');
  
  output.textContent = 'Running query...';
  
  try {
    const res = await fetch(`/api/${collection}`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    let data = await res.json();
    
    // Example queries based on operator
    if (Array.isArray(data)) {
      let filtered = data;
      
      switch(operator) {
        case '$and':
          // Show students with age AND gender
          filtered = data.filter(s => s.age && s.gender);
          break;
        case '$or':
          // Show students with age OR email
          filtered = data.filter(s => s.age || s.email);
          break;
        case '$nor':
          // Show students without age or gender
          filtered = data.filter(s => !s.age && !s.gender);
          break;
        default:
          filtered = data;
      }
      
      const opName = operator === '$and' ? 'AND' : operator === '$or' ? 'OR' : 'NOR';
      const table = `
        <p style="margin-bottom: 10px; color: var(--primary-color); font-weight: bold;">${opName} Query - Found ${filtered.length} results:</p>
        <table style="width: 100%; border-collapse: collapse; background: var(--card-bg); color: var(--text-primary);">
          <thead>
            <tr style="background: var(--primary-color); color: white;">
              <th style="padding: 8px; border: 1px solid var(--border-color);">Name</th>
              <th style="padding: 8px; border: 1px solid var(--border-color);">Age</th>
              <th style="padding: 8px; border: 1px solid var(--border-color);">Gender</th>
              <th style="padding: 8px; border: 1px solid var(--border-color);">Email</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(s => `
              <tr>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${s.name || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${s.age || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${s.gender || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${s.email || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      output.innerHTML = table;
    } else {
      output.textContent = JSON.stringify(data, null, 2);
    }
  } catch (err) {
    output.textContent = 'Error: ' + err.message;
  }
};

window.runSortQuery = async function() {
  const collection = 'students'; // Default to students collection
  const field = document.getElementById('sortField').value;
  const order = document.getElementById('sortOrder').value;
  const limit = parseInt(document.getElementById('limitValue')?.value || 5);
  const output = document.getElementById('sortResults');
  
  if (!field) {
    output.textContent = 'Please select a field to sort by';
    return;
  }
  
  output.textContent = 'Running query...';
  
  try {
    const res = await fetch(`/api/${collection}`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    let data = await res.json();
    
    if (Array.isArray(data)) {
      // Sort the data
      data.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        if (typeof aVal === 'string') {
          return order === '1' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        } else {
          return order === '1' 
            ? aVal - bVal
            : bVal - aVal;
        }
      });
      
      // Apply limit
      const limited = data.slice(0, limit);
      
      const table = `
        <p style="margin-bottom: 10px; color: var(--primary-color); font-weight: bold;">
          Sorted by ${field} (${order === '1' ? 'Ascending' : 'Descending'}) - Showing ${limited.length} of ${data.length} results:
        </p>
        <table style="width: 100%; border-collapse: collapse; background: var(--card-bg); color: var(--text-primary);">
          <thead>
            <tr style="background: var(--primary-color); color: white;">
              <th style="padding: 8px; border: 1px solid var(--border-color);">Name</th>
              <th style="padding: 8px; border: 1px solid var(--border-color);">Age</th>
              <th style="padding: 8px; border: 1px solid var(--border-color);">Gender</th>
              <th style="padding: 8px; border: 1px solid var(--border-color);">Reg No</th>
            </tr>
          </thead>
          <tbody>
            ${limited.map(s => `
              <tr>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${s.name || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${s.age || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${s.gender || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${s.registrationNo || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      output.innerHTML = table;
    } else {
      output.textContent = JSON.stringify(data, null, 2);
    }
  } catch (err) {
    output.textContent = 'Error: ' + err.message;
  }
};

console.log('✅ Query functions loaded with authentication');
