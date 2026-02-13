using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Invoice PDF Generation Service Interface (Phase 7)
    /// Generates professional PDF invoices using QuestPDF
    /// </summary>
    public interface IInvoiceService
    {
        /// <summary>
        /// Generate PDF invoice for a payment transaction
        /// </summary>
        /// <param name="payment">Payment record with transaction details</param>
        /// <param name="user">User who made the payment</param>
        /// <returns>Absolute file path to generated PDF</returns>
        Task<string> GenerateInvoicePdfAsync(Payment payment, User user);

        /// <summary>
        /// Get invoice PDF file path
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="invoiceNumber">Invoice number (e.g., INV-2026-000001)</param>
        /// <returns>Absolute file path or null if not found</returns>
        string? GetInvoicePath(int userId, string invoiceNumber);

        /// <summary>
        /// Check if invoice PDF exists
        /// </summary>
        Task<bool> InvoiceExistsAsync(int userId, string invoiceNumber);

        /// <summary>
        /// Delete invoice PDF (admin operation)
        /// </summary>
        Task<bool> DeleteInvoiceAsync(int userId, string invoiceNumber);
    }
}
