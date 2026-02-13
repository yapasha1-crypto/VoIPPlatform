using Stripe;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Stripe Payment Service Interface (Phase 8)
    /// Handles Stripe payment processing for wallet top-ups
    /// </summary>
    public interface IStripePaymentService
    {
        /// <summary>
        /// Create a Stripe PaymentIntent with tax-inclusive amount
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="baseAmount">Base amount (before tax)</param>
        /// <param name="currency">Currency code (USD, EUR, SEK)</param>
        /// <returns>PaymentIntent with client secret for frontend</returns>
        Task<PaymentIntent> CreatePaymentIntentAsync(int userId, decimal baseAmount, string currency = "USD");

        /// <summary>
        /// Handle Stripe webhook events (payment confirmation)
        /// </summary>
        /// <param name="json">Webhook JSON payload</param>
        /// <param name="stripeSignature">Stripe-Signature header</param>
        /// <returns>Event processed successfully</returns>
        Task<bool> HandleWebhookAsync(string json, string stripeSignature);

        /// <summary>
        /// Confirm payment and update wallet balance
        /// Called internally after webhook confirms payment
        /// </summary>
        /// <param name="paymentIntentId">Stripe PaymentIntent ID</param>
        /// <returns>Payment record</returns>
        Task<Payment?> ConfirmPaymentAsync(string paymentIntentId);
    }
}
