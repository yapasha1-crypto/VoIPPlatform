using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.Models;
using VoIPPlatform.API.Services;

namespace VoIPPlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InvoicesController : ControllerBase
    {
        private readonly VoIPDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IBillingService _billing;

        public InvoicesController(
            VoIPDbContext context,
            IEmailService emailService,
            IBillingService billing)
        {
            _context = context;
            _emailService = emailService;
            _billing = billing;
        }

        // GET: api/Invoices
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoices()
        {
            var userId = int.Parse(User.FindFirst("id")?.Value ?? "0");
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (userRole == "Admin")
            {
                return await _context.Invoices
                    .Include(i => i.User)
                    .Include(i => i.LineItems)
                    .OrderByDescending(i => i.CreatedAt)
                    .ToListAsync();
            }

            return await _context.Invoices
                .Where(i => i.UserId == userId)
                .Include(i => i.LineItems)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }

        // GET: api/Invoices/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Invoice>> GetInvoice(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.User)
                .Include(i => i.LineItems)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound();

            var userId = int.Parse(User.FindFirst("id")?.Value ?? "0");
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (userRole != "Admin" && invoice.UserId != userId)
                return Forbid();

            return invoice;
        }

        // POST: api/Invoices (Admin only)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Invoice>> CreateInvoice(Invoice invoice)
        {
            var user = await _context.Users.FindAsync(invoice.UserId);
            if (user == null) return BadRequest("Invalid User ID");

            invoice.CreatedAt = DateTime.UtcNow;
            if (invoice.DueDate < invoice.CreatedAt)
                invoice.DueDate = invoice.CreatedAt.AddDays(30);

            _context.Invoices.Add(invoice);

            var adminId = int.Parse(User.FindFirst("id")?.Value ?? "0");
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = adminId,
                Action = "Created Invoice",
                EntityName = "Invoice",
                Timestamp = DateTime.UtcNow,
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                Changes = $"Created Invoice for User {invoice.UserId} Amount {invoice.TotalAmount}"
            });

            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(user.Email))
            {
                var subject = $"New Invoice (INV-{invoice.Id})";
                var body = $@"
                    <h1>New Invoice Generated</h1>
                    <p>Dear {user.Username},</p>
                    <p>A new invoice has been generated for your account.</p>
                    <ul>
                        <li><strong>Invoice ID:</strong> INV-{invoice.Id}</li>
                        <li><strong>Amount:</strong> ${invoice.TotalAmount:F5}</li>
                        <li><strong>Period:</strong> {invoice.PeriodStart:yyyy-MM-dd} – {invoice.PeriodEnd:yyyy-MM-dd}</li>
                        <li><strong>Due Date:</strong> {invoice.DueDate:yyyy-MM-dd}</li>
                    </ul>
                    <p><a href='https://your-voip-platform.com/dashboard/billing'>View invoice</a></p>
                    <p>VoIP Platform Team</p>";

                await _emailService.SendEmailAsync(user.Email, subject, body);

                _context.AuditLogs.Add(new AuditLog
                {
                    UserId = adminId,
                    Action = "Email Sent",
                    EntityName = "Invoice",
                    Timestamp = DateTime.UtcNow,
                    IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Changes = $"Sent Invoice Notification to {user.Email}"
                });
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoice);
        }

        // PUT: api/Invoices/5/pay (Admin only)
        [HttpPut("{id}/pay")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> MarkAsPaid(int id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();

            if (invoice.Status == InvoiceStatus.Paid)
                return BadRequest("Invoice is already paid");

            invoice.Status = InvoiceStatus.Paid;
            invoice.PaidDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Invoices/5 (Admin only)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteInvoice(int id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();

            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/Invoices/export
        [HttpGet("export")]
        public async Task<IActionResult> ExportInvoices()
        {
            var userId = int.Parse(User.FindFirst("id")?.Value ?? "0");
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            IQueryable<Invoice> query;

            if (userRole == "Admin")
            {
                query = _context.Invoices
                    .Include(i => i.User)
                    .OrderByDescending(i => i.CreatedAt);
            }
            else
            {
                query = _context.Invoices
                    .Where(i => i.UserId == userId)
                    .Include(i => i.User)
                    .OrderByDescending(i => i.CreatedAt);
            }

            var invoices = await query.ToListAsync();

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("InvoiceID,Username,TotalAmount,Status,PeriodStart,PeriodEnd,DueDate,CreatedAt");

            foreach (var inv in invoices)
            {
                csv.AppendLine(
                    $"INV-{inv.Id}," +
                    $"{inv.User?.Username ?? "Unknown"}," +
                    $"{inv.TotalAmount:F5}," +
                    $"{inv.Status}," +
                    $"{inv.PeriodStart:yyyy-MM-dd}," +
                    $"{inv.PeriodEnd:yyyy-MM-dd}," +
                    $"{inv.DueDate:yyyy-MM-dd}," +
                    $"{inv.CreatedAt:yyyy-MM-dd}");
            }

            try
            {
                _context.AuditLogs.Add(new AuditLog
                {
                    UserId = userId,
                    Action = "Exported Invoices",
                    EntityName = "Invoice",
                    Timestamp = DateTime.UtcNow,
                    IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Changes = $"Exported {invoices.Count} invoices"
                });
                await _context.SaveChangesAsync();
            }
            catch { /* never block the export for audit log failures */ }

            var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", $"invoices_{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
        }

        // POST: api/Invoices/generate  (Admin only)
        /// <summary>
        /// Phase 7.2: Manually trigger invoice generation from unbilled CallRecords.
        /// Idempotent: if no billable calls exist the response explains this clearly.
        /// </summary>
        [HttpPost("generate")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GenerateInvoice([FromBody] GenerateInvoiceRequest request)
        {
            if (request.EndDate <= request.StartDate)
                return BadRequest(new { error = "EndDate must be after StartDate." });

            try
            {
                // Preview: how many calls are in scope?
                var count = await _billing.CountUnbilledCallsAsync(
                    request.UserId, request.StartDate, request.EndDate);

                if (count == 0)
                {
                    return Ok(new
                    {
                        success = false,
                        message = $"No unbilled answered calls found for user {request.UserId} " +
                                  $"between {request.StartDate:yyyy-MM-dd} and {request.EndDate:yyyy-MM-dd}.",
                        invoiceId = (int?)null
                    });
                }

                var invoice = await _billing.GenerateInvoiceForUserAsync(
                    request.UserId, request.StartDate, request.EndDate);

                return CreatedAtAction(nameof(GetInvoice), new { id = invoice!.Id }, new
                {
                    success    = true,
                    message    = $"Invoice INV-{invoice.Id} generated successfully.",
                    invoiceId  = invoice.Id,
                    totalAmount = invoice.TotalAmount,
                    lineItems  = invoice.LineItems.Count,
                    billedCalls = count,
                    periodStart = invoice.PeriodStart,
                    periodEnd   = invoice.PeriodEnd,
                    dueDate     = invoice.DueDate
                });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Invoice generation failed: {ex.Message}" });
            }
        }
    }

    /// <summary>Request DTO for POST /api/invoices/generate</summary>
    public record GenerateInvoiceRequest(int UserId, DateTime StartDate, DateTime EndDate);
}
