# Role-Based Access Control (RBAC) Guide

## Overview

The system now has role-based access control to restrict certain features to specific user roles.

## Access Restrictions

### Pages That Require Special Roles:

| Page | Required Role | Purpose |
|------|--------------|---------|
| **Classes** | Admin or Teacher | Manage classes and student assignments |
| **Enrollment** | Admin, Teacher, or Student | Create and manage course enrollments |

### Pages Available to All Logged-In Users:

- Home
- Students
- Courses
- Teachers
- Results
- Attendance

## How It Works

### 1. Visual Indicators

**Lock Icons (🔒):**
- Classes and Enrollment buttons show a lock icon
- Indicates these pages have role restrictions

**Dimmed Buttons:**
- If you don't have access, the button appears dimmed (50% opacity)
- Tooltip shows required role when hovering
- Button cursor changes to "not-allowed"

### 2. Access Control

**When Clicking a Restricted Page:**
```
If you have access → Page loads normally ✓
If you don't have access → Alert message:
  "Access Denied!
   You need admin or teacher role to access this page.
   Your current role: student"
→ Redirects to Home page
```

## User Roles

### Admin
- **Full Access** to everything
- Can manage classes
- Can approve/reject enrollments
- Can manage all data

### Teacher
- **Almost Full Access**
- Can manage classes
- Can approve/reject enrollments
- Can manage students, courses, results, attendance

### Student
- **Limited Access**
- Can create own enrollments
- Can view students, courses, teachers
- Can view results and attendance
- **Cannot** manage classes
- **Cannot** approve/reject enrollments

## How to Check Your Role

Your role is stored in your login token. To see it:

1. **Browser Console** (F12):
   ```javascript
   const token = localStorage.getItem('token');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Your role:', payload.role);
   ```

2. **Look at Button States:**
   - Dimmed buttons = You don't have access
   - Normal buttons = You have access

## Setting Your Role

**During Sign Up:**
1. Go to Auth tab
2. Fill in sign-up form
3. **Select your role** from the dropdown:
   - Student
   - Teacher
   - Admin
4. Submit

**Your role is permanent** - it can't be changed through the UI.

## Common Scenarios

### Scenario 1: Student Tries to Access Classes
```
Student clicks "Classes" button
→ Alert: "Access Denied! You need admin or teacher role..."
→ Redirected to Home page
```

### Scenario 2: Teacher Accesses Classes
```
Teacher clicks "Classes" button
→ Page loads successfully ✓
→ Can create, view, and manage classes
```

### Scenario 3: Not Logged In
```
Guest clicks any button (except Auth)
→ Alert: "Please login to access this page."
→ Redirected to Auth page
```

## Testing Access Control

### Test 1: As Admin
1. Sign up with Admin role
2. ✓ All navigation buttons available
3. ✓ Can access Classes
4. ✓ Can access Enrollment
5. ✓ Can approve/reject enrollments

### Test 2: As Teacher
1. Sign up with Teacher role
2. ✓ All navigation buttons available
3. ✓ Can access Classes
4. ✓ Can access Enrollment
5. ✓ Can approve/reject enrollments

### Test 3: As Student
1. Sign up with Student role
2. ✓ Can see all navigation buttons
3. ✗ Classes button dimmed with lock icon
4. ✓ Can access Enrollment
5. ✗ Cannot approve/reject enrollments (buttons disabled)
6. Clicking Classes shows access denied message

## Error Messages

### "Access Denied!"
**Cause:** You don't have the required role
**Solution:** Login with an account that has admin or teacher role

### "Please login to access this page."
**Cause:** You're not logged in
**Solution:** Go to Auth tab and login

### "You need admin or teacher role to approve/reject enrollments."
**Cause:** You're trying to approve/reject as a student
**Solution:** This is correct behavior - students can't approve enrollments

## Security Notes

1. **Frontend + Backend Protection:**
   - Frontend: Visual restrictions and alerts
   - Backend: API endpoints protected with middleware

2. **Token-Based:**
   - Your role is stored in JWT token
   - Can't be modified by user
   - Verified on every request

3. **Fail-Safe:**
   - Even if frontend is bypassed, backend will reject unauthorized requests
   - Always returns 403 Forbidden for role violations

## Customizing Access

To change which roles can access a page, edit `ROLE_RESTRICTIONS` in `app.js`:

```javascript
const ROLE_RESTRICTIONS = {
  classesPanel: ['admin', 'teacher'],      // Classes: admin or teacher
  enrollmentPanel: ['admin', 'teacher', 'student']  // Enrollment: all roles
};
```

## Troubleshooting

**Q: I'm admin but buttons are still dimmed**
A: Logout and login again. Your token may not have updated.

**Q: I want to change my role**
A: Create a new account with the desired role. Roles can't be changed after signup.

**Q: Can I access restricted pages directly?**
A: No. Even if you type the URL or use developer tools, the backend will reject your request.

**Q: Student can see Classes button but can't use it?**
A: This is intentional - they can see what's available but access is restricted. The lock icon indicates this.

## Summary

✅ **Classes Page:** Admin & Teacher only
✅ **Enrollment Page:** All logged-in users, but:
  - Students: Can only create enrollments
  - Admin/Teacher: Can approve/reject

🔒 **Visual indicators** show which pages are restricted
⚠️ **Clear error messages** explain why access is denied
🛡️ **Backend enforcement** ensures security even if frontend is bypassed
