# Paystack Settlement Guide - How Schools Get Paid

## 🏦 **How Settlements Currently Work**

### **Timeline Breakdown:**

```
Student Payment Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Day 0 - Monday 10:00 AM
├─ Student pays ₦50,850 via Paystack
├─ Payment appears as "successful" immediately
├─ Money is in Paystack's custody
└─ School sees payment in dashboard

Day 0 - Monday 10:05 AM  
├─ Paystack verifies transaction
├─ Checks for fraud indicators
└─ Validates payment authenticity

Day 1 - Tuesday (T+1)
├─ Paystack processes settlement batch
├─ Initiates bank transfer to school's primary account
└─ Bank receives transfer instruction

Day 2 - Wednesday (T+2)
└─ ₦50,000 appears in school's bank account ✅
```

### **Why the Delay?**

1. **Fraud Prevention** 🛡️
   - Paystack checks for suspicious patterns
   - Validates card authenticity
   - Prevents chargeback fraud

2. **Banking System** 🏦
   - Nigerian banks use T+1 settlement cycle
   - Inter-bank transfers take time
   - Bank processing hours (9 AM - 4 PM)

3. **Risk Management** ⚠️
   - Allows time to detect disputes
   - Protects both merchant and customer
   - Industry standard practice

---

## ⚡ **Options for Faster Settlements**

### **Option 1: Paystack Instant Settlements**

**What it is:**
- Get paid within 30 minutes to 2 hours
- Money transferred immediately after successful payment
- Available for qualified merchants

**Requirements:**
- ✅ Verified business account
- ✅ Good transaction history (usually 3-6 months)
- ✅ Low chargeback rate
- ✅ KYC documents submitted
- ✅ Approval from Paystack

**How to Apply:**
1. Login to Paystack Dashboard
2. Go to Settings → Payouts
3. Click "Request Instant Settlements"
4. Fill application form
5. Wait for approval (usually 3-5 business days)

**Cost:**
- Additional 1-2% fee on instant settlements
- Example: ₦50,000 payment → ₦500-1,000 extra fee

**Pros:**
- ✅ Money available immediately
- ✅ Better cash flow
- ✅ No waiting period

**Cons:**
- ❌ Higher fees
- ❌ Must qualify and get approved
- ❌ May have daily/monthly limits

---

### **Option 2: Manual Transfers (Available Now)**

**What it is:**
- School manually requests transfer from Paystack balance
- Available balance can be withdrawn anytime

**How to Do It:**

1. **Login to Paystack Dashboard:**
   - Go to: https://dashboard.paystack.com/

2. **Check Balance:**
   - Navigate to: Transfers → Balance
   - See available balance (pending and available)

3. **Initiate Transfer:**
   - Click "Transfer"
   - Select destination account (from business accounts)
   - Enter amount
   - Confirm transfer

4. **Receive Money:**
   - Processing time: 30 minutes - 2 hours
   - Money credited to bank account

**Cost:**
- ₦50 per transfer (flat fee)
- No percentage charge

**Pros:**
- ✅ Available to all merchants
- ✅ Flexible timing
- ✅ Low flat fee

**Cons:**
- ❌ Requires manual action
- ❌ Still takes 30 min - 2 hours
- ❌ Must have available balance

---

### **Option 3: Scheduled Automatic Settlements (Default)**

**What it is:**
- Paystack automatically transfers to primary account
- Happens on a schedule (daily, weekly, or monthly)

**How to Configure:**

1. Login to Paystack Dashboard
2. Go to: Settings → Payouts
3. Set settlement schedule:
   - **Daily** - Every business day at 9 AM
   - **Weekly** - Every Friday
   - **Monthly** - Last business day of month

**Default:**
- Most accounts: T+1 or T+2 automatic settlement
- Paystack decides based on account age and history

**Pros:**
- ✅ Fully automatic
- ✅ Predictable
- ✅ No action required
- ✅ No extra fees

**Cons:**
- ❌ 1-2 day wait
- ❌ Not instant

---

## 💡 **Recommendations by School Size**

### **Small Schools (< 500 students):**
**Use:** Default T+1/T+2 settlements
- **Why:** Lower transaction volume, can wait 1-2 days
- **Cost:** Standard Paystack fees only
- **Cash flow:** Plan for 2-day delay

### **Medium Schools (500-2000 students):**
**Use:** Daily automatic settlements
- **Why:** Regular cash flow important
- **Cost:** No extra fee
- **Action:** Configure daily settlements in Paystack

### **Large Schools (2000+ students):**
**Use:** Instant settlements (if available)
- **Why:** High volume, immediate cash flow critical
- **Cost:** Extra 1-2% fee justified
- **Action:** Apply for instant settlements

### **Emergency Situations:**
**Use:** Manual transfers
- **Why:** Need money urgently
- **Cost:** ₦50 flat fee
- **Speed:** 30 min - 2 hours

---

## 🔍 **How to Check Settlement Status**

### **In Paystack Dashboard:**

1. **Navigate to Transactions:**
   ```
   Dashboard → Transactions → Successful
   ```

2. **Check Settlement Status:**
   - **Pending** - Not yet settled
   - **Processing** - Being transferred
   - **Settled** - Money in your account

