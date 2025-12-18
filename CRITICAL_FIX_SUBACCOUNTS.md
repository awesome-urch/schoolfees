# 🚨 CRITICAL FIX: Paystack Subaccounts Implementation

## ⚠️ **THE PROBLEM**

**YOU (the platform) own the Paystack account, but multiple schools use the platform.**

### **What Was Happening BEFORE:**
```
Student pays ₦50,000
       ↓
Goes to Paystack
       ↓
ALL money goes to YOUR (platform) account ❌
       ↓
Schools never get paid!
```

### **What SHOULD Happen:**
```
Student pays ₦50,000
       ↓
Goes to Paystack
       ↓
Money automatically routed to SCHOOL'S bank account ✅
       ↓
School gets paid directly
```

---

## ✅ **THE SOLUTION: Paystack Subaccounts**

### **What Are Subaccounts?**

Paystack Subaccounts allow you (the platform) to:
- Own the main Paystack account
- Route payments to individual schools' bank accounts
- Optionally take a commission (platform fee)
- Maintain control and oversight

Think of it like **Uber**:
- Uber owns the payment system
- But money goes to individual drivers
- Uber takes their cut automatically

---

## 🔧 **What Was Implemented**

### **1. Database Changes:**

**File: `backend/src/entities/business-account.entity.ts`**

Added fields:
```typescript
@Column({ name: 'subaccount_code', nullable: true })
subaccountCode: string; // Paystack subaccount identifier

@Column({ name: 'recipient_code', nullable: true })
recipientCode: string; // For manual transfers (if needed)
```

### **2. Paystack Service Updates:**

**File: `backend/src/modules/payments/paystack.service.ts`**

Added methods:
- `createSubaccount()` - Creates subaccount when school adds bank account
- `updateSubaccount()` - Updates subaccount details
- Updated `initializePayment()` - Now accepts `subaccountCode` parameter

### **3. Business Accounts Service:**

**File: `backend/src/modules/business-accounts/business-accounts.service.ts`**

When school adds bank account:
```typescript
// 1. Verify account with Paystack
await paystackService.resolveAccountNumber(...)

// 2. Create Paystack subaccount
const subaccountResponse = await paystackService.createSubaccount({
  business_name: school.name,
  settlement_bank: bankCode,
  account_number: accountNumber,
  percentage_charge: 0, // Platform commission (0% = no commission)
})

// 3. Store subaccount_code
account.subaccountCode = subaccountResponse.data.subaccount_code
```

### **4. Payments Service (MOST CRITICAL):**

**File: `backend/src/modules/payments/payments.service.ts`**

Before initializing payment:
```typescript
// CRITICAL: Get school's primary business account
const primaryAccount = await businessAccountRepo.findOne({
  where: { school: { id: schoolId }, isPrimary: true },
})

if (!primaryAccount || !primaryAccount.subaccountCode) {
  throw new NotFoundException('No business account configured')
}

// Initialize payment with subaccount
await paystackService.initializePayment({
  email,
  amount,
  reference,
  subaccountCode: primaryAccount.subaccountCode, // THIS IS THE KEY!
  metadata: {...}
})
```

---

## 💰 **Platform Commission (Optional)**

You can take a commission from each transaction:

### **How to Set Commission:**

In `business-accounts.service.ts`, change:
```typescript
percentage_charge: 0, // Change this!
```

**Examples:**
- `percentage_charge: 5` - Platform takes 5% of each transaction
- `percentage_charge: 10` - Platform takes 10%
- `percentage_charge: 0` - No commission (current setting)

### **How It Works:**
```
Student pays ₦50,000
       ↓
Paystack processes
       ↓
Platform gets: ₦2,500 (5% commission)
School gets: ₦47,500 (95%)
```

---

## 🔄 **The Complete Flow Now**

### **Step 1: School Adds Bank Account**
```
School goes to /dashboard/accounts
       ↓
Clicks "Add Account"
       ↓
Enters bank details
       ↓
System creates Paystack subaccount
       ↓
Stores subaccount_code in database
```

### **Step 2: Student Makes Payment**
```
Student selects school & fee
       ↓
Clicks "Proceed to Payment"
       ↓
Backend fetches school's subaccount_code
       ↓
Initializes Paystack payment WITH subaccount
       ↓
Student pays on Paystack
       ↓
Money goes to SCHOOL'S bank account ✅
       ↓
Platform gets commission (if configured)
```

---

## 📊 **Database Migration Required**

Since we added new fields, you need to restart the backend:

```bash
# Backend terminal
Ctrl + C
npm run start:dev
```

TypeORM will automatically add the new columns:
- `subaccount_code`
- `recipient_code`

---

## ⚙️ **Configuration**

### **No Commission (Current):**
```typescript
percentage_charge: 0
```
- School gets 100% of payment
- Platform makes no money from transactions
- Good for non-profit or getting started

### **With Commission:**
```typescript
percentage_charge: 5 // 5%
```
- School gets 95% of payment
- Platform gets 5%
- Sustainable business model

---

## 🎯 **What Happens to OLD Accounts?**

