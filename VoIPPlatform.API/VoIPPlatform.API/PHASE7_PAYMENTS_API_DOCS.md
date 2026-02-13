# Phase 7: Payments & Wallet API Documentation

## Base URL
```
http://localhost:5004/api/payments
```

All endpoints require authentication (JWT Bearer token in Authorization header).

---

## 📊 Wallet Endpoints

### 1. Get Wallet Balance
**Endpoint:** `GET /api/payments/wallet/balance`

**Description:** Get current user's wallet balance

**Authorization:** Required (any role)

**Response:**
```json
{
  "balance": 150.00,
  "currency": "USD",
  "lastUpdated": "2026-02-13T18:00:00Z"
}
```

**Example:**
```bash
curl -X GET http://localhost:5004/api/payments/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 💳 Payment Endpoints

### 2. Top-Up Wallet
**Endpoint:** `POST /api/payments/topup`

**Description:** Add funds to wallet with automatic tax calculation

**Authorization:** Required (any role)

**Request Body:**
```json
{
  "amount": 100.00,
  "paymentMethod": "CreditCard",
  "externalTransactionId": "stripe_ch_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": 42,
    "amount": 100.00,
    "taxAmount": 25.00,
    "totalPaid": 125.00,
    "paymentMethod": "CreditCard",
    "status": "Completed",
    "transactionDate": "2026-02-13T18:00:00Z",
    "invoiceNumber": "INV-2026-000042",
    "invoicePdfPath": null,
    "notes": "Top-up payment. Tax: VAT (25%)"
  },
  "newBalance": 250.00,
  "message": "Payment processed successfully"
}
```

**Tax Calculation:**
- **Sweden (SE):** 25% VAT (B2C) or 0% (B2B with Tax ID)
- **EU (with Tax ID):** 0% VAT (Reverse Charge)
- **International:** 0% VAT (Export)

**Example:**
```bash
curl -X POST http://localhost:5004/api/payments/topup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "paymentMethod": "Stripe",
    "externalTransactionId": "pi_abc123"
  }'
```

---

### 3. Get Payment History
**Endpoint:** `GET /api/payments/history`

**Description:** Get all top-up transactions for current user

**Authorization:** Required (any role)

**Response:**
```json
[
  {
    "id": 42,
    "amount": 100.00,
    "taxAmount": 25.00,
    "totalPaid": 125.00,
    "paymentMethod": "CreditCard",
    "status": "Completed",
    "transactionDate": "2026-02-13T18:00:00Z",
    "invoiceNumber": "INV-2026-000042",
    "invoicePdfPath": "/invoices/123/INV-2026-000042.pdf",
    "notes": "Top-up payment. Tax: VAT (25%)"
  },
  {
    "id": 41,
    "amount": 50.00,
    "taxAmount": 0.00,
    "totalPaid": 50.00,
    "paymentMethod": "PayPal",
    "status": "Completed",
    "transactionDate": "2026-02-10T12:00:00Z",
    "invoiceNumber": "INV-2026-000041",
    "invoicePdfPath": "/invoices/123/INV-2026-000041.pdf",
    "notes": "Top-up payment. Tax: Export (0% VAT)"
  }
]
```

**Example:**
```bash
curl -X GET http://localhost:5004/api/payments/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Get Specific Payment
**Endpoint:** `GET /api/payments/{id}`

**Description:** Get details of a specific payment transaction

**Authorization:** Required (only own payments)

**Response:**
```json
{
  "id": 42,
  "amount": 100.00,
  "taxAmount": 25.00,
  "totalPaid": 125.00,
  "paymentMethod": "CreditCard",
  "status": "Completed",
  "transactionDate": "2026-02-13T18:00:00Z",
  "invoiceNumber": "INV-2026-000042",
  "invoicePdfPath": "/invoices/123/INV-2026-000042.pdf",
  "notes": "Top-up payment. Tax: VAT (25%)"
}
```

