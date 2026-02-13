using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VoIPPlatform.API.Models;
using VoIPPlatform.API.Services;

namespace VoIPPlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IWalletService _walletService;
        private readonly ITaxCalculatorService _taxCalculator;
        private readonly IInvoiceService _invoiceService;
        private readonly IStripePaymentService _stripeService;
        private readonly VoIPDbContext _context;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(
            IWalletService walletService,
            ITaxCalculatorService taxCalculator,
            IInvoiceService invoiceService,
            IStripePaymentService stripeService,
            VoIPDbContext context,
            ILogger<PaymentsController> logger)
        {
            _walletService = walletService;
            _taxCalculator = taxCalculator;
            _invoiceService = invoiceService;
            _stripeService = stripeService;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get current wallet balance
        /// </summary>
        [HttpGet("wallet/balance")]
        public async Task<ActionResult<WalletBalanceDto>> GetWalletBalance()
        {
            var userId = GetCurrentUserId();
            var wallet = await _walletService.GetOrCreateWalletAsync(userId);

            return Ok(new WalletBalanceDto
            {
                Balance = wallet.Balance,
                Currency = wallet.Currency,
                LastUpdated = wallet.UpdatedAt ?? wallet.CreatedAt
            });
        }

        /// <summary>
        /// Top-up wallet with payment
        /// Calculates tax based on user's country and tax registration
        /// </summary>
        [HttpPost("topup")]
        public async Task<ActionResult<PaymentResponseDto>> TopUp([FromBody] TopUpRequestDto request)
        {
            var userId = GetCurrentUserId();

            // Validate request
            if (request.Amount <= 0)
            {
                return BadRequest(new { error = "Amount must be greater than zero" });
            }

            try
            {
                // Get user for tax calculation preview
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                // Preview tax calculation
                var taxResult = _taxCalculator.CalculateTax(user, request.Amount);

                // Process payment
                var payment = await _walletService.TopUpAsync(
                    userId,
                    request.Amount,
                    request.PaymentMethod ?? "CreditCard",
                    request.ExternalTransactionId);

                // Get updated balance
                var newBalance = await _walletService.GetBalanceAsync(userId);

                _logger.LogInformation(
                    "Payment processed for user {UserId}: Invoice={InvoiceNumber}, Total={Total}",
                    userId, payment.InvoiceNumber, payment.TotalPaid);

                return Ok(new PaymentResponseDto
                {
                    Success = true,
                    Payment = MapToPaymentDto(payment),
                    NewBalance = newBalance,
                    Message = "Payment processed successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment for user {UserId}", userId);
                return StatusCode(500, new { error = "Failed to process payment", details = ex.Message });
            }
        }

        /// <summary>
        /// Get payment history (all top-up transactions)
        /// </summary>
        [HttpGet("history")]
        public async Task<ActionResult<List<PaymentDto>>> GetPaymentHistory()
        {
            var userId = GetCurrentUserId();
            var payments = await _walletService.GetPaymentHistoryAsync(userId);

            var paymentDtos = payments.Select(MapToPaymentDto).ToList();

            return Ok(paymentDtos);
        }

        /// <summary>
        /// Get specific payment by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymentDto>> GetPayment(int id)
        {
            var userId = GetCurrentUserId();
            var payment = await _walletService.GetPaymentByIdAsync(id, userId);

            if (payment == null)
            {
                return NotFound(new { error = "Payment not found" });
            }

            return Ok(MapToPaymentDto(payment));
        }

        /// <summary>
        /// Download invoice PDF for a payment
        /// </summary>
        [HttpGet("{id}/invoice.pdf")]
        public async Task<IActionResult> DownloadInvoice(int id)
        {
            var userId = GetCurrentUserId();
            var payment = await _walletService.GetPaymentByIdAsync(id, userId);

            if (payment == null)
            {
                return NotFound(new { error = "Payment not found" });
            }

            if (string.IsNullOrEmpty(payment.InvoicePdfPath))
            {
                return NotFound(new { error = "Invoice PDF not generated yet" });
            }

            // Get physical file path
            var filePath = _invoiceService.GetInvoicePath(userId, payment.InvoiceNumber);

            if (filePath == null || !System.IO.File.Exists(filePath))
            {
                return NotFound(new { error = "Invoice PDF file not found" });
            }

            // Read file and return as PDF
            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            var fileName = $"{payment.InvoiceNumber}.pdf";

            return File(fileBytes, "application/pdf", fileName);
        }

        /// <summary>
        /// Calculate tax for a given amount (preview before payment)
        /// </summary>
        [HttpPost("calculate-tax")]
        public async Task<ActionResult<TaxCalculationResult>> CalculateTax([FromBody] TaxCalculationRequestDto request)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            var result = _taxCalculator.CalculateTax(user, request.Amount);
            return Ok(result);
        }

        /// <summary>
        /// Update user's billing information (country, tax ID, address)
        /// </summary>
        [HttpPut("billing-info")]
        public async Task<ActionResult> UpdateBillingInfo([FromBody] BillingInfoDto billingInfo)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            // Update billing fields
            user.Country = billingInfo.Country;
            user.TaxRegistrationNumber = billingInfo.TaxRegistrationNumber;
            user.Address = billingInfo.Address;
            user.City = billingInfo.City;
            user.PostalCode = billingInfo.PostalCode;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated billing info for user {UserId}", userId);

            return Ok(new { message = "Billing information updated successfully" });
        }

        /// <summary>
        /// Get user's current billing information
        /// </summary>
        [HttpGet("billing-info")]
        public async Task<ActionResult<BillingInfoDto>> GetBillingInfo()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(new BillingInfoDto
            {
                Country = user.Country,
                TaxRegistrationNumber = user.TaxRegistrationNumber,
                Address = user.Address,
                City = user.City,
                PostalCode = user.PostalCode
            });
        }

        // ==================== Phase 8: Stripe Payment Integration ====================

        /// <summary>
        /// Create Stripe PaymentIntent with tax calculation
        /// Returns client_secret for frontend Stripe Elements
        /// </summary>
        [HttpPost("stripe/create-intent")]
        public async Task<ActionResult<StripePaymentIntentDto>> CreateStripePaymentIntent(
            [FromBody] StripePaymentRequestDto request)
        {
            var userId = GetCurrentUserId();

            if (request.Amount <= 0)
            {
                return BadRequest(new { error = "Amount must be greater than zero" });
            }

            try
            {
                // Get user for tax preview
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                // Calculate tax preview
                var taxResult = _taxCalculator.CalculateTax(user, request.Amount);

                // Create Stripe PaymentIntent (includes tax calculation)
                var paymentIntent = await _stripeService.CreatePaymentIntentAsync(
                    userId,
                    request.Amount,
                    request.Currency ?? "USD");

                _logger.LogInformation(
                    "Stripe PaymentIntent created for user {UserId}: {PaymentIntentId}",
                    userId, paymentIntent.Id);

                return Ok(new StripePaymentIntentDto
                {
                    ClientSecret = paymentIntent.ClientSecret,
                    PaymentIntentId = paymentIntent.Id,
                    Amount = taxResult.Amount,
                    TaxAmount = taxResult.TaxAmount,
                    TotalAmount = taxResult.TotalAmount,
                    Currency = request.Currency ?? "USD",
                    TaxType = taxResult.TaxType
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Stripe PaymentIntent for user {UserId}", userId);
                return StatusCode(500, new { error = "Failed to create payment intent", details = ex.Message });
            }
        }

        /// <summary>
        /// Stripe Webhook Endpoint (receives payment confirmations)
        /// This endpoint should be registered in Stripe Dashboard
        /// </summary>
        [HttpPost("stripe/webhook")]
        [AllowAnonymous] // Webhooks come from Stripe, not authenticated users
        public async Task<IActionResult> StripeWebhook()
        {
            try
            {
                var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
                var stripeSignature = Request.Headers["Stripe-Signature"].ToString();

                if (string.IsNullOrEmpty(stripeSignature))
                {
                    _logger.LogWarning("Stripe webhook received without signature header");
                    return BadRequest(new { error = "Missing Stripe-Signature header" });
                }

                var success = await _stripeService.HandleWebhookAsync(json, stripeSignature);

                if (success)
                {
                    return Ok(new { received = true });
                }
                else
                {
                    return BadRequest(new { error = "Webhook processing failed" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Stripe webhook");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        // ==================== Helper Methods ====================

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }
            return userId;
        }

        private PaymentDto MapToPaymentDto(Payment payment)
        {
            return new PaymentDto
            {
                Id = payment.Id,
                Amount = payment.Amount,
                TaxAmount = payment.TaxAmount,
                TotalPaid = payment.TotalPaid,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status,
                TransactionDate = payment.TransactionDate,
                InvoiceNumber = payment.InvoiceNumber,
                InvoicePdfPath = payment.InvoicePdfPath,
                Notes = payment.Notes
            };
        }
    }

    // ==================== DTOs ====================

    public class WalletBalanceDto
    {
        public decimal Balance { get; set; }
        public string Currency { get; set; } = "USD";
        public DateTime LastUpdated { get; set; }
    }

    public class TopUpRequestDto
    {
        public decimal Amount { get; set; }
        public string? PaymentMethod { get; set; } // "CreditCard", "Stripe", "PayPal", etc.
        public string? ExternalTransactionId { get; set; } // Payment gateway transaction ID
    }

    public class PaymentResponseDto
    {
        public bool Success { get; set; }
        public PaymentDto? Payment { get; set; }
        public decimal NewBalance { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class PaymentDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalPaid { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime TransactionDate { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string? InvoicePdfPath { get; set; }
        public string? Notes { get; set; }
    }

    public class TaxCalculationRequestDto
    {
        public decimal Amount { get; set; }
    }

    public class BillingInfoDto
    {
        public string? Country { get; set; }
        public string? TaxRegistrationNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? PostalCode { get; set; }
    }

    // ==================== Phase 8: Stripe DTOs ====================

    public class StripePaymentRequestDto
    {
        public decimal Amount { get; set; }
        public string? Currency { get; set; } = "USD";
    }

    public class StripePaymentIntentDto
    {
        public string ClientSecret { get; set; } = string.Empty;
        public string PaymentIntentId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; } = "USD";
        public string TaxType { get; set; } = string.Empty;
    }
}
