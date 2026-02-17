using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Phase 7.2: Converts unbilled CallRecords into Invoice + InvoiceLineItem rows.
    ///
    /// Grouping strategy:
    ///   - CallRecord.CalleeId is a raw phone number (e.g. "+447911123456").
    ///   - We do a longest-prefix match against BaseRate.Code to resolve a human-readable
    ///     DestinationName (e.g. "United Kingdom").
    ///   - Calls that cannot be matched fall back to the numeric prefix as the description.
    ///
    /// Financials:
    ///   - Quantity  = total minutes (sum of Duration seconds / 60)
    ///   - Total     = sum of CallRecord.Cost (the actual per-call charge already stored)
    ///   - UnitPrice = Total / Quantity  (effective rate per minute, derived from actuals)
    /// </summary>
    public class BillingService : IBillingService
    {
        private readonly VoIPDbContext _context;
        private readonly ILogger<BillingService> _logger;

        public BillingService(VoIPDbContext context, ILogger<BillingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ── Public API ────────────────────────────────────────────────────────

        public async Task<int> CountUnbilledCallsAsync(int userId, DateTime startDate, DateTime endDate)
        {
            return await _context.CallRecords
                .CountAsync(cr =>
                    cr.UserId == userId &&
                    cr.IsBilled == false &&
                    cr.Status == "Answered" &&
                    cr.StartTime >= startDate &&
                    cr.StartTime <= endDate);
        }

        public async Task<Invoice?> GenerateInvoiceForUserAsync(
            int userId, DateTime startDate, DateTime endDate)
        {
            // ── 1. Validate user ──────────────────────────────────────────────
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new InvalidOperationException($"User {userId} not found.");

            // ── 2. Fetch unbilled, answered calls in period ───────────────────
            var calls = await _context.CallRecords
                .Where(cr =>
                    cr.UserId == userId &&
                    cr.IsBilled == false &&
                    cr.Status == "Answered" &&
                    cr.StartTime >= startDate &&
                    cr.StartTime <= endDate)
                .ToListAsync();

            if (calls.Count == 0)
            {
                _logger.LogInformation(
                    "No unbilled calls for user {UserId} in period {Start}–{End}",
                    userId, startDate, endDate);
                return null;
            }

            _logger.LogInformation(
                "Generating invoice for user {UserId}: {Count} calls, period {Start}–{End}",
                userId, calls.Count, startDate, endDate);

            // ── 3. Load base rates for destination name resolution ────────────
            var baseRates = await _context.BaseRates
                .OrderByDescending(br => br.Code.Length)  // longest prefix first
                .ToListAsync();

            // ── 4. Group calls by resolved destination name ───────────────────
            var groups = calls
                .GroupBy(cr => ResolveDestinationName(cr.CalleeId, baseRates))
                .ToList();

            // ── 5. Build line items ───────────────────────────────────────────
            var lineItems = new List<InvoiceLineItem>();

            foreach (var group in groups)
            {
                var totalSeconds = group.Sum(c => c.Duration);
                var totalMinutes = Math.Round((decimal)totalSeconds / 60m, 5);
                var totalCost   = Math.Round(group.Sum(c => c.Cost), 5);

                // Effective rate = cost / minutes; guard against zero-duration edge case
                var unitPrice = totalMinutes > 0
                    ? Math.Round(totalCost / totalMinutes, 5)
                    : 0m;

                lineItems.Add(new InvoiceLineItem
                {
                    Description = group.Key,
                    Quantity    = totalMinutes,
                    UnitPrice   = unitPrice,
                    Total       = totalCost
                });
            }

            // ── 6. Create Invoice ─────────────────────────────────────────────
            var invoice = new Invoice
            {
                UserId      = userId,
                PeriodStart = startDate,
                PeriodEnd   = endDate,
                TotalAmount = Math.Round(lineItems.Sum(li => li.Total), 5),
                Status      = InvoiceStatus.Unpaid,
                CreatedAt   = DateTime.UtcNow,
                DueDate     = DateTime.UtcNow.AddDays(30),
                LineItems   = lineItems,
                Notes       = $"Auto-generated from {calls.Count} call record(s)"
            };

            _context.Invoices.Add(invoice);

            // ── 7. Mark call records as billed ────────────────────────────────
            // Bulk-update in a single statement to avoid loading each entity
            var callIds = calls.Select(c => c.Id).ToList();
            await _context.CallRecords
                .Where(cr => callIds.Contains(cr.Id))
                .ExecuteUpdateAsync(s => s.SetProperty(cr => cr.IsBilled, true));

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Invoice {InvoiceId} created for user {UserId}: {Lines} line items, total ${Total}",
                invoice.Id, userId, lineItems.Count, invoice.TotalAmount);

            return invoice;
        }

        // ── Private helpers ───────────────────────────────────────────────────

        /// <summary>
        /// Longest-prefix match of a phone number against BaseRate.Code values.
        /// Tries prefixes from 6 digits down to 1. Falls back to a readable label.
        /// </summary>
        private static string ResolveDestinationName(string calleeId, IList<BaseRate> baseRates)
        {
            // Normalise: strip leading +, spaces, dashes
            var digits = new string(calleeId.Where(char.IsDigit).ToArray());

            // Try longest prefix first (list is pre-sorted longest → shortest)
            foreach (var rate in baseRates)
            {
                if (digits.StartsWith(rate.Code))
                    return rate.DestinationName;
            }

            // Fallback: use the first 4 digits as an anonymous prefix label
            var prefix = digits.Length >= 4 ? digits[..4] : digits;
            return $"International (+{prefix}...)";
        }
    }
}
