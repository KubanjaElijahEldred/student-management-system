# How to Fix Registration Numbers to New Format

## Problem

Your students still have registration numbers in the old format:
- `2025/000/007` 
- `2025/101/002`

They should be:
- `25/GEN/007` (for students without courses)
- `25/BSE/002` (for students in BSE course)

## Solution - Follow These Steps:

### Step 1: Stop Your Server

Press `Ctrl+C` in the terminal running your server.

### Step 2: Add Course Codes to Existing Courses

```bash
cd backend
node add-course-codes.js
```

This script will:
- Find all courses without codes
- Auto-assign codes based on course names
- Update the database

**Example output:**
```
✓ Course ID 101 "Mathematics" → Code: MAT
✓ Course ID 102 "Computer Science" → Code: CSE
✓ Course ID 103 "Bachelor of Software Engineering" → Code: BSE
```

### Step 3: Update Student Registration Numbers

```bash
node fix-indexes.js
```

This will convert all student registration numbers to the new format.

**Example output:**
```
Updated student shillah → 25/GEN/001
Updated student Alice → 25/BSE/001
```

### Step 4: Restart Your Server

```bash
node server.js
```

### Step 5: Refresh Your Browser

Open your app: `http://localhost:8080`

## If Course Codes Are Wrong

If the auto-assigned codes aren't what you want (e.g., course got "MAT" but you want "BSE"):

### Option 1: Edit in MongoDB Directly

```javascript
// In MongoDB shell or Compass
db.courses.updateOne(
  { _id: 101 },
  { $set: { code: "BSE" } }
)
```

Then run `node fix-indexes.js` again.

### Option 2: Manual Course Code Assignment

You can manually specify codes by editing `add-course-codes.js`:

```javascript
// Add this section after line 15:
const manualCodes = {
  101: 'BSE',  // Course ID 101 = BSE
  102: 'CSE',  // Course ID 102 = CSE
  103: 'ENG',  // Course ID 103 = ENG
};

// Then use manualCodes[course._id] if it exists
```

## Verify It Worked

1. Go to **Courses** tab - you should see the "Code" column filled
2. Go to **Students** tab - registration numbers should be like `25/BSE/001`
3. Add a new student - they should get the new format automatically

## Common Issues

**Q: Students still have old format after running scripts**
A: Make sure you:
- Ran `add-course-codes.js` FIRST
- Then ran `fix-indexes.js` SECOND
- Restarted the server
- Refreshed your browser (hard refresh: Ctrl+F5)

**Q: Some courses still don't have codes**
A: The script might have failed. Check the output. You can manually add codes via the Courses form in the app.

**Q: Student has wrong course code**
A: The registration number uses the FIRST course in their course_ids array. Check which course is first.

**Q: All students get GEN code**
A: Their courses don't have codes. Run `add-course-codes.js` first.

## Quick Reference

```bash
# Complete fix process:
cd backend

# 1. Add codes to courses
node add-course-codes.js

# 2. Update student registration numbers  
node fix-indexes.js

# 3. Restart server
node server.js

# 4. Refresh browser (Ctrl+F5)
```

## Expected Results

### Before:
| Reg No | Student | Course |
|--------|---------|--------|
| 2025/000/007 | shillah | none |
| 2025/101/002 | Alice | 101, 102 |

### After:
| Reg No | Student | Course |
|--------|---------|--------|
| 25/GEN/001 | shillah | none |
| 25/BSE/001 | Alice | BSE (101), CSE (102) |

*Assuming course 101 has code "BSE"*
