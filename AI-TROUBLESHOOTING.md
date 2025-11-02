# 🤖 AI Student Companion - Troubleshooting

## ✅ FIXED! Updated with Debugging

I've updated the AI Companion with:
- ✅ Better API handling
- ✅ Extensive debugging logs
- ✅ Improved initialization
- ✅ Better error messages

---

## 🧪 TEST IT NOW

### Step 1: Hard Refresh
```bash
Ctrl + Shift + F5
```
This clears the cache completely.

### Step 2: Open Developer Console
```bash
Press F12 or Ctrl + Shift + I
```

### Step 3: Look for Logs
You should see:
```
🤖 AI Student Companion script loaded
📄 DOM loaded, checking for login...
✅ Token found, initializing AI Companion
🤖 AI Student Companion initialized
✅ Chat input found
✅ Send button found
```

### Step 4: Click AI Button
Click the 🤖 floating button (bottom-right)

You should see the welcome message in the chat.

### Step 5: Type & Send
Type "help" and press Enter or click 📤

Watch the console for:
```
📤 sendAIMessage called
💬 Message: help
🔄 Processing query...
✅ Got response: ...
✅ Processing complete
```

---

## 🔍 Common Issues & Solutions

### Issue 1: AI Button Not Visible
**Solution:**
- Make sure you're logged in
- Check if button is behind something
- Try scrolling down
- Button should be at bottom-right corner

### Issue 2: Chat Window Empty
**Solution:**
- Click the 🤖 button
- Wait 2 seconds for initialization
- Refresh page if needed

### Issue 3: Input Not Working
**Check Console For:**
- `❌ Chat input not found` - Means HTML elements missing
- `❌ Send button not found` - Same issue

**Solution:**
- Hard refresh: `Ctrl + Shift + F5`
- Clear browser cache
- Try different browser

### Issue 4: No Response After Sending
**Check Console For:**
- `📤 sendAIMessage called` - Function is running
- `💬 Message: [your message]` - Message received
- `🔄 Processing query...` - Processing started
- API errors

**Solution:**
- Make sure you're logged in (token exists)
- Check internet connection
- Server must be running on port 8081

---

## 📊 What to Check in Console

### Good Signs ✅
```
🤖 AI Student Companion script loaded
📄 DOM loaded, checking for login...
✅ Token found, initializing AI Companion
🤖 AI Student Companion initialized
✅ Chat input found
✅ Send button found
```

### When You Type:
```
📤 sendAIMessage called
💬 Message: help
🔄 Processing query...
📚 Fetching courses... (if asking about courses)
✅ Got response: ...
✅ Processing complete
```

### Bad Signs ❌
```
❌ Chat input not found
❌ Send button not found
❌ API Error: ...
❌ Unable to fetch ...
```

---

## 🔧 Manual Test Steps

### Test 1: Check Button Exists
```javascript
// In Console:
document.getElementById('aiChatBtn')
// Should return: <button id="aiChatBtn" ...>
```

### Test 2: Check Chat Window
```javascript
// In Console:
document.getElementById('aiChatWindow')
// Should return: <div id="aiChatWindow" ...>
```

### Test 3: Check Input
```javascript
// In Console:
document.getElementById('aiChatInput')
// Should return: <input id="aiChatInput" ...>
```

### Test 4: Manually Send Message
```javascript
// In Console:
window.sendAIMessage()
// Should trigger the function
```

### Test 5: Manually Toggle Chat
```javascript
// In Console:
window.toggleAIChat()
// Should open/close the chat window
```

---

## 🚀 Quick Fix Commands

### Force Initialize
```javascript
// In browser console:
window.initAICompanion()
```

### Force Toggle Chat
```javascript
// In browser console:
window.toggleAIChat()
```

### Check if Function Exists
```javascript
// In browser console:
typeof window.sendAIMessage
// Should return: "function"
```

---

## 📝 What I Fixed

### Before:
- ❌ Using `api()` function that might not be accessible
- ❌ Using `authHeaders()` from external file
- ❌ No debugging logs
- ❌ Initialization timing issues

### After:
- ✅ Custom `aiApi()` function built-in
- ✅ Self-contained authentication
- ✅ Extensive debugging logs
- ✅ Better initialization with delays
- ✅ Re-initialization after login

---

## 🎯 Expected Behavior

### When Working Correctly:

1. **After Login:**
   - 🤖 button appears at bottom-right
   - Console shows: "✅ Token found, initializing..."

2. **Click Button:**
   - Chat window opens
   - Welcome message appears
   - Input field is focused

3. **Type & Send:**
   - Message appears in blue bubble
   - Typing indicator shows (3 animated dots)
   - AI response appears in white bubble
   - Input clears

4. **Example Chat:**
   ```
   You: help
   AI: 🤖 AI Student Companion Help
       I can assist you with:
       📚 Courses...
       👥 Students...
       ...
   ```

---

## 🔄 If Still Not Working

1. **Open Console (F12)**
2. **Copy ALL the logs**
3. **Look for errors (red text)**
4. **Share with developer**

The console will show exactly what's happening!

---

## ✅ REFRESH NOW & TEST

```bash
1. Hard Refresh: Ctrl + Shift + F5
2. Open Console: F12
3. Login to system
4. Watch for logs
5. Click 🤖 button
6. Type "help" and send
7. Check console for errors
```

**The debugging logs will tell us exactly what's wrong!** 🔍
