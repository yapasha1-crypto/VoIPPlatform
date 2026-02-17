using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Phase 7.2: CDR-based invoice generation service.
    /// Turns unbilled CallRecords into Invoice + InvoiceLineItem rows.
    /// PDF rendering is handled separately by IInvoiceService (QuestPDF).
    /// </summary>
    public interface IBillingService
    {
        /// <summary>
        /// Generate one invoice for a user covering all unbilled, answered calls
        /// in the given date range. Marks the CallRecords as IsBilled = true.
        /// Returns null if there are no billable calls for the period.
        /// </summary>
        Task<Invoice?> GenerateInvoiceForUserAsync(int userId, DateTime startDate, DateTime endDate);

        /// <summary>
        /// Returns the list of unbilled CallRecord IDs for a user in the date range
        /// (useful for previewing before committing).
        /// </summary>
        Task<int> CountUnbilledCallsAsync(int userId, DateTime startDate, DateTime endDate);
    }
}
