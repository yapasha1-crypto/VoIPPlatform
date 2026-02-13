using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Wallet Service Interface (Phase 7)
    /// Manages user wallets and payment transactions in pre-paid model
    /// </summary>
    public interface IWalletService
    {
        /// <summary>
        /// Get user's current wallet balance
        /// Creates wallet if it doesn't exist
        /// </summary>
        Task<decimal> GetBalanceAsync(int userId);

        /// <summary>
        /// Get user's wallet (creates if doesn't exist)
        /// </summary>
        Task<Wallet> GetOrCreateWalletAsync(int userId);

        /// <summary>
        /// Top-up wallet with payment
        /// Calculates tax, creates payment record, generates invoice
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="amount">Amount before tax</param>
        /// <param name="paymentMethod">Payment method (CreditCard, Stripe, PayPal, etc.)</param>
        /// <param name="externalTransactionId">External payment gateway transaction ID</param>
        /// <returns>Created payment record</returns>
        Task<Payment> TopUpAsync(int userId, decimal amount, string paymentMethod, string? externalTransactionId = null);

        /// <summary>
        /// Deduct balance for call/SMS usage
        /// Does NOT create a Payment record (used for consumption)
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="amount">Amount to deduct</param>
        /// <param name="description">Reason for deduction (e.g., "Call to +1234567890")</param>
        /// <returns>True if successful, false if insufficient balance</returns>
        Task<bool> DeductAsync(int userId, decimal amount, string description);

        /// <summary>
        /// Check if user has sufficient balance
        /// </summary>
        Task<bool> HasSufficientBalanceAsync(int userId, decimal amount);

        /// <summary>
        /// Get user's payment history (top-ups only)
        /// </summary>
        Task<List<Payment>> GetPaymentHistoryAsync(int userId);

        /// <summary>
        /// Get specific payment by ID
        /// </summary>
        Task<Payment?> GetPaymentByIdAsync(int paymentId, int userId);

        /// <summary>
        /// Get payment by invoice number
        /// </summary>
        Task<Payment?> GetPaymentByInvoiceNumberAsync(string invoiceNumber);

        /// <summary>
        /// Generate next invoice number
        /// Format: INV-YYYY-NNNNNN (e.g., INV-2026-000001)
        /// </summary>
        Task<string> GenerateInvoiceNumberAsync();
    }
}
