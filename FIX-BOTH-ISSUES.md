# 🔧 Fix Both Issues: Exam Pass + Photos

## Issue 1: No Exam Pass Number ❌

### ROOT CAUSE
**You're confirming "Tuition Fee" payments!**

Look at your screenshot:
```
RCP-2025-000002: Tuition Fee ← Won't generate exam pass
RCP-2025-000001: Tuition Fee ← Won't generate exam pass
```

### SOLUTION: Create "Exam Fee" Payment

1. **Open Payments Page**
2. **Fill form:**
   ```
   Student: sarah
   Payment Type: Exam Fee ⬅️ SELECT THIS!
   Amount: 25
   Method: Cash
   Semester: Semester 1, Year 1
   Academic Year: 2024/2025
   ```
3. **Submit Payment**
4. **Confirm It** → Exam pass will generate
5. **Result:** Table shows 🎫 EP-2025-000001

---

## Issue 2: Photos Not Showing 📸

### DIAGNOSTIC STEPS

#### Step 1: Check Browser Console
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Reload the Students page
4. Look for:
   ```
   ✅ Students loaded: 3
   📸 Photo URLs: [{name: "sarah", photoUrl: "/uploads/xyz.jpg"}, ...]
   ```

#### Step 2: Test Photo URL Directly
If console shows photoUrl like `/uploads/1760897398599-9cpmvkldt0m.jpg`, try:
```
http://localhost:8080/uploads/1760897398599-9cpmvkldt0m.jpg
```

**Expected:**
- ✅ Photo loads → Frontend issue
- ❌ 404 error → Backend/server issue

#### Step 3: Run Photo Diagnostic Script
```bash
cd backend
node check-photos.js
```

This shows:
- Which students have photos in database
- What the photoPath values are
- Expected URLs

#### Step 4: Check Server Logs
Look in terminal where server is running for errors like:
```
Error: ENOENT: no such file or directory
GET /uploads/xyz.jpg 404
```

### COMMON FIXES

#### Fix 1: Restart Server
```bash
# Stop server (Ctrl+C)
npm start
```

#### Fix 2: Clear Browser Cache
```
Ctrl + Shift + Delete
Clear cached images and files
Refresh: Ctrl + F5
```

#### Fix 3: Check Server Configuration
Open `backend/server.js`, verify line 20:
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

#### Fix 4: Re-upload Photos
For students showing broken images:
1. Click **✏️ Edit** button
2. Upload new photo
3. Save
4. Refresh page

#### Fix 5: Add New Students with Photos
1. Go to **Students** → **Add New Student**
2. Fill in details
3. **Upload photo** OR click **📷 Use Camera**
4. Submit
5. Check if new student's photo appears

### TESTING CHECKLIST

Run through this to identify the issue:

- [ ] Browser console shows photoUrl values?
- [ ] Direct URL test (http://localhost:8080/uploads/...) loads photo?
- [ ] Server is running without errors?
- [ ] Photos exist in `backend/uploads/` folder?
- [ ] New students with photos also have broken images?

### EXPECTED BEHAVIOR

**Working Photos Should:**
- Show in Students table (36x36px circle)
- Show in Student Profile modal (150x150px)
- Show in Print view
- Load from `/uploads/filename.jpg` URL

**If Photos Work For:**
- ✅ New students but not old → Database photoPath issue
- ✅ Some students but not others → Specific files missing
- ❌ No students at all → Server configuration issue

---

## Quick Test Both Fixes

### 1. Test Exam Pass (2 minutes)
```
1. Payments → New Payment
2. Type: Exam Fee
3. Submit → Confirm
4. See: 🎫 EP-2025-000001
```

### 2. Test Photos (1 minute)
```
1. Students → Add New Student
2. Name: Test Student
3. Upload any photo
4. Submit
5. Check: Photo should appear in table
```

If NEW student photo works but OLD students don't:
→ Database issue with old records

If NO photos work at all:
→ Server/configuration issue

---

## Get Help

If still not working, provide:

1. **Browser Console Screenshot** (F12 → Console tab)
2. **Server Terminal Output** (where you ran `npm start`)
3. **Result of:** `node check-photos.js`
4. **Network Tab** (F12 → Network → reload page → filter "uploads")

This will help identify exactly where the issue is!
