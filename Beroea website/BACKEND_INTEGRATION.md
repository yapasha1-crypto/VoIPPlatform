# Backend Integration Guide - Beroea VoIP Platform

## 🎯 For Backend Developers

This guide explains how to integrate the Beroea VoIP Platform frontend with your backend API.

---

## 📋 Quick Start

### Step 1: Disable Mock Mode

**File**: `src/config/api.config.js`

```javascript
export const API_CONFIG = {
    MOCK_MODE: false, // ← Change from true to false
    BASE_URL: 'http://localhost:5004',
    // ...
};
```

### Step 2: Start Your Backend

Ensure your backend is running on `http://localhost:5004`

### Step 3: Test

Navigate to `http://localhost:5173` and test the login flow.

---

## 🔌 API Endpoints Required

All endpoints are already mapped in `src/services/apiService.js`. Your backend must implement these exact paths:

### Authentication

| Method | Endpoint | Request Body | Response |
|--------|----------|--------------|----------|
| POST | `/api/Auth/login` | `{ username, password }` | `{ token }` |
| POST | `/api/Auth/register` | `{ username, password, email, firstName, lastName, phoneNumber, countryCode }` | `{ message }` |
| GET | `/api/Auth/me` | - | `User object` |
| POST | `/api/Auth/change-password` | `{ oldPassword, newPassword }` | `{ message }` |

### Dashboard

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/Dashboard/stats` | `{ totalRevenue, activeUsers, totalCalls, totalSMS, avgCallDuration }` |

### Accounts/Users

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/Accounts` | `Array<Account>` |
| GET | `/api/Accounts/{id}` | `Account` |
| GET | `/api/Accounts/{id}/balance` | `{ balance }` |
| GET | `/api/Users` | `Array<User>` |
| GET | `/api/Users/{id}` | `User` |

### Calls (CDR)

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/Calls` | `Array<Call>` |
| GET | `/api/Calls/account/{accountId}` | `Array<Call>` |
| GET | `/api/Calls/stats/summary` | `{ totalCalls, totalDuration, totalCost }` |

### SMS

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/SMS` | `Array<SMS>` |
| GET | `/api/SMS/account/{accountId}` | `Array<SMS>` |

### Transactions

| Method | Endpoint | Request Body | Response |
|--------|----------|--------------|----------|
| GET | `/api/Transactions` | - | `Array<Transaction>` |
| POST | `/api/Transactions` | `{ accountId, amount, type, description }` | `Transaction` |
| GET | `/api/Transactions/{id}` | - | `Transaction` |

### Tariffs & Rates

| Method | Endpoint | Request Body | Response |
|--------|----------|--------------|----------|
| GET | `/api/Rates/tariffs` | - | `Array<Tariff>` |
| POST | `/api/Rates/tariffs` | `{ name, description, isActive }` | `Tariff` |
| GET | `/api/Rates/tariffs/{id}` | - | `Tariff` |
| DELETE | `/api/Rates/tariffs/{id}` | - | `{ message }` |
| GET | `/api/Rates/tariffs/{id}/rates` | - | `Array<Rate>` |
| GET | `/api/Rates/rates` | - | `Array<Rate>` |
| POST | `/api/Rates/rates` | `{ tariffId, destination, prefix, price }` | `Rate` |
| PUT | `/api/Rates/rates/{id}` | `{ price }` | `Rate` |
| DELETE | `/api/Rates/rates/{id}` | - | `{ message }` |

### Audit Logs

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/AuditLogs` | `Array<AuditLog>` |
| GET | `/api/AuditLogs/export` | `CSV file` |

---

## 📦 Response Schemas

### User/Account Schema

```json
{
    "id": 1,
    "username": "admin@beroea.com",
    "email": "admin@beroea.com",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User",
    "phoneNumber": "+14155551234",
    "countryCode": "+1",
    "accountBalance": 1250.75,
    "isActive": true,
    "createdAt": "2026-01-15T10:00:00Z"
}
```

### Call Schema

```json
{
    "id": 1,
    "accountId": 1,
    "callerNumber": "+14155551234",
    "destinationNumber": "+442071234567",
    "durationSeconds": 245,
    "cost": 3.52,
    "timestamp": "2026-01-29T10:30:00Z",
    "status": "completed",
    "direction": "outbound"
}
```

### SMS Schema

```json
{
    "id": 1,
    "accountId": 1,
    "sender": "+14155551234",
    "recipient": "+442071234567",
    "message": "Hello from Beroea VoIP!",
    "timestamp": "2026-01-29T10:00:00Z",
    "status": "delivered",
    "cost": 0.05
}
```

### Transaction Schema

```json
{
    "id": 1,
    "accountId": 1,
    "amount": 100.00,
    "type": "credit",
    "description": "Account top-up",
    "timestamp": "2026-01-25T09:00:00Z",
    "status": "completed"
}
```

### Tariff Schema

```json
{
    "id": 1,
    "name": "Global Standard",
    "description": "Standard rates for worldwide calling",
    "isActive": true,
    "createdAt": "2026-01-10T00:00:00Z"
}
```

### Rate Schema

```json
{
    "id": 1,
    "tariffId": 1,
    "destination": "United States",
    "prefix": "1",
    "price": 0.0144
}
```

### Dashboard Stats Schema

```json
{
    "totalRevenue": 125430.50,
    "activeUsers": 1247,
    "totalCalls": 45632,
    "totalSMS": 12847,
    "avgCallDuration": 245
}
```

### Audit Log Schema

```json
{
    "id": 1,
    "userId": 1,
    "userName": "admin@beroea.com",
    "action": "login",
    "entity": "auth",
    "entityId": null,
    "status": "success",
    "timestamp": "2026-01-29T09:00:00Z",
    "ipAddress": "192.168.1.100"
}
```

---

## 🔐 Authentication Flow

### 1. Login Request

**Frontend sends**:
```javascript
POST /api/Auth/login
{
    "username": "admin@beroea.com",
    "password": "password123"
}
```

**Backend must return**:
```javascript
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Token Storage

