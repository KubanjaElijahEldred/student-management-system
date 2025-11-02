# ✅ Exam Pass Number Display Update

## Summary
Updated the payment management system to automatically display exam pass numbers on receipts after confirmation.

## Changes Made

### 1. Backend Updates (`backend\routes\api.js`)

#### Fixed Role Authorization (Lines 430, 481, 507, 562)
- Changed capitalized roles to lowercase to match database schema
- **Before:** `allowRoles(['Admin', 'Teacher'])`
- **After:** `allowRoles('admin', 'teacher')`

#### Added Exam Pass Population (Lines 399, 412)
- Added `.populate('examPassId', 'passNumber expiryDate status')` to payment endpoints
- Now fetches exam pass details automatically when loading payments

### 2. Frontend Updates

#### HTML Table (`public\index.html`, Line 849)
- **Added:** New column header "Exam Pass #" in payments table
- **Updated:** Table colspan from 8 to 9 columns

#### JavaScript Display (`public\app.js`, Lines 1924-1929)
- **Added:** Exam pass number display logic with visual indicators:
  - 🎫 **Blue badge** with pass number (e.g., "EP-2025-000001") when available
  - ⏳ **"Generating..."** message for confirmed exam fee payments without linked pass yet
  - **"—"** for non-exam-fee payments or pending payments

## How It Works

1. **Student submits payment** → Receipt number generated
2. **Admin/Teacher confirms payment** → If it's an "Exam Fee":
   - Exam pass is automatically generated
   - Pass number is created (format: `EP-YEAR-XXXXXX`)
   - Pass is linked to the payment
3. **Receipt display updates** → Exam pass number appears in the table
4. **Student can use the number** → For verification in the "Exam Passes" section

## Visual Example

```
┌──────────────┬──────────┬──────────┬─────────┬──────────────┬───────────┬──────────────────┬────────────┬─────────┐
│ Receipt #    │ Student  │ Type     │ Amount  │ Method       │ Status    │ Exam Pass #      │ Date       │ Actions │
├──────────────┼──────────┼──────────┼─────────┼──────────────┼───────────┼──────────────────┼────────────┼─────────┤
│ RCP-2025-... │ John Doe │ Exam Fee │ $50.00  │ Bank Transfer│ ✓Confirmed│ 🎫 EP-2025-00001 │ 11/01/2025 │ 🎫 Pass │
│              │          │          │         │              │           │                  │            │Generated│
└──────────────┴──────────┴──────────┴─────────┴──────────────┴───────────┴──────────────────┴────────────┴─────────┘
```

## Testing Steps

1. **Restart the server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm start
   ```

2. **Submit an exam fee payment:**
   - Navigate to "Payments" page
   - Submit a new payment with type "Exam Fee"

3. **Confirm the payment:**
   - Click "✅ Confirm" button (requires admin/teacher role)
   - Exam pass will be generated automatically

4. **Verify display:**
   - The exam pass number should appear in the "Exam Pass #" column
   - It should be displayed with a blue badge: 🎫 EP-2025-XXXXXX

5. **Copy the pass number:**
   - Student can copy this number
   - Use it in the "Exam Passes" → "Verify Exam Pass" section

## Benefits

✅ **Immediate visibility** - Pass number shown right after confirmation
✅ **No manual lookup needed** - Students see their pass number on the receipt
✅ **Easy verification** - Copy and paste into verification field
✅ **Clear status indicators** - Visual badges for different states
✅ **Better user experience** - One-stop view for payment and exam pass info

## Notes

- Only "Exam Fee" payment types generate exam passes
- Pass numbers follow format: `EP-YEAR-XXXXXX` (e.g., EP-2025-000001)
- Pass expiry date is 90 days from issue date (configurable in ExamPass model)
- Admin and teacher roles can confirm/reject payments
- Only admin role can revoke exam passes
