# 🧪 TEST: Create Exam Fee Payment

## EXACT Steps to Test Exam Pass Generation

### Step 1: Go to Payments Page
Click on **💳 Payments** in the sidebar

### Step 2: Fill Form with THESE EXACT VALUES

```
Student ID or Name: sarah
Payment Type: Exam Fee ⬅️⬅️⬅️ NOT "Tuition Fee"!
Amount: 25
Payment Method: Cash
Semester: Semester 1, Year 1
Academic Year: 2024/2025
Transaction Reference: (leave blank)
Description: Test exam fee
```

### Step 3: Click "💰 Submit Payment"

You should see:
```
Payment submitted successfully!

Receipt Number: RCP-2025-000003
Status: Pending

The payment is now pending confirmation from the financial department.
```

### Step 4: Confirm the Payment

1. Look in the table for receipt **RCP-2025-000003**
2. **Verify** the Type column shows: **"Exam Fee"** (NOT Tuition Fee)
3. Click **✅ Confirm** button
4. You should see alert:
   ```
   Payment confirmed successfully!
   
   🎫 Exam Pass Generated!
   Pass Number: EP-2025-000001
   Valid Until: [date 90 days from now]
   ```

### Step 5: Check the Result

The table should now show:
```
Receipt #        | Student  | Type      | ... | Exam Pass #      | ...
RCP-2025-000003 | sarah    | Exam Fee  | ... | 🎫 EP-2025-000001| ...
                                              ^^^ SHOULD APPEAR HERE
```

### What If It Still Shows "—"?

1. **Refresh the page** (F5)
2. **Check browser console** (F12) for errors
3. **Verify payment type** is "Exam Fee" in the table
4. **Check server logs** for errors

## Why Your Current Payments Show "—"

```
RCP-2025-000002: Tuition Fee → No exam pass (by design)
RCP-2025-000001: Tuition Fee → No exam pass (by design)
```

Only "Exam Fee" payments generate exam passes!

## Payment Types Reference

| Payment Type      | Generates Exam Pass? |
|-------------------|---------------------|
| Exam Fee          | ✅ YES              |
| Tuition Fee       | ❌ NO               |
| Registration Fee  | ❌ NO               |
| Library Fee       | ❌ NO               |
| Other             | ❌ NO               |

## Backend Logic (For Reference)

```javascript
// Line 451 in backend/routes/api.js
if (payment.paymentType === 'Exam Fee' && !payment.examPassGenerated) {
  // ^^^ THIS MUST BE TRUE
  examPass = new ExamPass({...});
  await examPass.save();
  payment.examPassGenerated = true;
  payment.examPassId = examPass._id;
  await payment.save();
}
```

Your "Tuition Fee" payments never enter this if-statement!
