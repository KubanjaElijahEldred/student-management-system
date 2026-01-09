// AI Student Companion - Chatbot Feature
let chatHistory = [];
let isProcessing = false;

// Simple cache for instant responses
let dataCache = {
  courses: null,
  students: null,
  payments: null,
  lastUpdate: 0
};

// API helper function with caching
function aiApi(path, opts = {}) {
  const apiStart = Date.now();
  const headers = opts.headers || {};
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Check cache (5 minute expiry)
  const now = Date.now();
  const cacheKey = path.replace('/api/', '').replace('/', '');
  if (dataCache[cacheKey] && (now - dataCache.lastUpdate < 300000)) {
    const cacheTime = Date.now() - apiStart;
    console.log(`💾 Using cached ${cacheKey} (${cacheTime}ms - INSTANT!)`);
    return Promise.resolve(dataCache[cacheKey]);
  }
  
  // Fetch from API
  console.log(`🌐 Fetching ${cacheKey} from API...`);
  return fetch(`/api${path}`, { ...opts, headers })
    .then(r => r.json())
    .then(data => {
      const fetchTime = Date.now() - apiStart;
      // Cache the result
      dataCache[cacheKey] = data;
      dataCache.lastUpdate = now;
      console.log(`✅ Cached ${cacheKey} data (${fetchTime}ms)`);
      return data;
    })
    .catch(err => {
      console.error('API Error:', err);
      return [];
    });
}

// Pre-load data for instant responses
async function preloadData() {
  console.log('🔄 Pre-loading data for instant responses...');
  try {
    await Promise.all([
      aiApi('/courses'),
      aiApi('/students'),
      aiApi('/payments')
    ]);
    console.log('✅ Data pre-loaded and cached!');
  } catch (err) {
    console.log('⚠️ Pre-load failed, will fetch on demand');
  }
}

// Initialize AI Companion
window.initAICompanion = function() {
  console.log('🤖 AI Student Companion initialized');
  
  // Add event listener for chat input
  const chatInput = document.getElementById('aiChatInput');
  const sendBtn = document.getElementById('aiSendBtn');
  
  if (chatInput) {
    console.log('✅ Chat input found');
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        console.log('⌨️ Enter key pressed');
        sendAIMessage();
      }
    });
  } else {
    console.error('❌ Chat input not found');
  }
  
  if (sendBtn) {
    console.log('✅ Send button found');
    sendBtn.addEventListener('click', () => {
      console.log('🖱️ Send button clicked');
      sendAIMessage();
    });
  } else {
    console.error('❌ Send button not found');
  }
  
  // Add welcome message
  addAIMessage('assistant', '👋 Hello! I\'m your AI Student Companion. I can help you with:\n\n• Course information\n• Student records\n• Payment inquiries\n• Study schedules\n• General questions\n\nHow can I assist you today?');
  
  // Pre-load data in background for instant responses
  preloadData();
};

// Send AI message
window.sendAIMessage = async function() {
  const startTime = Date.now();
  console.log('📤 sendAIMessage called');
  
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ Not logged in! AI requires authentication.');
    addAIMessage('assistant', '🔒 Please login first to use the AI Student Companion.\n\nThe AI needs to access your student data and requires authentication.');
    return;
  }
  
  if (isProcessing) {
    console.log('⏸️ Already processing, skipping');
    return;
  }
  
  const input = document.getElementById('aiChatInput');
  if (!input) {
    console.error('❌ Input element not found');
    return;
  }
  
  const message = input.value.trim();
  console.log('💬 Message:', message);
  
  if (!message) {
    console.log('⚠️ Empty message, skipping');
    return;
  }
  
  // Add user message to chat
  addAIMessage('user', message);
  input.value = '';
  
  // Show typing indicator
  showTypingIndicator();
  isProcessing = true;
  
  try {
    console.log('🔄 Processing query...');
    const queryStart = Date.now();
    
    // Process the message
    const response = await processAIQuery(message);
    
    const queryTime = Date.now() - queryStart;
    console.log(`✅ Got response in ${queryTime}ms:`, response.substring(0, 50) + '...');
    
    // Hide typing indicator
    hideTypingIndicator();
    
    // Add AI response
    addAIMessage('assistant', response);
    
    const totalTime = Date.now() - startTime;
    console.log(`⚡ Total response time: ${totalTime}ms`);
    
  } catch (err) {
    console.error('❌ AI Error:', err);
    hideTypingIndicator();
    addAIMessage('assistant', '❌ Sorry, I encountered an error. Please try again.');
  } finally {
    isProcessing = false;
    console.log('✅ Processing complete');
  }
};

