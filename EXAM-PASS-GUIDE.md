# 🎫 Exam Pass System - Complete Guide

## How Exam Passes Work

### Step-by-Step Process

```
1. Student Submits Payment (Exam Fee)
           ↓
2. Payment Status = "Pending" 
   Exam Pass # = "—"
           ↓
3. Admin/Teacher Confirms Payment
           ↓
4. System Auto-Generates Exam Pass
           ↓
5. Exam Pass # Shows: 🎫 EP-2025-000001
           ↓
6. Student Uses Pass Number for Verification
```

## Payment Types and Exam Passes

| Payment Type         | Generates Exam Pass? | Shows in Exam Pass # Column |
|---------------------|---------------------|---------------------------|
| **Exam Fee**        | ✅ YES              | 🎫 EP-2025-XXXXXX        |
| Tuition Fee         | ❌ NO               | —                         |
| Registration Fee    | ❌ NO               | —                         |
| Library Fee         | ❌ NO               | —                         |
| Other               | ❌ NO               | —                         |

## Example Scenario

### ❌ Wrong Way (What you did in screenshot):
```
Payment Type: Tuition Fee
Status: ✓ Confirmed
Exam Pass #: — (dash - no pass generated)
```
**Result:** No exam pass because it's not an Exam Fee!

### ✅ Correct Way:
```
Payment Type: Exam Fee
Status: ✓ Confirmed  
Exam Pass #: 🎫 EP-2025-000001
```
**Result:** Exam pass generated and visible!

## How to Create an Exam Fee Payment

### Form Fields:
```
Student ID or Name: sarah (25/DAI/008)
Payment Type: Exam Fee ← IMPORTANT!
Amount: 50.00
Payment Method: Mobile Money (or any)
Semester: Semester 1, Year 1
Academic Year: 2024/2025
Transaction Reference: (optional)
Description: (optional)
```

### What Happens:
1. **Submit** → Creates payment with receipt `RCP-2025-000002`
2. **Status:** Pending (yellow badge ⏳)
3. **Exam Pass #:** — (not generated yet)
4. **Admin clicks "✅ Confirm"** → Auto-generates pass
5. **Exam Pass #:** 🎫 EP-2025-000001 (blue badge)
6. **Status:** Confirmed (green badge ✓)

## Exam Pass Number Format

```
EP-YEAR-XXXXXX
│  │    │
│  │    └─ Sequential number (000001, 000002, ...)
│  └────── Year (2025, 2026, ...)
└───────── Prefix "EP" (Exam Pass)

Examples:
- EP-2025-000001
- EP-2025-000002
- EP-2025-000003
```

## Using the Exam Pass

### Verification Process:
1. **Student receives pass number** (from Exam Pass # column)
2. **Go to "Exam Passes" page**
3. **Click "Verify Exam Pass"**
4. **Enter pass number:** EP-2025-000001
5. **Click "🔍 Verify Pass"**

### Verification Shows:
```
✅ Valid Exam Pass

Pass Number: EP-2025-000001
Student: sarah (25/DAI/008)
Semester: Semester 1, Year 1
Academic Year: 2024/2025
Exam Type: End-Term
Issue Date: 11/1/2025
Expiry Date: 1/30/2026 (90 days from issue)
Status: Active
```

## Exam Pass Statuses

| Status    | Badge Color | Meaning                          |
|-----------|-------------|----------------------------------|
| Active    | 🟢 Green    | Valid for use, not expired       |
| Expired   | 🟡 Yellow   | Past expiry date                 |
| Revoked   | 🔴 Red      | Canceled by admin (invalid)      |

## Admin Actions

### Confirming Payments:
- **Who can confirm:** Admin, Teacher roles
- **Button:** ✅ Confirm
- **Action:** Changes status to "Confirmed" + generates exam pass (if Exam Fee)

### Rejecting Payments:
- **Who can reject:** Admin, Teacher roles
- **Button:** ❌ Reject
- **Action:** Changes status to "Rejected" (no exam pass generated)

### Revoking Exam Passes:
- **Who can revoke:** Admin only
- **Action:** Invalidates exam pass (status → Revoked)
- **Use case:** Student didn't pay, fraud, etc.

## Troubleshooting

### "Why don't I see an exam pass number?"

**Check these:**
1. ✅ Is payment type "Exam Fee"? (not Tuition Fee, etc.)
2. ✅ Has payment been confirmed? (status should be green "✓ Confirmed")
3. ✅ Did you wait a moment? (exam pass generates after confirmation)
4. ✅ Did you refresh the page? (press F5)

### "The exam pass # shows '—' (dash)"

**Reasons:**
- Payment type is NOT "Exam Fee"
- Payment is still "Pending" (not confirmed yet)
- Payment was "Rejected"

**Solution:** Submit a NEW payment with type "Exam Fee" and confirm it.

### "Pass shows 'Generating...'"

This means:
- Payment is confirmed
- It's an Exam Fee
- But exam pass hasn't linked yet

**Solution:** Refresh the page (F5) - should appear within seconds.

## Features

✅ **Automatic generation** - No manual entry needed
✅ **Unique numbers** - Sequential, never duplicate
✅ **Linked to payments** - Traceable to specific receipt
✅ **Expiry tracking** - 90-day validity (configurable)
✅ **Status management** - Active, Expired, Revoked
✅ **Verification system** - Easy lookup by pass number
✅ **Audit trail** - Shows who issued, when, why

## Database Structure

### Payment Record:
```json
{
  "receiptNumber": "RCP-2025-000001",
  "student_id": "673abc...",
  "paymentType": "Exam Fee",
  "amount": 50,
  "status": "Confirmed",
  "examPassGenerated": true,
  "examPassId": "673def..." ← Links to exam pass
}
```

### Exam Pass Record:
```json
{
  "passNumber": "EP-2025-000001",
  "student_id": "673abc...",
  "payment_id": "673xyz..." ← Links to payment,
  "semester": "Semester 1, Year 1",
  "academicYear": "2024/2025",
  "examType": "End-Term",
  "issueDate": "2025-11-01",
  "expiryDate": "2026-01-30",
  "status": "Active",
  "issuedBy": "673admin..."
}
```

## Best Practices

1. **Always use "Exam Fee" type** for exam-related payments
2. **Confirm payments promptly** to generate passes on time
3. **Verify passes before exams** to catch issues early
4. **Check expiry dates** - passes expire after 90 days
5. **Keep receipts** - link between payment and exam pass
6. **Monitor revoked passes** - prevent misuse
