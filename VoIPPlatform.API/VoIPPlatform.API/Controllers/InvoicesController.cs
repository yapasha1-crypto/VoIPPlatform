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

        public InvoicesController(VoIPDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // GET: api/Invoices
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoices()
        {
            var userId = int.Parse(User.FindFirst("id")?.Value ?? "0");
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (userRole == "Admin")
            {
                return await _context.Invoices.Include(i => i.Account).ThenInclude(a => a!.User).OrderByDescending(i => i.IssueDate).ToListAsync();
            }
            else
            {
                // Users see invoices linked to their accounts
                return await _context.Invoices
                    .Where(i => i.Account!.UserId == userId)
                    .OrderByDescending(i => i.IssueDate)
                    .ToListAsync();
            }
        }
        // GET: api/Invoices/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Invoice>> GetInvoice(int id)
        {
            var invoice = await _context.Invoices.Include(i => i.Account).ThenInclude(a => a.User).FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirst("id")?.Value ?? "0");
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (userRole != "Admin" && invoice.Account?.UserId != userId)
            {
                return Forbid();
            }

            return invoice;
        }

        // POST: api/Invoices (Admin only)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Invoice>> CreateInvoice(Invoice invoice)
        {
            var account = await _context.Accounts.Include(a => a.User).FirstOrDefaultAsync(a => a.Id == invoice.AccountId);
            if (account == null)
            {
                return BadRequest("Invalid Account ID");
            }

            invoice.IssueDate = DateTime.UtcNow;
            if (invoice.DueDate < invoice.IssueDate) invoice.DueDate = invoice.IssueDate.AddDays(30);
            
            _context.Invoices.Add(invoice);
            
             // Create Audit Log
            var adminId = int.Parse(User.FindFirst("id")?.Value ?? "0");
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = adminId,
                Action = "Created Invoice",
                EntityName = "Invoice",
                Timestamp = DateTime.UtcNow,
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                Changes = $"Created Invoice for Account {invoice.AccountId} Amount {invoice.Amount}"
            });

            await _context.SaveChangesAsync();

            // Send Email Notification
            if (account.User != null && !string.IsNullOrEmpty(account.User.Email))
            {
                var subject = $"New Invoice Found (INV-{invoice.Id})";
                var body = $@"
                    <h1>New Invoice Generated</h1>
                    <p>Dear {account.User.Username},</p>
                    <p>A new invoice has been generated for your account.</p>
                    <ul>
                        <li><strong>Invoice ID:</strong> INV-{invoice.Id}</li>
                        <li><strong>Amount:</strong> ${invoice.Amount:F2}</li>
                        <li><strong>Due Date:</strong> {invoice.DueDate:yyyy-MM-dd}</li>
                    </ul>
                    <p><a href='https://your-voip-platform.com/dashboard/billing'>Click here to view and pay</a></p>
                    <p>Thank you,</p>
                    <p>VoIP Platform Team</p>";
                
                await _emailService.SendEmailAsync(account.User.Email, subject, body);
                
                // Log Email Sent
                 _context.AuditLogs.Add(new AuditLog
                {
                    UserId = adminId,
                    Action = "Email Sent",
                    EntityName = "Invoice",
                    Timestamp = DateTime.UtcNow,
                    IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Changes = $"Sent Invoice Notification to {account.User.Email}"
                });
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction("GetInvoices", new { id = invoice.Id }, invoice);
        }

        // PUT: api/Invoices/5/pay (Admin only)
        [HttpPut("{id}/pay")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> MarkAsPaid(int id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            if (invoice.Status == "Paid")
            {
                return BadRequest("Invoice is already paid");
            }

            invoice.Status = "Paid";
            invoice.PaidDate = DateTime.UtcNow;

            // Optional: Update account balance if logic dictates (e.g., adding credit)
            // For now, we assume this is just tracking payment for a bill.

            await _context.SaveChangesAsync();

            return NoContent();
        }
        
        // DELETE: api/Invoices/5 (Admin only)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteInvoice(int id)
        {
             var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

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
                query = _context.Invoices.Include(i => i.Account).ThenInclude(a => a!.User).OrderByDescending(i => i.IssueDate);
            }
            else
            {
                query = _context.Invoices
                    .Where(i => i.Account!.UserId == userId)
                    .Include(i => i.Account).ThenInclude(a => a!.User)
                    .OrderByDescending(i => i.IssueDate);
            }

            var invoices = await query.ToListAsync();

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("InvoiceID,AccountName,Amount,Status,IssueDate,DueDate,PaymentMethod");

            foreach (var inv in invoices)
            {
                var accountName = inv.Account?.User?.Username ?? inv.Account?.VirtualPhoneNumber ?? "Unknown";
                csv.AppendLine($"INV-{inv.Id},{accountName},{inv.Amount:F2},{inv.Status},{inv.IssueDate:yyyy-MM-dd},{inv.DueDate:yyyy-MM-dd},{inv.PaymentMethod}");
            }

             // Create Audit Log
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
            catch
            {
                // Silently fail logging if it hinders export, or handle specifically. 
                // For now, allow it to proceed.
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", $"invoices_report_{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
        }
    }
}