// Process AI query
async function processAIQuery(query) {
  const lowerQuery = query.toLowerCase();
  
  // Course-related queries
  if (lowerQuery.includes('course') || lowerQuery.includes('program')) {
    return await handleCourseQuery(query);
  }
  
  // Student-related queries
  if (lowerQuery.includes('student') || lowerQuery.includes('registration')) {
    return await handleStudentQuery(query);
  }
  
  // Payment-related queries
  if (lowerQuery.includes('payment') || lowerQuery.includes('fee') || lowerQuery.includes('tuition')) {
    return await handlePaymentQuery(query);
  }
  
  // Schedule-related queries
  if (lowerQuery.includes('schedule') || lowerQuery.includes('time') || lowerQuery.includes('when')) {
    return await handleScheduleQuery(query);
  }
  
  // General help
  if (lowerQuery.includes('help') || lowerQuery.includes('what can you do')) {
    return getHelpMessage();
  }
  
  // Default response
  return `I understand you're asking about: "${query}"\n\nI can help you with:\n• Course information\n• Student records\n• Payment inquiries\n• Schedules\n\nPlease be more specific, or ask "What can you do?" for more options.`;
}

// Handle course queries
async function handleCourseQuery(query) {
  try {
    console.log('📚 Fetching courses...');
    const courses = await aiApi('/courses');
    
    if (query.toLowerCase().includes('how many') || query.toLowerCase().includes('list')) {
      const courseList = courses.map(c => `• ${c.name} (${c.code})`).join('\n');
      return `📚 **Available Courses (${courses.length} total)**\n\n${courseList}`;
    }
    
    // Search for specific course
    const searchTerm = query.toLowerCase();
    const foundCourse = courses.find(c => 
      c.name.toLowerCase().includes(searchTerm) || 
      c.code.toLowerCase().includes(searchTerm)
    );
    
    if (foundCourse) {
      return `📚 **${foundCourse.name}**\n\n• Code: ${foundCourse.code}\n• Credits: ${foundCourse.credits || 'N/A'}\n• Description: ${foundCourse.description || 'No description available'}`;
    }
    
    return `📚 We have ${courses.length} courses available. Would you like me to list them?`;
    
  } catch (err) {
    return '❌ Unable to fetch course information. Please make sure you\'re logged in.';
  }
}

// Handle student queries
async function handleStudentQuery(query) {
  try {
    console.log('👥 Fetching students...');
    const students = await aiApi('/students');
    
    if (query.toLowerCase().includes('how many') || query.toLowerCase().includes('total')) {
      return `👥 **Student Statistics**\n\n• Total Students: ${students.length}\n• All students are enrolled in various programs`;
    }
    
    // Search for specific student
    const searchTerm = query.toLowerCase();
    const foundStudent = students.find(s => 
      (s.name || '').toLowerCase().includes(searchTerm) || 
      (s.registrationNo || '').toLowerCase().includes(searchTerm)
    );
    
    if (foundStudent) {
      const courses = (foundStudent.courses || []).join(', ') || 'No courses';
      return `👤 **${foundStudent.name}**\n\n• Registration: ${foundStudent.registrationNo || 'N/A'}\n• Courses: ${courses}\n• Contact: ${foundStudent.contact || 'N/A'}`;
    }
    
    return `👥 We currently have ${students.length} registered students. You can search by name or registration number.`;
    
  } catch (err) {
    return '❌ Unable to fetch student information. Please make sure you\'re logged in.';
  }
}

