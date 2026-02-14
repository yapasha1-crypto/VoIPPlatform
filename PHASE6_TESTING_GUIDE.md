# 🧪 PHASE 6 - Dynamic Rates Engine Testing Guide

## 🎯 Quick Start (One-Command Setup)

### **1. Seed Base Rates (Sample Data)**
```bash
POST https://localhost:7296/api/seed/rates
```

**Response:**
```json
{
  "success": true,
  "message": "Base rates seeded successfully",
  "totalSeeded": 20,
  "statistics": {
    "averageBuyPrice": 0.05285,
    "lowestBuyPrice": 0.00500,
    "highestBuyPrice": 0.95000
  }
}
```

**What it does:**
- ✅ Creates 20 realistic destinations (USA, UK, Sweden, UAE, Afghanistan, etc.)
- ✅ Assigns varied buy prices ($0.005 to $0.95 per minute)
- ✅ Prevents duplicates (returns error if rates exist)
- ✅ Can be cleared and re-seeded with `?clear=true`

---

## 📋 Sample Destinations Created

| Destination | Code | Buy Price | Notes |
|------------|------|-----------|-------|
| USA | 1 | $0.00500 | Cheapest |
| Canada | 1 | $0.00600 | |
| UK - Fixed | 44 | $0.01200 | |
| UK - Mobile | 447 | $0.02500 | |
| Sweden | 46 | $0.01000 | |
| Sweden - Mobile | 467 | $0.02200 | |
| Germany | 49 | $0.01500 | |
| France | 33 | $0.01800 | |
| UAE | 971 | $0.04200 | |
| India - Fixed | 91 | $0.02800 | |
| India - Mobile | 917 | $0.03200 | |
| Pakistan | 92 | $0.05500 | |
| Egypt | 20 | $0.06000 | |
| Afghanistan | 93 | $0.08500 | |
| Somalia | 252 | $0.12000 | |
| South Sudan | 211 | $0.15000 | |
| Satellite | 881 | $0.95000 | Most Expensive |

---

## 🧪 Complete Testing Workflow

### **Step 1: Start Backend**
```bash
cd C:\Users\mejer\Desktop\VoIPPlatform\VoIPPlatform.API\VoIPPlatform.API
dotnet run
```

### **Step 2: Seed Base Rates**
Using PowerShell, Postman, or curl:

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "https://localhost:7296/api/seed/rates" -Method POST -SkipCertificateCheck
```

**curl:**
```bash
curl -X POST https://localhost:7296/api/seed/rates -k
```

**Postman:**
- Method: `POST`
- URL: `https://localhost:7296/api/seed/rates`
- No auth required (AllowAnonymous)

### **Step 3: Login to Frontend**
```bash
cd C:\Users\mejer\Desktop\VoIPPlatform\VoIPPlatform.Web
npm run dev
```

Navigate to: `http://localhost:5173`

**Login Credentials:**
- **Admin:** `admin` / `Password123!`
- **Reseller:** `reseller` / `Password123!`
- **User:** `user` / `Password123!`

### **Step 4: Test Rate Configuration (Admin/Reseller)**

1. **Navigate to:** Sidebar → "Rate Configuration"
2. **Select Tariff Plan:** Choose from dropdown
   - `[Predefined] 0% List` → Buy Rate = Sell Rate
   - `[Predefined] 10% Profit` → Sell Rate = Buy Rate × 1.10
   - `[Predefined] Free List` → All rates $0.00000
3. **Observe Live Calculation:** Table updates instantly
4. **Create Custom Plan:**
   - Click "Add New Rate List"
   - Set: Name = "Premium 15%", Type = Percentage, Profit = 15%
   - Click "Create Plan"
5. **Export Rates:** Click "Export to CSV" to download

### **Step 5: Assign Tariff to User**

**Endpoint:** `POST /api/rates/assign-plan`
**Auth:** Bearer token (Admin/Reseller)

**Request Body:**
```json
{
  "userId": 5,
  "tariffPlanId": 2
}
```

**PowerShell Example:**
```powershell
$token = "your_jwt_token_here"
$headers = @{ Authorization = "Bearer $token" }
$body = @{ userId = 5; tariffPlanId = 2 } | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost:7296/api/rates/assign-plan" `
  -Method POST -Headers $headers -Body $body -ContentType "application/json" -SkipCertificateCheck
