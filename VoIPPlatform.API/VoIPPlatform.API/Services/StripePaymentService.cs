using Microsoft.EntityFrameworkCore;
using Stripe;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Stripe Payment Service Implementation (Phase 8)
    /// Integrates Stripe payment processing with tax calculation and wallet management
    /// </summary>
    public class StripePaymentService : IStripePaymentService
    {
        private readonly VoIPDbContext _context;
        private readonly ITaxCalculatorService _taxCalculator;
        private readonly IWalletService _walletService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<StripePaymentService> _logger;

        public StripePaymentService(
            VoIPDbContext context,
            ITaxCalculatorService taxCalculator,
            IWalletService walletService,
            IConfiguration configuration,
            ILogger<StripePaymentService> logger)
        {
            _context = context;
            _taxCalculator = taxCalculator;
            _walletService = walletService;
            _configuration = configuration;
            _logger = logger;

            // Configure Stripe API Key
            var stripeSecretKey = _configuration["Stripe:SecretKey"];
            if (string.IsNullOrEmpty(stripeSecretKey) ||
                stripeSecretKey.Contains("YOUR_SECRET_KEY_HERE") ||
                stripeSecretKey == "REDACTED_STRIPE_KEY_SECRET_KEY_HERE")
            {
                _logger.LogError("Stripe:SecretKey is missing or contains placeholder value. " +
                    "Please configure a real Stripe test key from https://dashboard.stripe.com/test/apikeys");
            }
            else
            {
                StripeConfiguration.ApiKey = stripeSecretKey;
                _logger.LogInformation("Stripe API Key configured successfully");
            }
        }

        public async Task<PaymentIntent> CreatePaymentIntentAsync(int userId, decimal baseAmount, string currency = "USD")
        {
            // Validate Stripe API Key is configured
            var stripeSecretKey = _configuration["Stripe:SecretKey"];
            if (string.IsNullOrEmpty(stripeSecretKey) ||
                stripeSecretKey.Contains("YOUR_SECRET_KEY_HERE"))
            {
                throw new InvalidOperationException(
                    "Stripe is not properly configured. Please add a valid API key to appsettings.json > Stripe:SecretKey. " +
                    "Get your test key from: https://dashboard.stripe.com/test/apikeys");
            }

            // Validate amount
            if (baseAmount <= 0)
            {
                throw new ArgumentException("Amount must be greater than zero", nameof(baseAmount));
            }

            // Get user for tax calculation
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException($"User {userId} not found");
            }

            // ⭐ CRITICAL: Calculate tax BEFORE creating PaymentIntent
            var taxResult = _taxCalculator.CalculateTax(user, baseAmount);

            _logger.LogInformation(
                "Creating Stripe PaymentIntent for User {UserId}: Base={BaseAmount}, Tax={TaxAmount} ({TaxType}), Total={TotalAmount}",
                userId, taxResult.Amount, taxResult.TaxAmount, taxResult.TaxType, taxResult.TotalAmount);

            // Convert to smallest currency unit (cents for USD, öre for SEK, etc.)
            // Stripe amounts are in cents: $10.50 = 1050
            long stripeAmount = (long)(taxResult.TotalAmount * 100);

            // Create PaymentIntent
            var options = new PaymentIntentCreateOptions
            {
                Amount = stripeAmount,
                Currency = currency.ToLower(), // Stripe requires lowercase (usd, eur, sek)
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                },
                Description = $"Wallet Top-Up - User {userId}",
                Metadata = new Dictionary<string, string>
                {
                    { "user_id", userId.ToString() },
                    { "base_amount", taxResult.Amount.ToString("F2") },
                    { "tax_amount", taxResult.TaxAmount.ToString("F2") },
                    { "total_amount", taxResult.TotalAmount.ToString("F2") },
                    { "tax_type", taxResult.TaxType },
                    { "country_code", taxResult.CountryCode }
                }
            };

            var service = new PaymentIntentService();
            var paymentIntent = await service.CreateAsync(options);

            _logger.LogInformation(
                "Stripe PaymentIntent created: {PaymentIntentId}, Amount={Amount} cents, ClientSecret={ClientSecret}",
                paymentIntent.Id, stripeAmount, paymentIntent.ClientSecret?.Substring(0, 20) + "...");

            return paymentIntent;
        }

        public async Task<bool> HandleWebhookAsync(string json, string stripeSignature)
        {
            try
            {
                var webhookSecret = _configuration["Stripe:WebhookSecret"];
                if (string.IsNullOrEmpty(webhookSecret))
                {
                    _logger.LogWarning("Stripe:WebhookSecret not configured. Webhook signature verification disabled.");
                    // In production, you MUST verify signatures. For testing, we can skip.
                }

                // Construct and verify webhook event
                Event stripeEvent;
                try
                {
                    if (!string.IsNullOrEmpty(webhookSecret))
                    {
                        stripeEvent = EventUtility.ConstructEvent(json, stripeSignature, webhookSecret);
                    }
                    else
                    {
                        // Parse event without verification (TESTING ONLY)
                        stripeEvent = EventUtility.ParseEvent(json);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Stripe webhook signature verification failed");
                    return false;
                }

                _logger.LogInformation("Stripe webhook received: {EventType}, ID={EventId}",
                    stripeEvent.Type, stripeEvent.Id);

                // Handle the event
                if (stripeEvent.Type == "payment_intent.succeeded")
                {
                    var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
                    if (paymentIntent != null)
                    {
                        await ConfirmPaymentAsync(paymentIntent.Id);
                    }
                }
                else if (stripeEvent.Type == "payment_intent.payment_failed")
                {
                    var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
                    if (paymentIntent != null)
                    {
                        _logger.LogWarning("Payment failed: {PaymentIntentId}", paymentIntent.Id);
                        // TODO: Notify user of payment failure
                    }
                }
                else
                {
                    _logger.LogInformation("Unhandled Stripe event type: {EventType}", stripeEvent.Type);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling Stripe webhook");
                return false;
            }
        }

        public async Task<Payment?> ConfirmPaymentAsync(string paymentIntentId)
        {
            try
            {
                // Retrieve PaymentIntent from Stripe
                var service = new PaymentIntentService();
                var paymentIntent = await service.GetAsync(paymentIntentId);

                // Check if already processed (idempotency)
                var existingPayment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.ExternalTransactionId == paymentIntentId);

                if (existingPayment != null)
                {
                    _logger.LogInformation("Payment already processed: {PaymentIntentId}", paymentIntentId);
                    return existingPayment;
                }

                // Extract metadata
                if (!paymentIntent.Metadata.TryGetValue("user_id", out var userIdStr) ||
                    !int.TryParse(userIdStr, out int userId))
                {
                    _logger.LogError("Invalid user_id in PaymentIntent metadata: {PaymentIntentId}", paymentIntentId);
                    return null;
                }

                decimal baseAmount = decimal.Parse(paymentIntent.Metadata["base_amount"]);
                decimal taxAmount = decimal.Parse(paymentIntent.Metadata["tax_amount"]);
                decimal totalAmount = decimal.Parse(paymentIntent.Metadata["total_amount"]);
                string taxType = paymentIntent.Metadata["tax_type"];

                _logger.LogInformation(
                    "Confirming payment for User {UserId}: PaymentIntent={PaymentIntentId}, Total={TotalAmount}",
                    userId, paymentIntentId, totalAmount);

                // Use WalletService to process top-up (generates invoice PDF)
                var payment = await _walletService.TopUpAsync(
                    userId,
                    baseAmount,
                    "Stripe",
                    paymentIntentId);

                _logger.LogInformation(
                    "Payment confirmed successfully: PaymentId={PaymentId}, Invoice={InvoiceNumber}",
                    payment.Id, payment.InvoiceNumber);

                return payment;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming payment: {PaymentIntentId}", paymentIntentId);
                return null;
            }
        }
    }
}