**Problem:** Existing business accounts don't have `subaccount_code`

**Solutions:**

### **Option 1: School Re-adds Account**
- School deletes old account
- Adds it again
- New subaccount created automatically

### **Option 2: Migration Script (Recommended)**

Create a script to generate subaccounts for existing accounts:

```typescript
// scripts/migrate-subaccounts.ts
async function migrateSubaccounts() {
  const accounts = await businessAccountRepo.find({
    where: { subaccountCode: null },
    relations: ['school'],
  })

  for (const account of accounts) {
    const response = await paystackService.createSubaccount({
      business_name: account.school.name,
      settlement_bank: account.bankCode,
      account_number: account.accountNumber,
      percentage_charge: 0,
    })

    account.subaccountCode = response.data.subaccount_code
    await businessAccountRepo.save(account)
  }
}
```

---

## 🚨 **IMPORTANT NOTES**

### **1. Primary Account Required**
Every school MUST have a primary business account before students can pay:
```
No primary account = Payment will fail ❌
With primary account = Payment succeeds ✅
```

### **2. Subaccount Verification**
Paystack verifies the bank account when creating subaccount:
- Account number must be valid
- Account name must match
- Bank code must be correct

### **3. Settlement Timing**
- Default: T+1 or T+2 (1-2 business days)
- Money goes directly to school's bank account
- Platform doesn't hold the money
- Platform commission (if any) goes to platform account

### **4. Testing**
When testing in Paystack **test mode**:
- Subaccounts still work
- No real money transferred
- Use test bank details from Paystack docs

---

## 📋 **Checklist**

### **Before First Payment:**
- ✅ School added in system
- ✅ School added bank account
- ✅ Subaccount created (automatic)
- ✅ Account set as primary
- ✅ Subaccount code stored in database

### **When Payment Happens:**
- ✅ System fetches primary account
- ✅ Gets subaccount_code
- ✅ Passes to Paystack
- ✅ Money routed to school
- ✅ Commission to platform (if configured)

---

## 🔍 **How to Verify It's Working**

### **1. Check Database:**
```sql
SELECT 
  school_id, 
  account_name, 
  account_number,
  subaccount_code,
  is_primary 
FROM business_accounts;
```

Should see `subaccount_code` populated: `ACCT_xxxxxxxxxx`

### **2. Check Paystack Dashboard:**
- Login to dashboard.paystack.com
- Go to: Settings → Subaccounts
- Should see list of schools as subaccounts

### **3. Test Payment:**
- Make test payment as student
- Check Paystack transaction
- Should show:
  - **Subaccount**: School's subaccount code
  - **Settlement Account**: School's bank account
  - **Platform Commission**: Your commission (if any)

---

## 🎓 **Example Scenario**

### **Scenario: St. Mary's School**

**Setup:**
1. St. Mary's registers on platform
2. Adds bank account: 0123456789, GTBank
3. System creates subaccount: `ACCT_abc123xyz`
4. Stores in database

**Student Payment:**
1. Student John pays ₦50,000 tuition
2. System fetches St. Mary's subaccount: `ACCT_abc123xyz`
3. Initializes Paystack with subaccount
4. John completes payment
5. Money flow:
   - Platform commission: ₦0 (0% configured)
   - St. Mary's gets: ₦50,000
   - Settled to: 0123456789 (St. Mary's account)

**Result:** ✅ St. Mary's receives ₦50,000 in 1-2 days

---

## 💡 **Recommendations**

### **For Platform Owners:**

**1. Commission Strategy:**
- Start with 0% to attract schools
- Later introduce 2-5% commission
- Or charge monthly subscription instead

**2. Transparency:**
- Show schools their commission rate
- Display in dashboard
- Be upfront about fees

**3. Support:**
- Help schools set up accounts
- Verify account details
- Monitor failed payments

### **For Schools:**

**1. Primary Account:**
- Set one account as primary
- This receives all payments
- Can change later if needed

**2. Multiple Accounts:**
- Can add multiple accounts
- Only primary receives payments
- Others as backup

**3. Monitoring:**
- Check Paystack for settlements
- Reconcile with platform records
- Report issues immediately

---

## 📚 **Additional Resources**

**Paystack Subaccounts Documentation:**
- https://paystack.com/docs/payments/split-payments
- https://paystack.com/docs/api/subaccount

**API Endpoints Used:**
- `POST /subaccount` - Create subaccount
- `PUT /subaccount/:code` - Update subaccount
- `POST /transaction/initialize` - Initialize payment with subaccount

---

## ✅ **Summary**

### **Before This Fix:**
- ❌ All money went to platform account
- ❌ Schools never got paid
- ❌ Platform would need to manually transfer

### **After This Fix:**
- ✅ Money goes directly to school accounts
- ✅ Automatic routing via subaccounts
- ✅ Optional platform commission
- ✅ Schools get paid in 1-2 days
- ✅ Fully automated

---

**THIS WAS A CRITICAL BUG FIX!** 🐛→✅

Without this, your platform wouldn't work for real payments!

---

**Last Updated**: December 18, 2024  
**Status**: ✅ FIXED AND READY

