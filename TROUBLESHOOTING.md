# Troubleshooting Guide - Student CRUD Operations

## Issue: Add, Edit, Delete not working on Students page

### Root Causes:
1. **Database Index Conflict** - Old `studentId` field indexes conflicting with new `registrationNo` field
2. **Authentication Required** - Must be logged in to add/edit/delete students
3. **Unique Constraint** - Multiple null values in `registrationNo` field

### Solutions:

#### Step 1: Fix Database Indexes
Run the fix script to clean up old indexes and assign registration numbers:

```bash
cd backend
node fix-indexes.js
```

This script will:
- Remove old `studentId` index
- Create proper `registrationNo` sparse unique index
- Assign registration numbers to all existing students

#### Step 2: Restart the Server
After running the fix script, restart your backend server:

```bash
# Stop the current server (Ctrl+C)
cd backend
node server.js
```

#### Step 3: Ensure You're Logged In
The student CRUD operations require authentication:

1. Go to the **Auth** tab
2. Either **Login** with existing credentials or **Sign Up** for a new account
3. After successful login, you'll be redirected to the Home page
4. Your profile name/photo will appear in the top-right corner
5. Now navigate to the **Students** tab

#### Step 4: Test Operations

**Add Student:**
- Fill in the student form (Name is required)
- Optionally add age, gender, course IDs
- Click "Add" button
- Check for success or error message

**Edit Student:**
- Click "Edit" button on any student row
- Modal will open with student data
- Modify fields as needed
- Click "Save"

**Delete Student:**
- Click "Delete" button on any student row
- Student will be removed

### Common Error Messages:

**"Failed to add student. You may need admin/teacher role."**
- Solution: Make sure you're logged in. Check for your profile in top-right corner.

**"Duplicate key error"**
- Solution: Run the `fix-indexes.js` script to fix database indexes

**"Unauthorized"**
- Solution: Your session may have expired. Log out and log back in.

### Registration Number Format:

The system now uses a structured format: **YY/CCC/nnn** (Year / Course Code / Number)

**Examples:**
- `25/BSE/001` - First student in 2025 enrolled in BSE (Bachelor of Software Engineering)
- `25/BSE/002` - Second student in 2025 enrolled in BSE
- `25/CSE/001` - First student in 2025 enrolled in CSE (Computer Science)
- `25/GEN/001` - Student with no course assigned (GEN = General)

**How it works:**
- **YY**: Last 2 digits of year (25 for 2025)
- **CCC**: 3-letter course code from the course (e.g., BSE, CSE, ENG, or GEN if no course)
- **nnn**: Sequential number starting from 001 for each year/course combination (3 digits)
- **Separators**: Forward slashes (/)

### Verification:

After completing the steps above, you should be able to:
- ✓ Add courses with 3-letter codes (e.g., BSE, CSE, ENG)
- ✓ Add new students with auto-generated registration numbers (e.g., 25/BSE/001)
- ✓ Edit existing student information
- ✓ Delete students
- ✓ See students listed in the table with their registration numbers
- ✓ Students in the same course get sequential numbers with the course code

### Still Having Issues?

Check the browser console (F12) for JavaScript errors and the server console for backend errors.