```

### **Step 6: View Rates as User**

1. **Logout** from Admin/Reseller
2. **Login as User:** `user` / `Password123!`
3. **Navigate to:** Sidebar → "My Rates"
4. **View Assigned Rates:**
   - Search by destination or code
   - Sort by any column
   - Export to CSV

---

## 🔄 Utility Endpoints

### **Re-seed with Fresh Data**
```bash
POST https://localhost:7296/api/seed/rates?clear=true
```

### **Clear All Rates**
```bash
POST https://localhost:7296/api/seed/clear-rates
```

### **Get All Base Rates (Admin)**
```bash
GET https://localhost:7296/api/rates/base-rates
Authorization: Bearer <token>
```

### **Get All Tariff Plans**
```bash
GET https://localhost:7296/api/rates/tariff-plans
Authorization: Bearer <token>
```

### **Get Configured Rates (Simulation)**
```bash
GET https://localhost:7296/api/rates/configure?planId=2
Authorization: Bearer <token>
```

### **Get User's Assigned Rates**
```bash
GET https://localhost:7296/api/rates/my-rates
Authorization: Bearer <token>
```

---

## 🧮 Testing Calculation Logic

### **Example: 10% Profit Plan**
**Formula:** `SellPrice = BuyPrice + (BuyPrice × 0.10)`

| Destination | Buy Rate | Sell Rate | Profit | Margin % |
|------------|----------|-----------|--------|----------|
| USA | $0.00500 | $0.00550 | $0.00050 | 10.00% |
| Sweden | $0.01000 | $0.01100 | $0.00100 | 10.00% |
| UAE | $0.04200 | $0.04620 | $0.00420 | 10.00% |
| Afghanistan | $0.08500 | $0.09350 | $0.00850 | 10.00% |

### **Example: Custom 15% with Min/Max**
**Settings:**
- Profit: 15%
- Min Profit: $0.00100
- Max Profit: $0.05000

| Destination | Buy Rate | Calculated Profit | Applied Profit | Sell Rate | Reason |
|------------|----------|------------------|----------------|-----------|--------|
| USA | $0.00500 | $0.00075 | $0.00100 | $0.00600 | Min constraint |
| Sweden | $0.01000 | $0.00150 | $0.00150 | $0.01150 | Normal |
| Satellite | $0.95000 | $0.14250 | $0.05000 | $1.00000 | Max constraint |

---

## ✅ Expected Behavior Checklist

### **Backend**
- [ ] `POST /api/seed/rates` creates 20 base rates
- [ ] Predefined plans (0%, 10%, Free) exist in database
- [ ] `GET /api/rates/configure?planId=X` calculates sell prices correctly
- [ ] `GET /api/rates/my-rates` returns user's assigned rates
- [ ] `POST /api/rates/tariff-plans` creates custom plans
- [ ] `POST /api/rates/assign-plan` assigns plan to user

### **Frontend - Admin/Reseller**
- [ ] Sidebar shows "Rate Configuration" link
- [ ] Dropdown lists all tariff plans
- [ ] Table shows 20 destinations with correct calculations
- [ ] Search filters destinations by name/code
- [ ] "Add New Rate List" modal creates custom plans
- [ ] "Export to CSV" downloads configured rates
- [ ] "Upload Base Rates" accepts CSV files

### **Frontend - User**
- [ ] Sidebar shows "My Rates" link
- [ ] Statistics cards display correct values
- [ ] Table shows only assigned tariff rates
- [ ] Search and sort work correctly
- [ ] "Export Rates" downloads personal rates

---

## 🐛 Troubleshooting

### **Problem: Rates not appearing in UI**
**Solution:**
1. Check if base rates exist: `GET /api/rates/base-rates`
2. Verify tariff plans: `GET /api/rates/tariff-plans`
3. Check browser console for errors
4. Verify API_BASE_URL in frontend `.env` file

### **Problem: "Base rates already exist"**
**Solution:** Use `POST /api/seed/rates?clear=true` to replace

### **Problem: User sees no rates**
**Solution:**
1. Verify user has `TariffPlanId` assigned
2. Use `POST /api/rates/assign-plan` to assign a plan
3. Check database: `SELECT * FROM Users WHERE Id = X`

### **Problem: Calculations seem wrong**
**Solution:**
1. Check tariff plan settings (profit %, min/max)
2. Verify formula in `RateCalculatorService.cs:39-60`
3. Test with simple plan (0% or 10%)

---

## 📊 Database Verification

### **Check Base Rates**
```sql
SELECT TOP 5 * FROM BaseRates ORDER BY BuyPrice DESC;
```

### **Check Tariff Plans**
```sql
SELECT * FROM TariffPlans;
```

### **Check User Assignments**
```sql
SELECT u.Username, u.Role, tp.Name AS TariffPlan
FROM Users u
LEFT JOIN TariffPlans tp ON u.TariffPlanId = tp.Id;
```

### **Test Calculation (Manual)**
```sql
SELECT
    br.DestinationName,
    br.BuyPrice,
    br.BuyPrice + (br.BuyPrice * 0.10) AS SellPrice_10Percent,
    (br.BuyPrice * 0.10) AS Profit
FROM BaseRates br
ORDER BY br.BuyPrice;
```

---

## 🎉 Success Criteria

**Phase 6 is working correctly when:**

1. ✅ Seeder creates 20 base rates instantly
2. ✅ Dropdown shows 3 predefined plans + custom plans
3. ✅ Table displays 20 destinations with live calculations
4. ✅ 10% plan shows exactly 10% margin for all rates
5. ✅ Free plan shows $0.00000 for all sell prices
6. ✅ Custom plan creation works with all constraints
7. ✅ User assigned to plan sees correct rates
8. ✅ Export generates valid CSV files
9. ✅ No duplicate rates created
10. ✅ All UI elements match glassmorphism design

---

## 🚀 Next Steps After Testing

Once Phase 6 is verified:
1. **Test LCR (Least Cost Routing)** - Auto-select cheapest destination
2. **Rate Expiry** - Set validity periods for base rates
3. **Bulk Assignment** - Assign plans to multiple users
4. **Analytics Dashboard** - Track plan usage and profitability
5. **Rate History** - Audit log for rate changes

---

**Happy Testing!** 🎯
