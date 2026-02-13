using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Tax Calculation Service Interface (Phase 7)
    /// Handles global tax calculations based on customer location and tax registration
    /// </summary>
    public interface ITaxCalculatorService
    {
        /// <summary>
        /// Calculate tax amount based on user's country and tax registration
        /// </summary>
        /// <param name="user">User with Country and TaxRegistrationNumber</param>
        /// <param name="amount">Amount before tax (subtotal)</param>
        /// <returns>Tax breakdown DTO</returns>
        TaxCalculationResult CalculateTax(User user, decimal amount);

        /// <summary>
        /// Calculate tax amount based on country code and tax ID
        /// </summary>
        /// <param name="countryCode">ISO Alpha-2 country code (SE, DE, LB, etc.)</param>
        /// <param name="taxRegistrationNumber">VAT/Tax ID (optional)</param>
        /// <param name="amount">Amount before tax (subtotal)</param>
        /// <returns>Tax breakdown DTO</returns>
        TaxCalculationResult CalculateTax(string? countryCode, string? taxRegistrationNumber, decimal amount);

        /// <summary>
        /// Get tax rate percentage for a country
        /// </summary>
        /// <param name="countryCode">ISO Alpha-2 country code</param>
        /// <param name="hasTaxId">Whether customer has a valid tax registration number</param>
        /// <returns>Tax rate as decimal (0.25 = 25%)</returns>
        decimal GetTaxRate(string? countryCode, bool hasTaxId);

        /// <summary>
        /// Check if a country is in the EU
        /// </summary>
        /// <param name="countryCode">ISO Alpha-2 country code</param>
        /// <returns>True if EU member state</returns>
        bool IsEuCountry(string? countryCode);
    }

    /// <summary>
    /// Tax Calculation Result DTO
    /// </summary>
    public class TaxCalculationResult
    {
        public decimal Amount { get; set; }           // Subtotal before tax
        public decimal TaxRate { get; set; }          // Tax rate (0.25 = 25%)
        public decimal TaxAmount { get; set; }        // Calculated tax
        public decimal TotalAmount { get; set; }      // Amount + TaxAmount
        public string TaxType { get; set; } = string.Empty;  // "VAT", "Reverse Charge", "Export", "No Tax"
        public string CountryCode { get; set; } = string.Empty;
        public bool HasTaxId { get; set; }
    }
}
