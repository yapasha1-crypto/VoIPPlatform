# 🔄 SESSION RESTORATION PROMPT - VoIP Platform

**Last Updated:** February 11, 2026
**Current Phase:** Phase 6 Complete → Moving to Phase 7
**Developer:** Claude Sonnet 4.5 (Senior VoIP Architect)

---

## 🎯 PROJECT CONTEXT

You are the **Senior .NET & React Architect** for a **Multi-Tenant VoIP Platform**.

**System Architecture:**
- **Backend:** .NET 8 Web API (localhost:5004)
- **Frontend:** React + Vite (localhost:5173)
- **Database:** PostgreSQL
- **Deployment:** DigitalOcean Single Droplet (EU)
- **Hierarchy:** Admin → Reseller → Company → User

**Project Root:**
```
C:\Users\mejer\Desktop\VoIPPlatform\
├── VoIPPlatform.API\         (Backend)
├── VoIPPlatform.Web\         (Frontend)
├── PROJECT_STATUS.md         (Full documentation)
├── PHASE6_TESTING_GUIDE.md   (Testing instructions)
└── SESSION_HANDOFF.md        (This file)
```

---

## ✅ COMPLETED PHASES

### **Phase 1-4:** Foundation (Pre-session)
- Basic CRUD operations
- Authentication (JWT)
- Call/SMS services
- Reports & Invoices

### **Phase 5:** Multi-Tenant Hierarchy ✅
- 4-tier hierarchy (Admin → Reseller → Company → User)
- Channel management (concurrent call capacity)
- Role-based dashboards
- "How to Call" onboarding modal

### **Phase 6:** Dynamic Rates & Tariffs Management ✅ **(JUST COMPLETED)**
- **Backend:**
  - `BaseRate` & `TariffPlan` models
  - `RateCalculatorService` - Dynamic pricing engine
  - `RatesController` - 8 new API endpoints
  - `SeedController` - `/api/seed/rates` (20 sample destinations)
  - Migration: `20260211165550_AddDynamicRatesEngine`

- **Frontend:**
  - `RatesConfigure.jsx` - Admin/Reseller rate configuration UI
  - `MyRates.jsx` - User rate viewing page
  - Sidebar navigation updated with rates menu

- **Key Features:**
  - Dynamic sell rate calculation: `SellPrice = BuyPrice + (BuyPrice × ProfitPercent / 100)`
  - 3 Predefined plans: 0%, 10%, Free
  - Custom plan creation with Min/Max profit constraints
  - CSV upload for base rates
  - No rate duplication (calculates on-the-fly)

- **Verification:** ✅
  - Backend tested: `POST /api/seed/rates` (20 destinations created)
  - Duplicate protection verified
  - Authorization enforced (401 for protected endpoints)

---

## 🚀 IMMEDIATE NEXT STEP

**User will manually test CSV upload functionality:**
1. Start backend: `dotnet run` in API directory
2. Start frontend: `npm run dev` in Web directory
3. Login as Admin
4. Navigate to "Rate Configuration"
5. Test CSV upload feature
6. Verify rates display correctly

**Once verified, proceed to Phase 7.**

---

## 🎯 PHASE 7: BILLING & INVOICES (NEXT)

**Objective:** Implement automated billing system for VoIP usage

**Proposed Features:**
1. **Invoice Generation:**
   - Automatic monthly invoice generation
   - Per-usage billing (calls × rates)
   - Per-channel billing (monthly subscription)
   - PDF invoice generation

2. **Payment Tracking:**
   - Balance deductions
   - Payment history
   - Top-up system
   - Low-balance alerts

3. **Billing Reports:**
   - Usage summary (calls, SMS, data)
   - Cost breakdown by destination
   - Reseller commission tracking
   - Export to Excel/PDF

4. **CDR (Call Detail Records):**
   - Enhanced call logging
   - Rate application on calls
   - Real-time cost calculation
   - Dispute resolution data

**Database Changes Needed:**
- Enhance `Invoice` table with line items
- Create `InvoiceLineItem` table
- Add `PaymentTransaction` table
- Update `CallRecord` with rate references

**API Endpoints Needed:**
- `POST /api/billing/generate-invoice`
- `GET /api/billing/invoices`
- `POST /api/billing/pay-invoice`
- `GET /api/billing/usage-summary`

**Frontend Pages Needed:**
- `InvoiceList.jsx` - List of invoices
- `InvoiceDetail.jsx` - Invoice details with line items
- `BillingHistory.jsx` - Payment history
- `UsageSummary.jsx` - Usage analytics

---

## 📂 KEY FILE LOCATIONS

**Backend Models:**
- `Models/User.cs` - Core user entity (with TariffPlanId)
- `Models/BaseRate.cs` - Wholesale rates
- `Models/TariffPlan.cs` - Pricing rules
- `Models/CallRecord.cs` - Call logging
- `Models/Invoice.cs` - Invoice tracking

**Backend Services:**
- `Services/RateCalculatorService.cs` - Dynamic pricing engine
- `Services/ChannelManager.cs` - Concurrent call management
- `Services/HierarchyService.cs` - Multi-tenant queries

