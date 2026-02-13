# Phase 7: Invoice PDF Generation - Sample Layout

## 📄 Generated PDF Invoice Structure

### Invoice Header
```
┌─────────────────────────────────────────────────────────────────┐
│  VoIPPlatform AB                              INVOICE           │
│  Storgatan 12                                                   │
│  Stockholm, Sweden 11122                   Payment Receipt      │
│  VAT: SE556789012301                                           │
│  billing@voipplatform.se                                       │
│  +46 8 123 456                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Customer & Invoice Details
```
┌───────────────────────────────┬───────────────────────────────┐
│ BILL TO:                      │ Invoice No:   INV-2026-000042 │
│                               │ Invoice Date: 2026-02-13      │
│ John Doe                      │ Payment Method: Stripe        │
│ john.doe@example.com          │ Status: Completed             │
│ Storgatan 1                   │ Transaction ID: pi_abc123     │
│ Stockholm 11122               │                               │
│ SE (Sweden)                   │                               │
│ Tax ID: SE123456789001        │                               │
└───────────────────────────────┴───────────────────────────────┘
```

### Line Items Table
```
┌──────────────────────────────┬──────────┬────────────┬──────────┐
│ Description                  │ Quantity │ Unit Price │ Amount   │
├──────────────────────────────┼──────────┼────────────┼──────────┤
│ Wallet Top-up - VoIP Services│    1     │   $100.00  │ $100.00  │
└──────────────────────────────┴──────────┴────────────┴──────────┘
```

### Tax Breakdown & Total
```
                                          Subtotal:      $100.00
                                          VAT (25%):      $25.00
                                          ═════════════════════════
                                          TOTAL PAID:    $125.00
```

### Payment Notes
```
Notes:
Top-up payment. Tax: VAT (25%)
```

### Tax Notice (for Reverse Charge)
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠ REVERSE CHARGE - VAT                                          │
│ This is a B2B transaction. VAT is payable by the recipient     │
│ under the reverse charge mechanism.                             │
└─────────────────────────────────────────────────────────────────┘
```

### Footer
```
───────────────────────────────────────────────────────────────────
                    Thank you for your business!
        VoIPPlatform AB | billing@voipplatform.se | +46 8 123 456
     This is a computer-generated invoice and does not require a signature.
```

---

## 📋 Invoice Examples by Country

### Example 1: Swedish Customer (B2C - 25% VAT)
**Customer:** Stockholm resident, no Tax ID

**Invoice Details:**
- Subtotal: $100.00
- VAT (25%): $25.00
- **Total Paid: $125.00**
- Wallet Balance Added: $100.00

**Tax Note:** "Top-up payment. Tax: VAT (25%)"

---

### Example 2: Swedish Company (B2B - Reverse Charge)
**Customer:** Swedish company with Tax ID SE123456789001

**Invoice Details:**
- Subtotal: $100.00
- Tax: Reverse Charge (0%)
- **Total Paid: $100.00**
- Wallet Balance Added: $100.00

**Tax Notice:**
```
⚠ REVERSE CHARGE - VAT
This is a B2B transaction. VAT is payable by the recipient
under the reverse charge mechanism.
```

---

### Example 3: German Customer (B2C - 19% VAT)
**Customer:** Berlin resident, no Tax ID

**Invoice Details:**
- Subtotal: $100.00
- VAT (19%): $19.00
- **Total Paid: $119.00**
- Wallet Balance Added: $100.00

**Tax Note:** "Top-up payment. Tax: VAT (19%)"

---

### Example 4: Lebanese Customer (Export - 0% VAT)
**Customer:** Beirut resident

**Invoice Details:**
- Subtotal: $100.00
- Tax: Export (0%)
- **Total Paid: $100.00**
- Wallet Balance Added: $100.00

**Tax Note:** "Top-up payment. Tax: Export (0% VAT)"

---

## 📁 File Storage Structure

```
wwwroot/
└── invoices/
    ├── 1/                      # User ID 1
    │   ├── INV-2026-000001.pdf
    │   ├── INV-2026-000002.pdf
    │   └── INV-2026-000015.pdf
    ├── 2/                      # User ID 2
    │   ├── INV-2026-000003.pdf
    │   └── INV-2026-000008.pdf
    └── 123/                    # User ID 123
        ├── INV-2026-000042.pdf
        └── INV-2026-000055.pdf
```

**Database Record:**
```json
{
  "id": 42,
  "userId": 123,
  "invoiceNumber": "INV-2026-000042",
  "invoicePdfPath": "/invoices/123/INV-2026-000042.pdf",
  "amount": 100.00,
  "taxAmount": 25.00,
  "totalPaid": 125.00
}
```

---

## 🎨 PDF Styling

### Colors
- **Primary Blue:** Company name, invoice title, table headers, total
- **Dark Grey:** Section headers, labels
- **Light Grey:** Helper text, footer
- **Green:** "Completed" status
- **Orange:** "Pending" status