**Example:**
```bash
curl -X GET http://localhost:5004/api/payments/42 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🧮 Tax Calculation Endpoints

### 5. Calculate Tax (Preview)
**Endpoint:** `POST /api/payments/calculate-tax`

**Description:** Preview tax calculation before payment (useful for frontend)

**Authorization:** Required (any role)

**Request Body:**
```json
{
  "amount": 100.00
}
```

**Response:**
```json
{
  "amount": 100.00,
  "taxRate": 0.25,
  "taxAmount": 25.00,
  "totalAmount": 125.00,
  "taxType": "VAT (25%)",
  "countryCode": "SE",
  "hasTaxId": false
}
```

**Tax Types:**
- `"VAT (25%)"` - Sweden B2C
- `"VAT (19%)"` - Germany B2C
- `"Reverse Charge (0% VAT)"` - EU B2B
- `"Export (0% VAT)"` - International
- `"No Tax"` - Country not specified

**Example:**
```bash
curl -X POST http://localhost:5004/api/payments/calculate-tax \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100.00}'
```

---

## 🏢 Billing Information Endpoints

### 6. Update Billing Info
**Endpoint:** `PUT /api/payments/billing-info`

**Description:** Update user's billing and tax information

**Authorization:** Required (any role)

**Request Body:**
```json
{
  "country": "SE",
  "taxRegistrationNumber": "SE123456789001",
  "address": "Storgatan 1",
  "city": "Stockholm",
  "postalCode": "11122"
}
```

**Response:**
```json
{
  "message": "Billing information updated successfully"
}
```

**Country Codes:** ISO Alpha-2 (SE, DE, FR, US, LB, etc.)

**Example:**
```bash
curl -X PUT http://localhost:5004/api/payments/billing-info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "SE",
    "taxRegistrationNumber": "SE123456789001",
    "address": "Storgatan 1",
    "city": "Stockholm",
    "postalCode": "11122"
  }'
```

---

### 7. Get Billing Info
**Endpoint:** `GET /api/payments/billing-info`

**Description:** Get user's current billing information

**Authorization:** Required (any role)

**Response:**
```json
{
  "country": "SE",
  "taxRegistrationNumber": "SE123456789001",
  "address": "Storgatan 1",
  "city": "Stockholm",
  "postalCode": "11122"
}
```

**Example:**
```bash
curl -X GET http://localhost:5004/api/payments/billing-info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📝 Invoice Numbers

Invoice numbers follow the format: **INV-YYYY-NNNNNN**

Examples:
- `INV-2026-000001` - First invoice of 2026
- `INV-2026-000042` - 42nd invoice of 2026
- `INV-2027-000001` - First invoice of 2027 (resets each year)

Invoice numbers are auto-generated and guaranteed unique.

---

## 🔄 Typical Workflow

### New User Top-Up Flow

1. **User updates billing info** (optional but recommended for tax calculation):
   ```
   PUT /api/payments/billing-info
   ```

2. **User previews tax calculation**:
   ```
   POST /api/payments/calculate-tax
   Body: { "amount": 100 }
   Response: { "totalAmount": 125, "taxAmount": 25, "taxType": "VAT (25%)" }
   ```

3. **User confirms and initiates payment** (integration with Stripe/PayPal):
   - Frontend calls Stripe API to process card
   - Stripe returns transaction ID

4. **Frontend calls top-up endpoint**:
   ```
   POST /api/payments/topup
   Body: {
     "amount": 100,
     "paymentMethod": "Stripe",
     "externalTransactionId": "pi_abc123"
   }
   ```

5. **Backend processes payment**:
   - Calculates tax based on user's country
   - Creates Payment record
   - Updates Wallet balance
   - Generates invoice number
   - (Future: Generate PDF invoice)

6. **User can view updated balance**:
   ```
   GET /api/payments/wallet/balance
   Response: { "balance": 100.00 }
   ```

7. **User can view transaction history**:
   ```
   GET /api/payments/history
   ```

---

## 🛡️ Security & Validation

- ✅ All endpoints require JWT authentication
- ✅ Users can only access their own payments and wallet
- ✅ Amount validation (must be > 0)
- ✅ Payment status tracking ("Pending", "Completed", "Failed")
- ✅ Transaction logging for audit trail
- ✅ Tax calculation based on stored user country (not client-provided)

---

## 🚀 Testing with Swagger

Visit: `http://localhost:5004/swagger`

1. Click "Authorize" button
2. Enter: `Bearer YOUR_JWT_TOKEN`
3. Test endpoints directly from Swagger UI

---

## 📊 Payment Methods Supported

Current supported values:
- `"CreditCard"`
- `"Stripe"`
- `"PayPal"`
- `"BankTransfer"`
- Custom values allowed (string field)

---

## 🔜 Coming in Next Steps

- **PDF Invoice Generation** (QuestPDF)
- **Email notifications** with invoice attachment
- **Download PDF endpoint**: `GET /api/payments/{id}/invoice.pdf`
- **Refund support**: `POST /api/payments/{id}/refund`
- **Webhook handlers** for Stripe/PayPal
- **Admin endpoints** to view all payments
