using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Tax Calculation Service Implementation (Phase 7)
    /// Implements global tax rules for VoIP billing
    ///
    /// Tax Rules:
    /// - Sweden (SE): 25% VAT (our company location)
    /// - EU Countries (with valid Tax ID): 0% VAT (Reverse Charge - B2B)
    /// - EU Countries (without Tax ID): Local VAT rate (B2C)
    /// - International (non-EU): 0% VAT (Export)
    /// </summary>
    public class TaxCalculatorService : ITaxCalculatorService
    {
        // EU Member States (27 countries as of 2026)
        private static readonly HashSet<string> EuCountries = new(StringComparer.OrdinalIgnoreCase)
        {
            "AT", // Austria
            "BE", // Belgium
            "BG", // Bulgaria
            "HR", // Croatia
            "CY", // Cyprus
            "CZ", // Czech Republic
            "DK", // Denmark
            "EE", // Estonia
            "FI", // Finland
            "FR", // France
            "DE", // Germany
            "GR", // Greece
            "HU", // Hungary
            "IE", // Ireland
            "IT", // Italy
            "LV", // Latvia
            "LT", // Lithuania
            "LU", // Luxembourg
            "MT", // Malta
            "NL", // Netherlands
            "PL", // Poland
            "PT", // Portugal
            "RO", // Romania
            "SK", // Slovakia
            "SI", // Slovenia
            "ES", // Spain
            "SE"  // Sweden (our location)
        };

        // VAT Rates for EU Countries (simplified - can be expanded)
        private static readonly Dictionary<string, decimal> EuVatRates = new(StringComparer.OrdinalIgnoreCase)
        {
            { "SE", 0.25m }, // Sweden - 25%
            { "DE", 0.19m }, // Germany - 19%
            { "FR", 0.20m }, // France - 20%
            { "IT", 0.22m }, // Italy - 22%
            { "ES", 0.21m }, // Spain - 21%
            { "NL", 0.21m }, // Netherlands - 21%
            { "BE", 0.21m }, // Belgium - 21%
            { "AT", 0.20m }, // Austria - 20%
            { "PL", 0.23m }, // Poland - 23%
            { "DK", 0.25m }, // Denmark - 25%
            { "FI", 0.24m }, // Finland - 24%
            // Add more as needed
        };

        public TaxCalculationResult CalculateTax(User user, decimal amount)
        {
            return CalculateTax(user.Country, user.TaxRegistrationNumber, amount);
        }

        public TaxCalculationResult CalculateTax(string? countryCode, string? taxRegistrationNumber, decimal amount)
        {
            // Normalize country code
            countryCode = countryCode?.Trim().ToUpperInvariant();
            bool hasTaxId = !string.IsNullOrWhiteSpace(taxRegistrationNumber);

            // Get tax rate and type
            decimal taxRate = GetTaxRate(countryCode, hasTaxId);
            string taxType = DetermineTaxType(countryCode, hasTaxId);

            // Calculate tax
            decimal taxAmount = Math.Round(amount * taxRate, 2);
            decimal totalAmount = amount + taxAmount;

            return new TaxCalculationResult
            {
                Amount = amount,
                TaxRate = taxRate,
                TaxAmount = taxAmount,
                TotalAmount = totalAmount,
                TaxType = taxType,
                CountryCode = countryCode ?? "UNKNOWN",
                HasTaxId = hasTaxId
            };
        }

        public decimal GetTaxRate(string? countryCode, bool hasTaxId)
        {
            // Normalize country code
            countryCode = countryCode?.Trim().ToUpperInvariant();

            // If no country specified, default to no tax
            if (string.IsNullOrEmpty(countryCode))
            {
                return 0m;
            }

            // Check if EU country
            bool isEu = IsEuCountry(countryCode);

            if (!isEu)
            {
                // International (non-EU): 0% VAT (Export)
                return 0m;
            }

            // EU Country Logic
            if (hasTaxId)
            {
                // EU B2B with Tax ID: 0% VAT (Reverse Charge)
                return 0m;
            }
            else
            {
                // EU B2C without Tax ID: Local VAT rate
                // If we have the specific rate, use it; otherwise default to 0%
                if (EuVatRates.TryGetValue(countryCode, out decimal rate))
                {
                    return rate;
                }
                else
                {
                    // Unknown EU country VAT rate - default to 0% for safety
                    // In production, you should have all EU VAT rates defined
                    return 0m;
                }
            }
        }

        public bool IsEuCountry(string? countryCode)
        {
            if (string.IsNullOrWhiteSpace(countryCode))
            {
                return false;
            }

            return EuCountries.Contains(countryCode.Trim());
        }

        private string DetermineTaxType(string? countryCode, bool hasTaxId)
        {
            // Normalize country code
            countryCode = countryCode?.Trim().ToUpperInvariant();

            if (string.IsNullOrEmpty(countryCode))
            {
                return "No Tax";
            }

            bool isEu = IsEuCountry(countryCode);

            if (!isEu)
            {
                // International (non-EU): Export
                return "Export (0% VAT)";
            }

            // EU Country
            if (hasTaxId)
            {
                // EU B2B with Tax ID: Reverse Charge
                return "Reverse Charge (0% VAT)";
            }
            else
            {
                // EU B2C: VAT
                decimal vatRate = GetTaxRate(countryCode, false);
                int vatPercent = (int)(vatRate * 100);
                return $"VAT ({vatPercent}%)";
            }
        }
    }
}
