# Registration Number Format Guide

## Format Structure

The system generates registration numbers in the format: **YY/CCC/nnn**

### Components:

1. **YY** - 2-digit year (e.g., 25 for 2025)
2. **CCC** - 3-letter course code (e.g., BSE, CSE, ENG, or GEN if no course)
3. **nnn** - 3-digit sequential number (001, 002, 003, ...)

### Separators: Forward slashes (/)

## Examples:

| Registration No | Meaning |
|----------------|---------|
| `25/BSE/001` | First student in 2025 enrolled in BSE (Bachelor of Software Engineering) |
| `25/BSE/002` | Second student in 2025 enrolled in BSE |
| `25/CSE/001` | First student in 2025 enrolled in CSE (Computer Science) |
| `25/GEN/001` | Student registered in 2025 with no course assigned |

## How It Works:

### 1. Adding a New Student

When you add a student:
- The system takes the **current year** (e.g., 2025)
- Uses the **first course ID** from the student's course list
- If no courses are assigned, uses `000`
- Automatically generates the next sequential number for that year/course combination

**Example:**
```
Student: John Doe
Courses: BSE (101), CSE (102)
Registration: 25/BSE/001 (uses first course code: BSE)
```

### 2. Sequential Numbering

Numbers are sequential per year/course combination:
- First student in BSE for 2025: `25/BSE/001`
- Second student in BSE for 2025: `25/BSE/002`
- Third student in BSE for 2025: `25/BSE/003`
- First student in CSE for 2025: `25/CSE/001` ← Starts from 001

### 3. No Course Assigned

If a student has no courses when registered:
- Registration number: `25/GEN/001` (GEN = General)
- You can add courses later via edit
- Registration number stays the same (doesn't change automatically)

## Important Notes:

### ✓ Automatic Generation
- Registration numbers are auto-generated when saving a new student
- You don't need to enter them manually
- The system ensures no duplicates

### ✓ Uniqueness
- Each registration number is unique across the entire system
- No two students can have the same registration number

### ✓ Year-based Reset
- Numbering resets each year
- `2025/101/001` is different from `2026/101/001`

### ✓ Course-based Grouping
- Each course has its own sequence
- Helps identify which course a student belongs to
- Easy to count students per course per year

## Migration from Old Format:

If you had students with the old format (`REG-20251019-1234`), running the fix script will:
1. Convert them to the new format
2. Assign sequential numbers based on their courses
3. Group them by year and course

## Usage Tips:

### When to Use Registration Numbers:
- ✓ Unique student identification
- ✓ Tracking students by course and year
- ✓ Generating reports
- ✓ Enrollment processes

### Best Practices:
1. **Always assign at least one course** when registering students
2. **Use consistent 3-letter course codes** (e.g., BSE, CSE, ENG, MAT)
3. **Course codes should be uppercase** and meaningful
4. **Don't manually edit** registration numbers in the database
5. **Run the fix script** after any database schema changes

### Course Code Guidelines:
- **BSE** - Bachelor of Software Engineering
- **CSE** - Computer Science Engineering
- **ENG** - Engineering
- **MAT** - Mathematics
- **PHY** - Physics
- **BUS** - Business
- **GEN** - General (default for no course)

## Technical Details:

### Database Fields:
```javascript
{
  registrationNo: "25/BSE/001",    // Full registration number
  studentNumber: 1,                 // Sequential number (integer)
  course_ids: [101, 102],          // Array of course IDs
  // ... other fields
}
```

### Generation Logic:
1. Check if student already has a registration number (skip if exists)
2. Get current year, convert to 2 digits (YY)
3. Get first course ID from `course_ids` array
4. Look up course code from courses collection (e.g., BSE, CSE, ENG)
5. Use 'GEN' if no course found
6. Query database for highest `studentNumber` with matching year/course pattern
7. Increment by 1 (or start at 1 if none found)
8. Format as `YY/CCC/nnn` (e.g., 25/BSE/001)

## Troubleshooting:

**Q: Student has multiple courses, which one is used?**
A: The first course ID in the `course_ids` array is used.

**Q: Can I change a student's registration number?**
A: No, registration numbers are permanent once assigned. This ensures data integrity.

**Q: What if I delete and re-add a student?**
A: They will get a new registration number. Deleted numbers are not reused.

**Q: Student registered with no course, then added a course. Will registration number update?**
A: No, the registration number remains as `25/GEN/XXX`. It's assigned only once during initial creation.

**Q: How do I see all students in a specific course for a year?**
A: Search for registration numbers starting with the pattern, e.g., `25/BSE/` for all BSE students in 2025.

**Q: What if I misspell a course code?**
A: Students will get registration numbers with the misspelled code. Make sure course codes are correct before adding students.

**Q: Can I change a course code later?**
A: Yes, but it won't affect existing student registration numbers. Only new students will get the updated code.

## Support:

For issues or questions about registration numbers, check:
1. Server console for error messages
2. Browser console (F12) for frontend errors
3. `TROUBLESHOOTING.md` for common problems
