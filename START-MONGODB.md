# 🔥 Server Keeps Stopping - MongoDB Not Running!

## ❌ **THE PROBLEM:**

Your server stops because **MongoDB is not running** on your computer!

Line 43 in server.js: `process.exit(1)` stops the server when MongoDB connection fails.

## ✅ **I JUST FIXED IT!**

Now the server will:
- ✅ **Start anyway** even if MongoDB is not running
- ✅ **Keep trying** to connect to MongoDB every 10 seconds
- ✅ **Show warnings** but won't crash

## 🚀 **START SERVER NOW:**

```bash
cd backend
node server.js
```

You should see:
```
✅ Server running on http://localhost:8080
Attempting to connect to MongoDB...
❌ MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017
⚠️  Server is running but database features will not work!
```

**Server stays running!** ✅

## 📌 **TO FIX MONGODB:**

### **Option 1: Start MongoDB Service (If Installed)**

**Method A: Using Services**
1. Press `Win + R`
2. Type: `services.msc`
3. Press Enter
4. Find "MongoDB" service
5. Right-click → Start

**Method B: Command Line**
```powershell
# Run as Administrator
net start MongoDB
```

**Method C: Manual Start**
```powershell
# If MongoDB is installed but not as service
mongod --dbpath "C:\data\db"
```

### **Option 2: Install MongoDB (If Not Installed)**

1. **Download MongoDB:**
   - Go to: https://www.mongodb.com/try/download/community
   - Download MongoDB Community Server
   - Install it

2. **Create Data Directory:**
   ```powershell
   mkdir C:\data\db
   ```

3. **Start MongoDB:**
   ```powershell
   mongod --dbpath "C:\data\db"
   ```

### **Option 3: Use MongoDB Atlas (Cloud - FREE)**

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Create free account
3. Create free cluster
4. Get connection string
5. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/schoolDB
   ```

## 🎯 **QUICK TEST:**

### **Check if MongoDB is Running:**
```powershell
# Test connection
mongo --eval "db.version()"
```

OR

```powershell
# Check if service is running
Get-Service MongoDB
```

### **If MongoDB is Running:**
- Server will connect automatically
- You'll see: `✅ Connected to MongoDB`
- All features work ✅

### **If MongoDB is NOT Running:**
- Server still runs on port 8080
- Database features won't work
- You'll see connection warnings

## 🔧 **CURRENT STATUS:**

After my fix:
- ✅ Server **WON'T crash** anymore
- ✅ Server **STAYS running** on port 8080
- ✅ Frontend **loads normally**
- ⚠️  Database features need MongoDB

## 📋 **What Works Without MongoDB:**

- ✅ Server runs
- ✅ Static files load
- ✅ Frontend displays
- ❌ Login/Signup (needs DB)
- ❌ Student data (needs DB)
- ❌ All CRUD operations (need DB)

## 📋 **What Works WITH MongoDB:**

- ✅ Everything!
- ✅ Login/Signup
- ✅ View/Edit/Delete students
- ✅ All database features

---

## ⚡ **DO THIS NOW:**

### **Step 1: Start Server (Always Works)**
```bash
cd backend
node server.js
```

### **Step 2: Check MongoDB**
```powershell
# Try to start MongoDB
net start MongoDB
```

### **Step 3: If MongoDB Starts**
- Server automatically connects
- All features work! ✅

### **Step 4: If MongoDB Doesn't Start**
- Server still runs
- Install MongoDB using Option 2 above

---

## 🎉 **GOOD NEWS:**

Your server will **NEVER stop** anymore! Even without MongoDB, it will:
- ✅ Run on port 8080
- ✅ Serve the frontend
- ✅ Keep retrying MongoDB connection
- ✅ Show you helpful error messages

**Test it now:** `cd backend && node server.js` ✅
