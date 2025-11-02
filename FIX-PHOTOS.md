# 📸 Fix Student Photos Not Displaying

## Problem
Student photos show as broken image icons with "photo" text placeholder.

## Root Causes
1. ✅ Photos ARE being uploaded (checked backend/uploads folder - 35+ photos exist)
2. ❌ Photos may not be displaying due to:
   - Browser cache
   - Server not restarted after changes
   - Database records missing photoPath
   - CORS or path issues

## Solutions

### Option 1: Restart Server (Quick Fix)
```bash
# Stop server (Ctrl+C in terminal)
# Then restart:
npm start
```

### Option 2: Clear Browser Cache
1. Press `Ctrl + Shift + Delete`
2. Clear cached images
3. Refresh page (`Ctrl + F5`)

### Option 3: Check Photo URLs in Browser Console
1. Press `F12` to open DevTools
2. Go to **Console** tab
3. Reload page
4. Look for any errors related to `/uploads/` or 404 errors
5. If you see errors like:
   ```
   GET http://localhost:8080/uploads/xyz.jpg 404 (Not Found)
   ```
   Then the issue is with the server serving the uploads directory

### Option 4: Re-upload Student Photos
If specific students don't have photos:

1. **Edit the student:**
   - Click "✏️ Edit" button on student row
   - Upload a new photo
   - Save

2. **Or add new students with photos:**
   - Go to "Add New Student" form
   - Fill in details
   - Upload photo file OR use camera
   - Submit

### Option 5: Verify Server Configuration

The server should have this in `backend/server.js`:
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

This makes photos accessible at: `http://localhost:8080/uploads/filename.jpg`

## Testing Photo URLs

Open browser and try to access a photo directly:
```
http://localhost:8080/uploads/1760897398599-9cpmvkldt0m.jpg
```

If this works → Photos are accessible, issue is with the database records
If 404 error → Server configuration issue

## Expected Result

Photos should display as:
- ✅ Small circular thumbnail (36x36px) in table
- ✅ Larger photo (150x150px) in student profile
- ✅ Full photo in print view

## Common Mistakes

❌ **Don't forget to:**
- Restart the server after making changes
- Upload photos when adding students
- Check that file input has `accept="image/*"` attribute
- Verify uploads directory has write permissions