### Fonts
- **Headers:** 20-28pt Bold
- **Body:** 9-11pt Regular
- **Totals:** 12-14pt Bold
- **Footer:** 7-8pt Italic

### Layout
- **Page Size:** A4 (210mm × 297mm)
- **Margins:** 50pt on all sides
- **Line Spacing:** Consistent padding (5-10pt between elements)
- **Table Borders:** Light grey (#E0E0E0)

---

## 🔄 PDF Generation Workflow

```
1. User Completes Payment
   └─> WalletService.TopUpAsync()
       ├─> Calculate tax
       ├─> Generate invoice number
       ├─> Create Payment record
       ├─> Update Wallet balance
       └─> SaveChanges()

2. Generate PDF Invoice
   └─> InvoiceService.GenerateInvoicePdfAsync()
       ├─> Create directory: /wwwroot/invoices/{userId}/
       ├─> Generate PDF with QuestPDF
       │   ├─> Compose header (company info)
       │   ├─> Compose content (customer, items, tax)
       │   └─> Compose footer (thank you message)
       ├─> Save PDF: INV-2026-000042.pdf
       └─> Return path: /invoices/123/INV-2026-000042.pdf

3. Update Payment Record
   └─> payment.InvoicePdfPath = "/invoices/123/INV-2026-000042.pdf"
       └─> SaveChanges()

4. User Downloads Invoice
   └─> GET /api/payments/42/invoice.pdf
       ├─> Verify user owns payment
       ├─> Check PDF exists
       ├─> Read file bytes
       └─> Return PDF (Content-Type: application/pdf)
```

---

## 📥 Download Endpoint

**Endpoint:** `GET /api/payments/{id}/invoice.pdf`

**Example:**
```bash
curl -X GET http://localhost:5004/api/payments/42/invoice.pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output invoice.pdf
```

**Response Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="INV-2026-000042.pdf"
```

**Error Responses:**
- `404 Not Found` - Payment not found
- `404 Not Found` - Invoice PDF not generated yet
- `404 Not Found` - Invoice PDF file not found (deleted)
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not your invoice

---

## ✨ QuestPDF Features Used

1. **Fluent API:** Chainable layout methods
2. **Responsive Columns:** Auto-sizing with RelativeColumn
3. **Tables:** Professional grid layouts with headers
4. **Text Styling:** Font size, color, bold, italic
5. **Borders & Spacing:** Padding, margins, borders
6. **Backgrounds:** Colored backgrounds for notices
7. **Alignment:** Left, right, center alignment
8. **Colors:** Built-in color palette (Colors.Blue.Darken2, etc.)

---

## 🔧 Company Information (Customizable)

Current values (hardcoded in InvoiceService.cs):
```csharp
CompanyName = "VoIPPlatform AB"
CompanyAddress = "Storgatan 12"
CompanyCity = "Stockholm, Sweden"
CompanyPostalCode = "11122"
CompanyTaxId = "SE556789012301"
CompanyEmail = "billing@voipplatform.se"
CompanyPhone = "+46 8 123 456"
```

**Production TODO:** Move to `appsettings.json` or database

---

## 🧪 Testing Invoice Generation

### Option 1: Via Swagger
1. Visit `http://localhost:5004/swagger`
2. Authorize with JWT token
3. Call `POST /api/payments/topup`
   ```json
   {
     "amount": 100,
     "paymentMethod": "Stripe"
   }
   ```
4. Response includes `invoicePdfPath`
5. Call `GET /api/payments/{id}/invoice.pdf` to download

### Option 2: Via cURL
```bash
# 1. Top-up wallet
curl -X POST http://localhost:5004/api/payments/topup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "paymentMethod": "Stripe"}'

# Response: { "payment": { "id": 42, "invoicePdfPath": "/invoices/123/INV-2026-000042.pdf" } }

# 2. Download PDF
curl -X GET http://localhost:5004/api/payments/42/invoice.pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output invoice.pdf

# 3. Open PDF
start invoice.pdf  # Windows
open invoice.pdf   # macOS
xdg-open invoice.pdf  # Linux
```

---

## 📊 Production Enhancements

1. **Logo Integration:**
   - Add company logo image to `/wwwroot/images/logo.png`
   - Display in invoice header

2. **Email Sending:**
   - After PDF generation, send email with attachment
   - Use IEmailService integration

3. **Multi-Currency:**
   - Support EUR, SEK, GBP invoices
   - Currency symbol formatting

4. **Invoice Templates:**
   - Multiple invoice designs
   - User-selectable themes

5. **Localization:**
   - Translate invoices to user's language
   - Swedish, English, Arabic support

6. **Batch Generation:**
   - Admin endpoint to regenerate missing PDFs
   - Bulk invoice generation for period

7. **Digital Signatures:**
   - Sign PDFs with company certificate
   - QR code for invoice verification