3. **View Settlement History:**
   ```
   Dashboard → Payouts → Settlements
   ```
   Shows:
   - Settlement date
   - Amount
   - Destination account
   - Status

---

## 🎯 **What Happens in Our System**

### **Current Implementation:**

```javascript
// 1. Student Pays
POST /payments/initialize
└─> Creates payment record (status: "pending")
└─> Calls Paystack API
└─> Returns Paystack authorization URL

// 2. Student Completes Payment on Paystack
Paystack processes payment
└─> Redirects to: /payment/verify?reference=XXX

// 3. Verification
GET /payments/verify/:reference
└─> Calls Paystack verify API
└─> Updates payment status to "successful"
└─> Saves payment record

// 4. Settlement (Happens on Paystack Side)
Paystack handles this automatically:
├─ T+0: Holds money
├─ T+1: Processes settlement
└─ T+2: Money in school's bank account
```

### **What We Store:**

**payments Table:**
```sql
- id
- reference (e.g., PAY-1234567890-123)
- amount (₦50,000)
- status ("successful")
- payment_method ("paystack")
- paid_at (timestamp)
- student_id
- fee_type_id
- school_id
```

**business_accounts Table:**
```sql
- id
- account_number
- account_name
- bank_code
- is_primary (true/false)
- school_id
```

**Settlement happens on Paystack's side**, we don't control timing.

---

## 🚀 **Future Enhancements (Optional)**

### **1. Settlement Tracking Dashboard:**

Show schools their settlement status:
```typescript
// New endpoint
GET /settlements/school/:schoolId

Response:
{
  pendingSettlements: [
    {
      amount: 50000,
      expectedDate: "2024-12-20",
      payments: 5
    }
  ],
  completedSettlements: [
    {
      amount: 250000,
      settledDate: "2024-12-18",
      payments: 25
    }
  ]
}
```

### **2. Paystack Balance Check:**

Show available balance in dashboard:
```typescript
// New endpoint
GET /paystack/balance/school/:schoolId

Response:
{
  availableBalance: 150000,
  pendingBalance: 50000,
  ledgerBalance: 200000
}
```

### **3. Manual Transfer Request:**

Allow schools to request immediate transfer:
```typescript
// New endpoint
POST /settlements/withdraw

Request:
{
  schoolId: 1,
  amount: 50000,
  accountId: 3
}

// Calls Paystack Transfer API
```

### **4. Settlement Notifications:**

Email/SMS when money is settled:
- "₦50,000 has been settled to your account"
- "Settlement of ₦150,000 expected tomorrow"

---

## 📊 **Settlement Example Scenarios**

### **Scenario 1: Single Payment**

```
Monday 10:00 AM:
- Student A pays ₦50,000
- Status: Successful
- Paystack holds: ₦50,000

Tuesday 9:00 AM:
- Paystack initiates settlement
- Transfer: ₦50,000 → School's Bank

Wednesday 8:00 AM:
- Money appears in school's account
- Total received: ₦50,000
```

### **Scenario 2: Multiple Payments (Same Day)**

```
Monday:
- Student A pays ₦50,000 at 9:00 AM
- Student B pays ₦30,000 at 11:00 AM
- Student C pays ₦20,000 at 2:00 PM
- Total: ₦100,000 (held by Paystack)

Tuesday:
- Paystack settles all together
- Single transfer: ₦100,000

Wednesday:
- School receives: ₦100,000
```

### **Scenario 3: With Instant Settlements**

```
Monday 10:00 AM:
- Student A pays ₦50,000
- Status: Successful

Monday 10:30 AM:
- Paystack processes instant settlement
- Transfer initiated

Monday 11:00 AM:
- Money in school's account
- Total received: ₦49,000 (₦50,000 - ₦1,000 instant fee)
```

---

## ⚙️ **Configuration Checklist**

### **Essential Setup (Already Done):**
- ✅ Business account added
- ✅ Account verified with Paystack
- ✅ Primary account set
- ✅ Payment integration working

### **Optimization Setup:**
- ⬜ Configure settlement schedule in Paystack Dashboard
- ⬜ Set up email notifications for settlements
- ⬜ Add multiple accounts (backup)
- ⬜ Apply for instant settlements (if needed)

### **Monitoring Setup:**
- ⬜ Check Paystack dashboard daily
- ⬜ Reconcile settlements with payment records
- ⬜ Track settlement timing patterns
- ⬜ Monitor for failed settlements

---

## 🎓 **Key Takeaways**

1. **Default: 1-2 days** - Standard for all payment gateways
2. **Instant available** - But costs extra and requires approval
3. **Manual transfers** - Available for urgent needs (₦50 fee)
4. **Automatic** - Happens on Paystack's schedule
5. **Schools get full amount** - Students pay transaction fees
6. **Track in dashboard** - Check Paystack for settlement status

---

## 📞 **Need Faster Settlements?**

**Contact Paystack:**
- Email: support@paystack.com
- Phone: +234 1 888 7278
- Dashboard: https://dashboard.paystack.com
- Docs: https://paystack.com/docs/payouts/

**Request:**
- Instant settlements
- Daily settlement schedule
- Lower settlement threshold
- Increase settlement speed

---

**Last Updated**: December 18, 2024