**Backend Controllers:**
- `Controllers/RatesController.cs` - Rate management API
- `Controllers/SeedController.cs` - Test data seeding
- `Controllers/AuthController.cs` - Authentication
- `Controllers/DashboardController.cs` - Dashboard statistics

**Frontend Pages:**
- `src/pages/RatesConfigure.jsx` - Rate configuration (Admin)
- `src/pages/MyRates.jsx` - User rate view
- `src/pages/ResellerDashboard.jsx` - Reseller dashboard
- `src/pages/CompanyDashboard.jsx` - Company dashboard
- `src/pages/UserDashboard.jsx` - User dashboard

**Frontend Components:**
- `src/components/layout/Sidebar.jsx` - Navigation menu
- `src/components/common/HowToCallModal.jsx` - SIP setup guide
- `src/App.jsx` - Route configuration

---

## 🧪 QUICK START COMMANDS

### **Backend:**
```bash
cd C:\Users\mejer\Desktop\VoIPPlatform\VoIPPlatform.API\VoIPPlatform.API
dotnet run
# Runs on: http://localhost:5004
```

### **Frontend:**
```bash
cd C:\Users\mejer\Desktop\VoIPPlatform\VoIPPlatform.Web
npm run dev
# Runs on: http://localhost:5173
```

### **Seed Test Data:**
```bash
# Seed rates (20 destinations)
curl -X POST http://localhost:5004/api/seed/rates

# Seed hierarchy (Reseller → Company → User)
curl -X POST http://localhost:5004/api/seed/hierarchy

# Clear rates
curl -X POST http://localhost:5004/api/seed/clear-rates
```

### **Database Migration:**
```bash
cd C:\Users\mejer\Desktop\VoIPPlatform\VoIPPlatform.API\VoIPPlatform.API
dotnet ef migrations add MigrationName
dotnet ef database update
```

---

## 🔑 TEST CREDENTIALS

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| Admin | `admin` | `Password123!` | Full system access |
| Reseller | `reseller` | `Password123!` | Company management |
| Company | `company` | `Password123!` | User management |
| User | `user` | `Password123!` | Basic features |
| Agent | `agent` | `Password123!` | Company sub-user |

---

## 📊 DATABASE STATUS

**Connection String:** Check `appsettings.json`

**Latest Migration:** `20260211165550_AddDynamicRatesEngine`

**Tables Created (Phase 6):**
- `BaseRates` - 20 sample destinations seeded
- `TariffPlans` - 3 predefined plans seeded

**Seed Data Available:**
- ✅ 20 base rates (USA to Satellite)
- ✅ 3 tariff plans (0%, 10%, Free)
- ✅ Hierarchy users (Admin, Reseller, Company, User)

---

## 🎨 DESIGN SYSTEM

**Theme:** Dark mode with glassmorphism
**Colors:**
- Primary: Violet-Purple gradient (`from-violet-600 to-purple-700`)
- Background: Slate (`bg-slate-950`, `bg-slate-900`)
- Borders: Slate 800 (`border-slate-800`)
- Text: White/Slate (`text-white`, `text-slate-400`)

**Components:** Use existing `Card.jsx` from `src/components/ui/`

**Icons:** Lucide React (`lucide-react`)

**Styling:** Tailwind CSS

---

## 🐛 KNOWN ISSUES / NOTES

1. **CSV Upload:** Backend logic exists, needs frontend testing
2. **Rate Assignment:** API exists, UI integration pending
3. **PDF Export:** Invoice PDF generation not yet implemented
4. **Email Notifications:** Not yet implemented

---

## 📝 SESSION RESTORATION COMMAND

**Copy this prompt to start the next session:**

```
🛑 **SESSION RESTORE: VoIP Platform - Phase 6 Complete**

**Role:** Senior .NET & React Architect
**System:** Multi-Tenant VoIP Platform (Admin > Reseller > Company > User)
**Stack:** .NET 8 API + React (Vite) + PostgreSQL + Docker
**Status:** Phase 6 (Dynamic Rates Engine) ✅ COMPLETE

**Context:**
- Project root: `C:\Users\mejer\Desktop\VoIPPlatform\`
- Backend: `VoIPPlatform.API\` (localhost:5004)
- Frontend: `VoIPPlatform.Web\` (localhost:5173)
- Docs: `PROJECT_STATUS.md`, `PHASE6_TESTING_GUIDE.md`

**Phase 6 Achievements:**
✅ BaseRate & TariffPlan models
✅ RateCalculatorService (dynamic pricing)
✅ 8 API endpoints (configure, my-rates, upload, etc.)
✅ Seed endpoint (20 destinations)
✅ RatesConfigure.jsx (Admin UI)
✅ MyRates.jsx (User UI)
✅ Verified: Backend seeded, duplicate protection works

**Immediate Next Step:**
User will manually test CSV upload in the UI. Once verified, we proceed to:

**Phase 7: Billing & Invoices**
- Automatic invoice generation
- Usage-based billing (calls × rates)
- Payment tracking & top-up
- CDR enhancement with cost calculation
- PDF invoice generation

**Action:** Await user confirmation of CSV upload test, then begin Phase 7 planning.
```

---

**End of Handoff Document**