// Handle payment queries
async function handlePaymentQuery(query) {
  try {
    console.log('💳 Fetching payments...');
    const payments = await aiApi('/payments');
    
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const tuitionPayments = payments.filter(p => p.paymentType === 'Tuition Fee');
    const examPayments = payments.filter(p => p.paymentType === 'Exam Fee');
    
    return `💳 **Payment Statistics**\n\n• Total Payments: ${payments.length}\n• Total Amount: ${totalAmount.toLocaleString()} UGX\n• Tuition Payments: ${tuitionPayments.length}\n• Exam Payments: ${examPayments.length}\n\nNeed specific payment details? Ask about a student name or receipt number.`;
    
  } catch (err) {
    return '❌ Unable to fetch payment information. Please make sure you\'re logged in.';
  }
}

// Handle schedule queries
async function handleScheduleQuery(query) {
  return `📅 **Schedule Information**\n\nFor detailed schedules:\n• Go to **Classes** page to view class schedules\n• Go to **Attendance** page to check attendance records\n• Contact your course teacher for specific class times\n\nNeed help with something else?`;
}

// Get help message
function getHelpMessage() {
  return `🤖 **AI Student Companion Help**\n\nI can assist you with:\n\n**📚 Courses**\n• "List all courses"\n• "Tell me about BSE"\n• "How many courses?"\n\n**👥 Students**\n• "How many students?"\n• "Find student Sarah"\n• "Student info 25/DAI/001"\n\n**💳 Payments**\n• "Payment statistics"\n• "Total payments"\n• "Check tuition fees"\n\n**📅 Schedules**\n• "Class schedule"\n• "When is my class?"\n\nJust ask your question naturally!`;
}

// Add message to chat
function addAIMessage(role, content) {
  const chatMessages = document.getElementById('aiChatMessages');
  if (!chatMessages) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-message ai-message-${role}`;
  
  const avatar = role === 'user' ? '👤' : '🤖';
  const label = role === 'user' ? 'You' : 'AI Companion';
  
  messageDiv.innerHTML = `
    <div class="ai-message-avatar">${avatar}</div>
    <div class="ai-message-content">
      <div class="ai-message-label">${label}</div>
      <div class="ai-message-text">${content.replace(/\n/g, '<br>')}</div>
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Add to history
  chatHistory.push({ role, content });
}

// Show typing indicator
function showTypingIndicator() {
  const chatMessages = document.getElementById('aiChatMessages');
  if (!chatMessages) return;
  
  const typingDiv = document.createElement('div');
  typingDiv.className = 'ai-typing-indicator';
  typingDiv.id = 'aiTypingIndicator';
  typingDiv.innerHTML = `
    <div class="ai-message-avatar">🤖</div>
    <div class="ai-typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
  const typingIndicator = document.getElementById('aiTypingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// ULTRA-STRONG Lock mechanism for toggleAIChat
let toggleLocked = false;
let toggleCallCount = 0;
let lastToggleTime = 0;

// Toggle AI chat window
window.toggleAIChat = function() {
  const now = Date.now();
  toggleCallCount++;
  const callId = toggleCallCount;
  
  // DOUBLE PROTECTION: Lock + Time-based throttle
  if (toggleLocked) {
    console.log(`⛔ Toggle LOCKED (call #${callId} blocked)`);
    return;
  }
  
  // Minimum 800ms between toggles
  if (now - lastToggleTime < 800) {
    console.log(`⏱️ Too fast! Wait ${800 - (now - lastToggleTime)}ms (call #${callId} blocked)`);
    return;
  }
  
  // Lock immediately and record time
  toggleLocked = true;
  lastToggleTime = now;
  console.log(`🔄 Toggle AI Chat called (call #${callId})`);
  
  const chatWindow = document.getElementById('aiChatWindow');
  const chatBtn = document.getElementById('aiChatBtn');
  const chatInput = document.getElementById('aiChatInput');
  
  console.log('Chat window:', chatWindow);
  console.log('Chat button:', chatBtn);
  console.log('Chat input:', chatInput);
  
  if (chatWindow && chatBtn) {
    const isOpen = chatWindow.style.display === 'flex';
    console.log('Currently open:', isOpen);
    
    chatWindow.style.display = isOpen ? 'none' : 'flex';
    chatBtn.innerHTML = isOpen ? '🤖' : '✖️';
    chatBtn.title = isOpen ? 'Open AI Companion' : 'Close AI Companion';
    
    console.log('New display state:', chatWindow.style.display);
    
    // Focus input when opening
    if (!isOpen) {
      setTimeout(() => {
        const input = document.getElementById('aiChatInput');
        if (input) {
          console.log('✅ Focusing input field');
          console.log('   - Disabled:', input.disabled);
          console.log('   - ReadOnly:', input.readOnly);
          console.log('   - Display:', window.getComputedStyle(input).display);
          console.log('   - Visibility:', window.getComputedStyle(input).visibility);
          
          // Force enable
          input.disabled = false;
          input.readOnly = false;
          
          // Focus and select
          input.focus();
          input.select();
          
          console.log('✅ Input should now be focused and ready');
        } else {
          console.error('❌ Input field not found for focus');
        }
      }, 300);
    }
    
    // Unlock after animation completes (800ms delay)
    setTimeout(() => {
      toggleLocked = false;
      console.log(`🔓 Toggle unlocked (call #${callId} completed)`);
    }, 800);
    
  } else {
    console.error('❌ Chat elements not found!');
    // Unlock immediately if error
    toggleLocked = false;
  }
};