Frontend stores token in `localStorage`:
```javascript
localStorage.setItem('token', response.token);
```

### 3. Authenticated Requests

Frontend sends token in Authorization header:
```javascript
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Get Current User

**Frontend sends**:
```javascript
GET /api/Auth/me
Authorization: Bearer <token>
```

**Backend must return**:
```javascript
{
    "id": 1,
    "username": "admin@beroea.com",
    "email": "admin@beroea.com",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User",
    "accountBalance": 1250.75,
    // ... other fields
}
```

Frontend uses `role` field to determine dashboard access.

---

## ⚠️ CORS Configuration

Your backend MUST allow CORS from `http://localhost:5173`:

```csharp
// C# Example
app.UseCors(policy => policy
    .WithOrigins("http://localhost:5173")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());
```

---

## 🧪 Testing Checklist

### Authentication
- [ ] POST `/api/Auth/login` returns JWT token
- [ ] POST `/api/Auth/register` creates new user
- [ ] GET `/api/Auth/me` returns current user with `role` field
- [ ] Invalid credentials return 401
- [ ] Expired token returns 401

### Dashboard
- [ ] GET `/api/Dashboard/stats` returns all required fields
- [ ] Stats update in real-time

### Calls
- [ ] GET `/api/Calls` returns array of calls
- [ ] GET `/api/Calls/account/{id}` filters by account
- [ ] Call records have all required fields

### Rates & Pricing
- [ ] GET `/api/Rates/tariffs` returns tariff list
- [ ] POST `/api/Rates/tariffs` creates new tariff
- [ ] GET `/api/Rates/tariffs/{id}/rates` returns rates for tariff
- [ ] POST `/api/Rates/rates` creates new rate
- [ ] PUT `/api/Rates/rates/{id}` updates rate price

---

## 🐛 Common Issues

### Issue: CORS Error

**Symptom**: Console shows "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**: Configure CORS in backend to allow `http://localhost:5173`

### Issue: 401 Unauthorized

**Symptom**: All API calls return 401

**Solution**: 
1. Check JWT token is being sent in Authorization header
2. Verify token is valid and not expired
3. Check backend JWT validation logic

### Issue: Wrong Dashboard

**Symptom**: User redirected to wrong dashboard

**Solution**: Ensure `/api/Auth/me` returns correct `role` field:
- `"admin"` → admin.html
- `"reseller"` → reseller.html
- `"user"` → user.html

### Issue: Missing Data

**Symptom**: Tables show "No data available"

**Solution**: Ensure API endpoints return arrays, not null:
```javascript
// Good
[]

// Bad
null
```

---

## 📝 Frontend Code Reference

### Where API Calls Are Made

**File**: `src/services/apiService.js`

All API methods are defined here:
- `login(username, password)`
- `register(userData)`
- `getCurrentUser()`
- `getDashboardStats()`
- `getCalls()`
- `getTariffs()`
- etc.

### Where Responses Are Processed

**Admin Dashboard**: `src/admin.js`
- `loadDashboardStats()` - Line ~75
- `loadUsersTable()` - Line ~120
- `loadAuditLogs()` - Line ~180

**Reseller Dashboard**: `src/reseller.js`
- `loadDashboardStats()` - Line ~80
- `loadCallRecords()` - Line ~130
- `loadTransactions()` - Line ~200

**User Dashboard**: `src/user.js`
- `loadDashboardStats()` - Line ~75
- `loadCallRecords()` - Line ~120
- `loadSMSLogs()` - Line ~180

---

## ✅ Integration Complete Checklist

- [ ] Set `MOCK_MODE: false` in `api.config.js`
- [ ] Backend running on `http://localhost:5004`
- [ ] CORS configured for `http://localhost:5173`
- [ ] All authentication endpoints implemented
- [ ] JWT token generation working
- [ ] All dashboard endpoints implemented
- [ ] All CRUD endpoints for rates/tariffs implemented
- [ ] Response schemas match swagger.json exactly
- [ ] Tested login flow end-to-end
- [ ] Tested all three dashboards (admin, reseller, user)
- [ ] Verified pricing calculations work with real data

---

## 🎊 Ready for Production

Once all endpoints are implemented and tested:

1. Update `BASE_URL` in `api.config.js` to production URL
2. Build frontend: `npm run build`
3. Deploy `dist/` folder to web server
4. Configure production CORS settings
5. Test in production environment

---

**Questions?** Check `src/services/mockData.js` to see example data structures that match swagger.json schemas.
