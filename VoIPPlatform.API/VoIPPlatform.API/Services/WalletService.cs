using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Wallet Service Implementation (Phase 7)
    /// Manages pre-paid wallets and payment processing with tax calculation
    /// </summary>
    public class WalletService : IWalletService
    {
        private readonly VoIPDbContext _context;
        private readonly ITaxCalculatorService _taxCalculator;
        private readonly IInvoiceService _invoiceService;
        private readonly ILogger<WalletService> _logger;

        public WalletService(
            VoIPDbContext context,
            ITaxCalculatorService taxCalculator,
            IInvoiceService invoiceService,
            ILogger<WalletService> logger)
        {
            _context = context;
            _taxCalculator = taxCalculator;
            _invoiceService = invoiceService;
            _logger = logger;
        }

        public async Task<decimal> GetBalanceAsync(int userId)
        {
            var wallet = await GetOrCreateWalletAsync(userId);
            return wallet.Balance;
        }

        public async Task<Wallet> GetOrCreateWalletAsync(int userId)
        {
            // Try to find existing wallet
            var wallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet != null)
            {
                return wallet;
            }

            // Create new wallet if doesn't exist
            wallet = new Wallet
            {
                UserId = userId,
                Balance = 0.00m,
                Currency = "USD",
                CreatedAt = DateTime.UtcNow
            };

            _context.Wallets.Add(wallet);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created new wallet for user {UserId}", userId);

            return wallet;
        }

        public async Task<Payment> TopUpAsync(
            int userId,
            decimal amount,
            string paymentMethod,
            string? externalTransactionId = null)
        {
            // Validate amount
            if (amount <= 0)
            {
                throw new ArgumentException("Amount must be greater than zero", nameof(amount));
            }

            // Get user for tax calculation
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException($"User {userId} not found");
            }

            // Calculate tax
            var taxResult = _taxCalculator.CalculateTax(user, amount);

            // Generate invoice number
            var invoiceNumber = await GenerateInvoiceNumberAsync();

            // Create payment record
            var payment = new Payment
            {
                UserId = userId,
                Amount = taxResult.Amount,
                TaxAmount = taxResult.TaxAmount,
                TotalPaid = taxResult.TotalAmount,
                PaymentMethod = paymentMethod,
                Status = "Completed", // In production, start as "Pending" until payment gateway confirms
                TransactionDate = DateTime.UtcNow,
                InvoiceNumber = invoiceNumber,
                ExternalTransactionId = externalTransactionId,
                Notes = $"Top-up payment. Tax: {taxResult.TaxType}",
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);

            // Update wallet balance (add the TOTAL amount including tax)
            var wallet = await GetOrCreateWalletAsync(userId);
            wallet.Balance += taxResult.Amount; // Add only the base amount to wallet (tax goes to government)
            wallet.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Generate PDF invoice
            try
            {
                var pdfPath = await _invoiceService.GenerateInvoicePdfAsync(payment, user);
                payment.InvoicePdfPath = pdfPath;
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Generated invoice PDF: {PdfPath} for payment {PaymentId}",
                    pdfPath, payment.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate invoice PDF for payment {PaymentId}", payment.Id);
                // Don't fail the payment if PDF generation fails
            }

            _logger.LogInformation(
                "User {UserId} topped up wallet: Amount={Amount}, Tax={TaxAmount}, Total={TotalPaid}, Invoice={InvoiceNumber}",
                userId, taxResult.Amount, taxResult.TaxAmount, taxResult.TotalAmount, invoiceNumber);

            return payment;
        }

        public async Task<bool> DeductAsync(int userId, decimal amount, string description)
        {
            if (amount <= 0)
            {
                throw new ArgumentException("Amount must be greater than zero", nameof(amount));
            }

            var wallet = await GetOrCreateWalletAsync(userId);

            // Check sufficient balance
            if (wallet.Balance < amount)
            {
                _logger.LogWarning(
                    "Insufficient balance for user {UserId}. Required: {Amount}, Available: {Balance}",
                    userId, amount, wallet.Balance);
                return false;
            }

            // Deduct balance
            wallet.Balance -= amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Deducted {Amount} from user {UserId} wallet. Reason: {Description}. New balance: {Balance}",
                amount, userId, description, wallet.Balance);

            return true;
        }

        public async Task<bool> HasSufficientBalanceAsync(int userId, decimal amount)
        {
            var balance = await GetBalanceAsync(userId);
            return balance >= amount;
        }

        public async Task<List<Payment>> GetPaymentHistoryAsync(int userId)
        {
            return await _context.Payments
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.TransactionDate)
                .ToListAsync();
        }

        public async Task<Payment?> GetPaymentByIdAsync(int paymentId, int userId)
        {
            return await _context.Payments
                .FirstOrDefaultAsync(p => p.Id == paymentId && p.UserId == userId);
        }

        public async Task<Payment?> GetPaymentByInvoiceNumberAsync(string invoiceNumber)
        {
            return await _context.Payments
                .FirstOrDefaultAsync(p => p.InvoiceNumber == invoiceNumber);
        }

        public async Task<string> GenerateInvoiceNumberAsync()
        {
            // Format: INV-YYYY-NNNNNN (e.g., INV-2026-000001)
            var year = DateTime.UtcNow.Year;
            var prefix = $"INV-{year}-";

            // Get the latest invoice number for this year
            var lastInvoice = await _context.Payments
                .Where(p => p.InvoiceNumber.StartsWith(prefix))
                .OrderByDescending(p => p.InvoiceNumber)
                .Select(p => p.InvoiceNumber)
                .FirstOrDefaultAsync();

            int nextNumber = 1;

            if (lastInvoice != null)
            {
                // Extract the number part (last 6 digits)
                var numberPart = lastInvoice.Substring(prefix.Length);
                if (int.TryParse(numberPart, out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            // Generate invoice number with zero-padding (6 digits)
            return $"{prefix}{nextNumber:D6}";
        }
    }
}