// Clear chat history
window.clearAIChat = function() {
  if (confirm('Clear chat history?')) {
    chatHistory = [];
    const chatMessages = document.getElementById('aiChatMessages');
    if (chatMessages) {
      chatMessages.innerHTML = '';
      addAIMessage('assistant', '👋 Chat cleared! How can I help you?');
    }
  }
};

// Show/Hide AI button based on login status
function updateAIButtonVisibility() {
  const btn = document.getElementById('aiChatBtn');
  const chatWindow = document.getElementById('aiChatWindow');
  const token = localStorage.getItem('token');
  
  if (btn) {
    if (token) {
      btn.style.display = 'flex';
      console.log('✅ AI button shown (user logged in)');
    } else {
      btn.style.display = 'none';
      if (chatWindow) {
        chatWindow.style.display = 'none';
      }
      console.log('🔒 AI button hidden (user not logged in)');
    }
  }
}

// Check login status periodically (since storage event doesn't fire in same tab)
function checkLoginStatus() {
  const token = localStorage.getItem('token');
  const btn = document.getElementById('aiChatBtn');
  
  if (!btn) return;
  
  const currentDisplay = btn.style.display;
  const shouldShow = !!token;
  const isShowing = currentDisplay === 'flex';
  
  // Update if state changed
  if (shouldShow && !isShowing) {
    console.log('🔑 Login detected! Enabling AI...');
    updateAIButtonVisibility();
    initAICompanion();
  } else if (!shouldShow && isShowing) {
    console.log('🔒 Logout detected! Disabling AI...');
    updateAIButtonVisibility();
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, checking for login...');
  setTimeout(() => {
    const token = localStorage.getItem('token');
    updateAIButtonVisibility();
    
    if (token) {
      console.log('✅ Token found, initializing AI Companion');
      initAICompanion();
    } else {
      console.log('⚠️ No token found, AI disabled until login');
    }
    
    // Check login status every 2 seconds
    setInterval(checkLoginStatus, 2000);
  }, 2000);
});

// Re-initialize after successful login (for other tabs)
window.addEventListener('storage', (e) => {
  if (e.key === 'token') {
    updateAIButtonVisibility();
    
    if (e.newValue) {
      console.log('🔑 Token detected, enabling AI Companion');
      setTimeout(() => {
        initAICompanion();
      }, 500);
    } else {
      console.log('🔒 Token removed, disabling AI Companion');
    }
  }
});

