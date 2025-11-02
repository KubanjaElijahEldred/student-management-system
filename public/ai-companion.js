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

// Toggle AI chat window
window.toggleAIChat = function() {
  console.log('🔄 Toggle AI Chat called');
  
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
  } else {
    console.error('❌ Chat elements not found!');
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

// Diagnostic function
window.testAIChat = function() {
  console.log('🔍 AI Chat Diagnostic Test');
  console.log('========================');
  
  const chatWindow = document.getElementById('aiChatWindow');
  const chatInput = document.getElementById('aiChatInput');
  const chatBtn = document.getElementById('aiChatBtn');
  const sendBtn = document.getElementById('aiSendBtn');
  
  console.log('1. Chat Window:', chatWindow ? '✅ Found' : '❌ NOT FOUND');
  if (chatWindow) {
    console.log('   - Display:', chatWindow.style.display);
    console.log('   - Visibility:', window.getComputedStyle(chatWindow).visibility);
    console.log('   - Z-index:', window.getComputedStyle(chatWindow).zIndex);
  }
  
  console.log('2. Chat Input:', chatInput ? '✅ Found' : '❌ NOT FOUND');
  if (chatInput) {
    console.log('   - Disabled:', chatInput.disabled);
    console.log('   - ReadOnly:', chatInput.readOnly);
    console.log('   - Value:', chatInput.value);
    console.log('   - Pointer Events:', window.getComputedStyle(chatInput).pointerEvents);
    console.log('   - Cursor:', window.getComputedStyle(chatInput).cursor);
  }
  
  console.log('3. Chat Button:', chatBtn ? '✅ Found' : '❌ NOT FOUND');
  console.log('4. Send Button:', sendBtn ? '✅ Found' : '❌ NOT FOUND');
  
  console.log('5. Event Listeners:');
  console.log('   - sendAIMessage:', typeof window.sendAIMessage);
  console.log('   - toggleAIChat:', typeof window.toggleAIChat);
  
  console.log('\n💡 Quick Fixes:');
  console.log('   fixAIInput() - Force enable input');
  console.log('   toggleAIChat() - Open/close chat');
  console.log('   testAISend("hello") - Test sending message');
  
  return {
    chatWindow,
    chatInput,
    chatBtn,
    sendBtn,
    allGood: !!(chatWindow && chatInput && chatBtn && sendBtn)
  };
};

// Quick fix function
window.fixAIInput = function() {
  console.log('🔧 Fixing AI input...');
  
  const input = document.getElementById('aiChatInput');
  if (!input) {
    console.error('❌ Input not found!');
    return false;
  }
  
  // Force enable
  input.disabled = false;
  input.readOnly = false;
  input.style.pointerEvents = 'auto';
  input.style.cursor = 'text';
  
  // Open chat window
  const chatWindow = document.getElementById('aiChatWindow');
  if (chatWindow) {
    chatWindow.style.display = 'flex';
  }
  
  // Focus
  setTimeout(() => {
    input.focus();
    input.select();
    console.log('✅ Input fixed and focused!');
    console.log('Try typing now...');
  }, 100);
  
  return true;
};

// Test send function
window.testAISend = function(msg = 'test') {
  console.log('🧪 Testing send with message:', msg);
  const input = document.getElementById('aiChatInput');
  if (input) {
    input.value = msg;
    console.log('📝 Value set to:', input.value);
    sendAIMessage();
  } else {
    console.error('❌ Input not found');
  }
};

// Force start AI - Complete initialization
window.forceStartAI = function() {
  console.log('🚀 FORCE STARTING AI COMPANION...');
  console.log('================================');
  
  // 1. Show button
  const btn = document.getElementById('aiChatBtn');
  if (btn) {
    btn.style.display = 'flex';
    console.log('✅ Button visible');
  } else {
    console.error('❌ Button not found in DOM!');
    return false;
  }
  
  // 2. Initialize AI Companion
  console.log('🔄 Initializing AI Companion...');
  initAICompanion();
  
  // 3. Open chat window
  const chatWindow = document.getElementById('aiChatWindow');
  if (chatWindow) {
    chatWindow.style.display = 'flex';
    console.log('✅ Chat window opened');
  }
  
  // 4. Enable and focus input
  const input = document.getElementById('aiChatInput');
  if (input) {
    input.disabled = false;
    input.readOnly = false;
    input.style.pointerEvents = 'auto';
    setTimeout(() => {
      input.focus();
      input.select();
    }, 300);
    console.log('✅ Input enabled and focused');
  }
  
  // 5. Update button
  if (btn) {
    btn.innerHTML = '✖️';
    btn.title = 'Close AI Companion';
  }
  
  console.log('\n✅ AI COMPANION READY!');
  console.log('Try typing in the chat box now!');
  console.log('Or run: testAISend("help")');
  
  // Pre-load data for instant responses
  preloadData();
  
  return true;
};

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

// Make AI button draggable
function makeAIDraggable() {
  const btn = document.getElementById('aiChatBtn');
  if (!btn) return;
  
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;
  
  btn.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  
  // Touch events for mobile
  btn.addEventListener('touchstart', dragStart);
  document.addEventListener('touchmove', drag);
  document.addEventListener('touchend', dragEnd);
  
  let dragTimeout;
  let hasMoved = false;
  
  function dragStart(e) {
    const isTouch = e.type === 'touchstart';
    initialX = isTouch ? e.touches[0].clientX - xOffset : e.clientX - xOffset;
    initialY = isTouch ? e.touches[0].clientY - yOffset : e.clientY - yOffset;
    hasMoved = false;
    
    if (e.target === btn) {
      // Set a flag after holding for a moment
      dragTimeout = setTimeout(() => {
        isDragging = true;
        btn.style.cursor = 'grabbing';
        console.log('🖐️ Drag mode activated');
      }, 150);
    }
  }
  
  function drag(e) {
    const isTouch = e.type === 'touchmove';
    const moveX = isTouch ? e.touches[0].clientX : e.clientX;
    const moveY = isTouch ? e.touches[0].clientY : e.clientY;
    
    // Check if user has moved more than 5 pixels
    const deltaX = Math.abs(moveX - (initialX + xOffset));
    const deltaY = Math.abs(moveY - (initialY + yOffset));
    
    if (deltaX > 5 || deltaY > 5) {
      hasMoved = true;
    }
    
    if (!isDragging) return;
    
    e.preventDefault();
    currentX = moveX - initialX;
    currentY = moveY - initialY;
    
    xOffset = currentX;
    yOffset = currentY;
    
    setTranslate(currentX, currentY, btn);
  }
  
  function dragEnd(e) {
    clearTimeout(dragTimeout);
    
    if (isDragging && hasMoved) {
      initialX = currentX;
      initialY = currentY;
      
      // Save position to localStorage
      localStorage.setItem('aiButtonX', xOffset);
      localStorage.setItem('aiButtonY', yOffset);
      
      console.log('🎯 AI button position saved:', { x: xOffset, y: yOffset });
      
      // Prevent click event after drag
      setTimeout(() => {
        isDragging = false;
        hasMoved = false;
      }, 100);
    } else {
      isDragging = false;
      hasMoved = false;
    }
    
    btn.style.cursor = 'grab';
  }
  
  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }
  
  // Load saved position
  const savedX = localStorage.getItem('aiButtonX');
  const savedY = localStorage.getItem('aiButtonY');
  
  if (savedX && savedY) {
    xOffset = parseFloat(savedX);
    yOffset = parseFloat(savedY);
    setTranslate(xOffset, yOffset, btn);
    console.log('📍 AI button restored to saved position:', { x: xOffset, y: yOffset });
  }
  
  btn.style.cursor = 'grab';
  console.log('✅ AI button is now draggable! Hold and drag to move.');
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

// Initialize draggable after a short delay
setTimeout(() => {
  makeAIDraggable();
}, 1000);

console.log('🤖 AI Student Companion script loaded');
console.log('');
console.log('🆘 AI NOT WORKING? Try these commands:');
console.log('   forceStartAI() - Complete setup & open chat');
console.log('   fixAIInput() - Fix input field');
console.log('   testAISend("help") - Test sending message');
console.log('   testAIChat() - Run diagnostic');
console.log('');
console.log('⚡ FASTER RESPONSES:');
console.log('   Data is cached for 5 minutes for instant responses!');
console.log('   clearAICache() - Refresh data from server');
console.log('');
console.log('🎯 AI button is DRAGGABLE! Hold and drag to move');
console.log('💡 Type resetAIButtonPosition() to reset position');
