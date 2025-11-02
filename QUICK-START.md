# Quick Start Guide

## Getting Started with the Student Management System

### Step 1: Start the Server

```bash
cd backend
node server.js
```

Server will start on: `http://localhost:8080`

### Step 2: Initial Setup - Add Courses First!

**Important:** Before adding students, you must add courses with their codes.

1. Open browser: `http://localhost:8080`
2. Go to **Auth** tab
3. **Sign Up** with Admin or Teacher role
4. Go to **Courses** tab
5. Add your courses:

| Course ID | Code | Name | Example |
|-----------|------|------|---------|
| 101 | BSE | Bachelor of Software Engineering | ✓ |
| 102 | CSE | Computer Science Engineering | ✓ |
| 103 | ENG | Engineering | ✓ |
| 104 | MAT | Mathematics | ✓ |

**Example:**
```
Course ID: 101
Course Code: BSE
Name: Bachelor of Software Engineering
Teacher: (select from list)
Click: Add
```

### Step 3: Add Students

1. Go to **Students** tab
2. Fill the form:
   - Name: John Doe
   - Age: 20
   - Gender: Male
   - Course IDs: 101 (or 101,102 for multiple)
3. Click **Add**
4. Student gets registration number: `25/BSE/001`

### Step 4: Test Everything

✓ **Students**: Add, Edit, Delete, View profile
✓ **Courses**: Create courses with codes
✓ **Teachers**: Add teachers with photos
✓ **Classes**: Create classes, add students
✓ **Enrollments**: Enroll students in semesters
✓ **Results**: Record grades
✓ **Attendance**: Mark attendance

## Registration Number Examples

| Student | Course Code | Reg Number |
|---------|-------------|------------|
| First BSE student | BSE | 25/BSE/001 |
| Second BSE student | BSE | 25/BSE/002 |
| First CSE student | CSE | 25/CSE/001 |
| Student with no course | GEN | 25/GEN/001 |

## User Roles

| Role | Can Do |
|------|--------|
| **Admin** | Everything - full access |
| **Teacher** | Manage students, courses, classes, results, attendance |
| **Student** | View data, create own enrollments |

## Common Tasks

### Add a Course
```
Courses Tab → Fill form:
- Course ID: 101
- Code: BSE
- Name: Bachelor of Software Engineering
- Teacher: Select from list
→ Add
```

### Add a Student
```
Students Tab → Fill form:
- Name: John Doe
- Age: 20
- Gender: Male
- Course IDs: 101
→ Add
→ Gets registration: 25/BSE/001
```

### Create a Class
```
Classes Tab → Fill form:
- Name: Year 1 - Section A
- Department: Computer Science
- Year: 1
- Section: A
→ Create Class
```

### Add Students to Class
```
Classes Tab → Click "manage" on a class
→ Type student name or paste ID
→ Add Student
```

### Record Attendance
```
Attendance Tab → Fill form:
- Student: Type name or select
- Course ID: 101
- Date: Select date
- Present: Check if present
→ Add
```

## Troubleshooting

**Problem:** Can't add students/courses/classes
**Solution:** Make sure you're logged in with Admin or Teacher role

**Problem:** Registration numbers not generating
**Solution:** 
1. Make sure courses have codes
2. Run: `node backend/fix-indexes.js`
3. Restart server

**Problem:** "Duplicate key error"
**Solution:** Run: `node backend/fix-indexes.js`

## Need Help?

- `REGISTRATION-NUMBER-FORMAT.md` - Registration number details
- `ROLES-AND-PERMISSIONS.md` - User roles and permissions
- `TROUBLESHOOTING.md` - Common problems and solutions
- `README.md` - Full documentation

## Quick Commands

```bash
# Start server
cd backend
node server.js

# Fix database indexes
cd backend
node fix-indexes.js

# Install dependencies (if needed)
cd backend
npm install
```

## Database

- **MongoDB** runs on: `mongodb://127.0.0.1:27017/schoolDB`
- **Collections**: students, courses, teachers, users, classes, enrollments, results, attendance

## Tips

1. ✓ Always add courses **before** adding students
2. ✓ Use meaningful 3-letter course codes (BSE, CSE, ENG)
3. ✓ Assign at least one course to students for proper registration numbers
4. ✓ Keep course codes uppercase and consistent
5. ✓ Login with appropriate role for your task

Happy managing! 🎓
