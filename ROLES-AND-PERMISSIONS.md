# User Roles and Permissions Guide

## Overview

The system has three user roles with different permission levels:

1. **Admin** - Full access to everything
2. **Teacher** - Can manage students, courses, classes, enrollments, results, and attendance
3. **Student** - Limited access to view and create their own enrollments

## Permission Matrix

| Feature | Admin | Teacher | Student | No Login |
|---------|-------|---------|---------|----------|
| **Students** | | | | |
| View students | ✓ | ✓ | ✓ | ✓ |
| Add student | ✓ | ✓ | ✗ | ✗ |
| Edit student | ✓ | ✓ | ✗ | ✗ |
| Delete student | ✓ | ✓ | ✗ | ✗ |
| **Courses** | | | | |
| View courses | ✓ | ✓ | ✓ | ✓ |
| Add course | ✓ | ✓ | ✗ | ✗ |
| Edit course | ✓ | ✓ | ✗ | ✗ |
| Delete course | ✓ | ✓ | ✗ | ✗ |
| **Teachers** | | | | |
| View teachers | ✓ | ✓ | ✓ | ✓ |
| Add teacher | ✓ | ✓ | ✗ | ✗ |
| Edit teacher | ✓ | ✓ | ✗ | ✗ |
| Delete teacher | ✓ | ✓ | ✗ | ✗ |
| **Classes** | | | | |
| View classes | ✓ | ✓ | ✓ | ✓ |
| Create class | ✓ | ✓ | ✗ | ✗ |
| Edit class | ✓ | ✓ | ✗ | ✗ |
| Delete class | ✓ | ✓ | ✗ | ✗ |
| Manage members | ✓ | ✓ | ✗ | ✗ |
| **Enrollments** | | | | |
| View enrollments | ✓ | ✓ | ✗ | ✗ |
| Create enrollment | ✓ | ✓ | ✓ | ✗ |
| Approve/Reject | ✓ | ✓ | ✗ | ✗ |
| **Results** | | | | |
| View results | ✓ | ✓ | ✓ | ✓ |
| Add result | ✓ | ✓ | ✗ | ✗ |
| Edit result | ✓ | ✓ | ✗ | ✗ |
| Delete result | ✓ | ✓ | ✗ | ✗ |
| **Attendance** | | | | |
| View attendance | ✓ | ✓ | ✓ | ✓ |
| Record attendance | ✓ | ✓ | ✗ | ✗ |
| View summary | ✓ | ✓ | ✓ | ✓ |

## How to Set Your Role

### During Registration (Sign Up)

1. Go to **Auth** tab
2. Click on the **Sign Up** form
3. Fill in your details:
   - Name
   - Email
   - Password
4. **Select your role** from the dropdown:
   - Student
   - Teacher
   - Admin
5. Click **Sign Up**

### Default Role

If not specified, the default role is **Student**.

## Common Error Messages

### "You need admin or teacher role to create classes."
**Why:** You're trying to create a class but your account is a Student.
**Solution:** 
- Sign up with a Teacher or Admin account
- Or ask an administrator to change your role in the database

### "Not authorized to view enrollments."
**Why:** You're not logged in or don't have permission.
**Solution:**
- Make sure you're logged in (check for your profile in top-right corner)
- If you're a student, you can create enrollments but not view all of them
- Log in with a Teacher or Admin account to view all enrollments

### "Please login to create enrollments."
**Why:** You're not logged in.
**Solution:**
- Go to **Auth** tab
- Login with your credentials
- Your profile name/photo should appear in the top-right corner

### "Forbidden" or "403 Error"
**Why:** You're logged in but don't have the required role.
**Solution:**
- Check what role your account has
- Create a new account with the appropriate role
- Or contact an administrator

## Checking Your Current Role

Your role is stored in your authentication token when you log in. To verify:

1. **Check browser console** (F12):
   - Open Developer Tools
   - Go to Console tab
   - Type: `localStorage.getItem('token')`
   - The token contains your role information

2. **Look at your profile**:
   - After logging in, your name appears in the top-right corner
   - The system remembers your role for all operations

## Best Practices

### For Students:
- ✓ You can create your own enrollments
- ✓ View courses, teachers, students, results, and attendance
- ✗ Cannot manage classes or approve enrollments

### For Teachers:
- ✓ Full access to manage students, courses, and classes
- ✓ Record attendance and results
- ✓ Approve/reject enrollments
- ✓ Manage class memberships

### For Admins:
- ✓ Complete system access
- ✓ User management
- ✓ All features available

## Security Notes

1. **Tokens expire** - You may need to log in again if your session expires
2. **Role is permanent** - Once set during registration, roles cannot be changed via the UI
3. **Password protection** - Always use strong passwords
4. **Logout** - (Feature to be implemented) Clear your token if using a shared computer

## Troubleshooting

**Q: I signed up as a Student but need Teacher access**
A: You'll need to create a new account with the Teacher role, or have a database administrator update your role directly in the database.

**Q: I'm logged in but still getting "Unauthorized" errors**
A: Try:
1. Log out and log back in
2. Check your browser console for errors
3. Clear your browser cache and localStorage
4. Make sure your account has the correct role

**Q: Where can I see what role I have?**
A: Currently, the role is stored in your JWT token. You can decode it or check the browser console. A future update could add a profile page showing your role.

## Need Admin Access?

If you need to set up the first admin account:

1. Sign up through the Auth panel
2. Select "Admin" from the role dropdown
3. Complete registration

Or manually in the database:
1. Connect to MongoDB
2. Find your user in the `users` collection
3. Update the `role` field to `"admin"`

## Related Documentation

- `TROUBLESHOOTING.md` - For general system issues
- `REGISTRATION-NUMBER-FORMAT.md` - For student registration numbers