// Clear cache for fresh data
window.clearAICache = function() {
  dataCache = {
    courses: null,
    students: null,
    payments: null,
    lastUpdate: 0
  };
  console.log('🗑️ Cache cleared! Next query will fetch fresh data.');
  // Pre-load fresh data
  preloadData();
};

// ========== CLEAN AI DRAG IMPLEMENTATION ==========
let aiButtonInitialized = false;

function makeAIDraggable() {
  const btn = document.getElementById('aiChatBtn');
  if (!btn || aiButtonInitialized) return;
  
  aiButtonInitialized = true;
  console.log('🎯 Initializing AI drag...');
  
  // Drag state
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0;
  let offsetX = 0, offsetY = 0;
  let dragDistance = 0;
  let clickBlock = false;
  
  // Restore saved position
  const savedX = localStorage.getItem('aiButtonX');
  const savedY = localStorage.getItem('aiButtonY');
  if (savedX && savedY) {
    offsetX = parseFloat(savedX);
    offsetY = parseFloat(savedY);
    btn.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }
  
  // Mouse/Touch down - start potential drag
  function onPointerDown(e) {
    const event = e.touches ? e.touches[0] : e;
    dragStartX = event.clientX - offsetX;
    dragStartY = event.clientY - offsetY;
    dragDistance = 0;
    isDragging = true;
    clickBlock = false; // Reset click block
    btn.style.cursor = 'grabbing';
    btn.style.animation = 'none';
    e.preventDefault(); // Prevent default click behavior
  }
  
  // Mouse/Touch move - perform drag
  function onPointerMove(e) {
    if (!isDragging) return;
    
    const event = e.touches ? e.touches[0] : e;
    const newX = event.clientX - dragStartX;
    const newY = event.clientY - dragStartY;
    
    // Calculate total drag distance
    const dx = newX - offsetX;
    const dy = newY - offsetY;
    dragDistance += Math.abs(dx) + Math.abs(dy);
    
    offsetX = newX;
    offsetY = newY;
    btn.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    
    e.preventDefault();
  }
  
  // Mouse/Touch up - end drag or handle click
  function onPointerUp(e) {
    if (!isDragging) return;
    
    isDragging = false;
    btn.style.cursor = 'grab';
    btn.style.animation = '';
    
    // If dragged > 10px, it's a drag (save position)
    // If dragged < 10px, it's a click (toggle chat)
    if (dragDistance > 10) {
      localStorage.setItem('aiButtonX', offsetX);
      localStorage.setItem('aiButtonY', offsetY);
      console.log('✅ Dragged to:', offsetX, offsetY);
    } else {
      // This was a click, not a drag
      console.log('👆 Clicked - toggling chat');
      toggleAIChat();
    }
    
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Attach event listeners
  btn.addEventListener('mousedown', onPointerDown);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);
  
  btn.addEventListener('touchstart', onPointerDown, { passive: false });
  document.addEventListener('touchmove', onPointerMove, { passive: false });
  document.addEventListener('touchend', onPointerUp, { passive: false });
  
  btn.style.cursor = 'grab';
  console.log('✅ AI button draggable!');
}

// Reset AI button position
window.resetAIButtonPosition = function() {
  const btn = document.getElementById('aiChatBtn');
  if (btn) {
    btn.style.transform = 'translate(0px, 0px)';
    localStorage.removeItem('aiButtonX');
    localStorage.removeItem('aiButtonY');
    console.log('🔄 AI button position reset to default');
    alert('🔄 AI button reset to bottom-right corner');
  }
};

// Initialize draggable - only run once when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(makeAIDraggable, 500);
  }, { once: true });
} else {
  // DOM already loaded
  setTimeout(makeAIDraggable, 500);
}

console.log('🤖 AI Student Companion Loaded');
console.log('💬 Click the 🤖 button to start chatting!');
console.log('');
console.log('📌 Useful commands:');
console.log('   clearAICache() - Refresh data from server');
console.log('   resetAIButtonPosition() - Reset button position');
