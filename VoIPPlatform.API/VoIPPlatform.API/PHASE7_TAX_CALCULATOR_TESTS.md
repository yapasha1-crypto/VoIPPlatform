# Phase 7: Tax Calculator - Test Scenarios

## Tax Rules Implemented

### 1. **Sweden (SE)** - Our Company Location
- **B2C (No Tax ID):** 25% VAT
- **B2B (With Tax ID):** 0% VAT (Reverse Charge)

### 2. **EU Countries** (27 Member States)
- **B2C (No Tax ID):** Local VAT rate (19-25% depending on country)
- **B2B (With Tax ID):** 0% VAT (Reverse Charge - Customer pays VAT in their country)

### 3. **International (Non-EU)**
- **All Transactions:** 0% VAT (Export)

---

## Test Scenarios

### Scenario 1: Swedish Customer (No Tax ID)
**Input:**
- Country: SE
- Tax ID: (empty)
- Amount: 100.00 USD

**Expected Output:**
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

---

### Scenario 2: Swedish Company (With Tax ID)
**Input:**
- Country: SE
- Tax ID: SE123456789001
- Amount: 100.00 USD

**Expected Output:**
```json
{
  "amount": 100.00,
  "taxRate": 0.00,
  "taxAmount": 0.00,
  "totalAmount": 100.00,
  "taxType": "Reverse Charge (0% VAT)",
  "countryCode": "SE",
  "hasTaxId": true
}
```

---

### Scenario 3: German Customer (No Tax ID)
**Input:**
- Country: DE
- Tax ID: (empty)
- Amount: 100.00 USD

**Expected Output:**
```json
{
  "amount": 100.00,
  "taxRate": 0.19,
  "taxAmount": 19.00,
  "totalAmount": 119.00,
  "taxType": "VAT (19%)",
  "countryCode": "DE",
  "hasTaxId": false
}
```

---

### Scenario 4: German Company (With Tax ID)
**Input:**
- Country: DE
- Tax ID: DE123456789
- Amount: 100.00 USD

**Expected Output:**
```json
{
  "amount": 100.00,
  "taxRate": 0.00,
  "taxAmount": 0.00,
  "totalAmount": 100.00,
  "taxType": "Reverse Charge (0% VAT)",
  "countryCode": "DE",
  "hasTaxId": true
}
```

---

### Scenario 5: Lebanese Customer (International)
**Input:**
- Country: LB
- Tax ID: (empty)
- Amount: 100.00 USD

**Expected Output:**
```json
{
  "amount": 100.00,
  "taxRate": 0.00,
  "taxAmount": 0.00,
  "totalAmount": 100.00,
  "taxType": "Export (0% VAT)",
  "countryCode": "LB",
  "hasTaxId": false
}
```

---

### Scenario 6: Australian Company (International)
**Input:**
- Country: AU
- Tax ID: AU12345678901
- Amount: 100.00 USD

**Expected Output:**
```json
{
  "amount": 100.00,
  "taxRate": 0.00,
  "taxAmount": 0.00,
  "totalAmount": 100.00,
  "taxType": "Export (0% VAT)",
  "countryCode": "AU",
  "hasTaxId": true
}
```

---

### Scenario 7: No Country Specified
**Input:**
- Country: (empty)
- Tax ID: (empty)
- Amount: 100.00 USD

**Expected Output:**
```json
{
  "amount": 100.00,
  "taxRate": 0.00,
  "taxAmount": 0.00,
  "totalAmount": 100.00,
  "taxType": "No Tax",
  "countryCode": "UNKNOWN",
  "hasTaxId": false
}
```

---

## EU Country List (27 Members)

AT, BE, BG, HR, CY, CZ, DK, EE, FI, FR, DE, GR, HU, IE, IT, LV, LT, LU, MT, NL, PL, PT, RO, SK, SI, ES, SE

---

## VAT Rates by Country

| Country | Code | VAT Rate |
|---------|------|----------|
| Sweden | SE | 25% |
| Denmark | DK | 25% |
| Poland | PL | 23% |
| Finland | FI | 24% |
| Italy | IT | 22% |
| Spain | ES | 21% |
| Netherlands | NL | 21% |
| Belgium | BE | 21% |
| France | FR | 20% |
| Austria | AT | 20% |
| Germany | DE | 19% |

*Note: Additional EU countries default to 0% if not specified (should be completed in production)*

---

## How to Test

### Option 1: Unit Test (Recommended)
Create a test file `TaxCalculatorServiceTests.cs` and verify each scenario.

### Option 2: API Endpoint Test
Create a test endpoint in `PaymentsController`:

```csharp
[HttpPost("calculate-tax")]
[AllowAnonymous]
public ActionResult<TaxCalculationResult> CalculateTax(
    [FromQuery] string? country,
    [FromQuery] string? taxId,
    [FromQuery] decimal amount)
{
    var result = _taxCalculator.CalculateTax(country, taxId, amount);
    return Ok(result);
}
```

**Test URLs:**
- Sweden (No Tax ID): `POST /api/payments/calculate-tax?country=SE&amount=100`
- Sweden (With Tax ID): `POST /api/payments/calculate-tax?country=SE&taxId=SE123&amount=100`
- Germany: `POST /api/payments/calculate-tax?country=DE&amount=100`
- Lebanon: `POST /api/payments/calculate-tax?country=LB&amount=100`

---

## Production Considerations

1. **VAT Rate Updates:**
   - EU VAT rates change periodically
   - Implement a database table for dynamic VAT rates

2. **Tax ID Validation:**
   - Validate EU VAT numbers using VIES API
   - Format validation for each country

3. **Audit Trail:**
   - Log all tax calculations for compliance
   - Store tax rate used at time of transaction

4. **Invoice Requirements:**
   - Display tax breakdown clearly
   - Include company tax registration numbers
   - Show "Reverse Charge" notice for B2B EU transactions

5. **Reporting:**
   - Generate VAT reports by country
   - Support OSS (One Stop Shop) EU VAT reporting
