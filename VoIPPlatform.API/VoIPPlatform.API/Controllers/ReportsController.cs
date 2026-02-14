using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.DTOs;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly VoIPDbContext _context;

        public ReportsController(VoIPDbContext context)
        {
            _context = context;
        }

        // GET: api/reports
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReportResponseDto>>> GetReports()
        {
            var reports = await _context.Reports
                .Include(r => r.Account)
                .ThenInclude(a => a!.User)
                .ToListAsync();

            var reportDtos = reports.Select(r => new ReportResponseDto
            {
                Id = r.Id,
                AccountId = r.AccountId,
                UserId = r.UserId,
                ReportType = r.ReportType,
                StartDate = r.StartDate,
                EndDate = r.EndDate,
                TotalCalls = r.TotalCalls,
                CompletedCalls = r.CompletedCalls,
                FailedCalls = r.FailedCalls,
                TotalCallDurationSeconds = r.TotalCallDurationSeconds,
                TotalCallCost = r.TotalCallCost,
                TotalSMS = r.TotalSMS,
                SentSMS = r.SentSMS,
                FailedSMS = r.FailedSMS,
                TotalSMSCost = r.TotalSMSCost,
                TotalRevenue = r.TotalRevenue,
                StartingBalance = r.StartingBalance,
                EndingBalance = r.EndingBalance,
                TotalDeducted = r.TotalDeducted,
                Notes = r.Notes,
                GeneratedAt = r.GeneratedAt,
                ExportedAt = r.ExportedAt,
                ExportFormat = r.ExportFormat,
                AccountNumber = r.Account?.VirtualPhoneNumber,
                UserName = r.Account?.User?.FullName
            }).ToList();

            return Ok(reportDtos);
        }

        // GET: api/reports/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ReportResponseDto>> GetReport(int id)
        {
            var report = await _context.Reports
                .Include(r => r.Account)
                .ThenInclude(a => a!.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (report == null)
                return NotFound(new { message = "التقرير غير موجود" });

            var reportDto = new ReportResponseDto
            {
                Id = report.Id,
                AccountId = report.AccountId,
                UserId = report.UserId,
                ReportType = report.ReportType,
                StartDate = report.StartDate,
                EndDate = report.EndDate,
                TotalCalls = report.TotalCalls,
                CompletedCalls = report.CompletedCalls,
                FailedCalls = report.FailedCalls,
                TotalCallDurationSeconds = report.TotalCallDurationSeconds,
                TotalCallCost = report.TotalCallCost,
                TotalSMS = report.TotalSMS,
                SentSMS = report.SentSMS,
                FailedSMS = report.FailedSMS,
                TotalSMSCost = report.TotalSMSCost,
                TotalRevenue = report.TotalRevenue,
                StartingBalance = report.StartingBalance,
                EndingBalance = report.EndingBalance,
                TotalDeducted = report.TotalDeducted,
                Notes = report.Notes,
                GeneratedAt = report.GeneratedAt,
                ExportedAt = report.ExportedAt,
                ExportFormat = report.ExportFormat,
                AccountNumber = report.Account?.VirtualPhoneNumber,
                UserName = report.Account?.User?.FullName
            };

            return Ok(reportDto);
        }

        // POST: api/reports
        [HttpPost]
        public async Task<ActionResult<ReportResponseDto>> CreateReport(CreateReportRequest request)
        {
            // تحقق من وجود الحساب
            var account = await _context.Accounts
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Id == request.AccountId);

            if (account == null)
                return BadRequest(new { message = "الحساب غير موجود" });

            var report = new Report
            {
                AccountId = request.AccountId,
                UserId = request.UserId,
                ReportType = request.ReportType,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Notes = request.Notes,
                GeneratedAt = DateTime.UtcNow
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            var reportDto = new ReportResponseDto
            {
                Id = report.Id,
                AccountId = report.AccountId,
                UserId = report.UserId,
                ReportType = report.ReportType,
                StartDate = report.StartDate,
                EndDate = report.EndDate,
                Notes = report.Notes,
                GeneratedAt = report.GeneratedAt,
                AccountNumber = account.VirtualPhoneNumber,
                UserName = account.User?.FullName,
                ExportFormat = report.ExportFormat
            };

            return CreatedAtAction(nameof(GetReport), new { id = report.Id }, reportDto);
        }

        // PUT: api/reports/5
        [HttpPut("{id}")]
        public async Task<ActionResult<ReportResponseDto>> UpdateReport(int id, UpdateReportRequest request)
        {
            var report = await _context.Reports
                .Include(r => r.Account)
                .ThenInclude(a => a.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (report == null)
                return NotFound(new { message = "التقرير غير موجود" });

            if (!string.IsNullOrEmpty(request.ReportType))
                report.ReportType = request.ReportType;

            if (request.StartDate.HasValue)
                report.StartDate = request.StartDate.Value;

            if (request.EndDate.HasValue)
                report.EndDate = request.EndDate.Value;

            if (!string.IsNullOrEmpty(request.ExportFormat))
                report.ExportFormat = request.ExportFormat;

            _context.Reports.Update(report);
            await _context.SaveChangesAsync();

            var reportDto = new ReportResponseDto
            {
                Id = report.Id,
                AccountId = report.AccountId,
                UserId = report.UserId,
                ReportType = report.ReportType,
                StartDate = report.StartDate,
                EndDate = report.EndDate,
                GeneratedAt = report.GeneratedAt,
                ExportFormat = report.ExportFormat,
                AccountNumber = report.Account?.VirtualPhoneNumber,
                UserName = report.Account?.User?.FullName
            };

            return Ok(reportDto);
        }

        // DELETE: api/reports/5
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteReport(int id)
        {
            var report = await _context.Reports.FindAsync(id);

            if (report == null)
                return NotFound(new { message = "التقرير غير موجود" });

            _context.Reports.Remove(report);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/reports/account/5
        [HttpGet("account/{accountId}")]
        public async Task<ActionResult<IEnumerable<ReportResponseDto>>> GetReportsByAccount(int accountId)
        {
            var reports = await _context.Reports
                .Where(r => r.AccountId == accountId)
                .Include(r => r.Account)
                .ThenInclude(a => a.User)
                .ToListAsync();

            if (!reports.Any())
                return NotFound(new { message = "لا توجد تقارير لهذا الحساب" });

            var reportDtos = reports.Select(r => new ReportResponseDto
            {
                Id = r.Id,
                AccountId = r.AccountId,
                UserId = r.UserId,
                ReportType = r.ReportType,
                StartDate = r.StartDate,
                EndDate = r.EndDate,
                TotalCallCost = r.TotalCallCost,
                TotalSMSCost = r.TotalSMSCost,
                TotalRevenue = r.TotalRevenue,
                GeneratedAt = r.GeneratedAt,
                AccountNumber = r.Account!.VirtualPhoneNumber,
                UserName = r.Account!.User!.FirstName + " " + r.Account!.User!.LastName,
                ExportFormat = r.ExportFormat

            }).ToList();

            return Ok(reportDtos);
        }
        // GET: api/reports/export/financial
        [HttpGet("export/financial")]
        public async Task<IActionResult> ExportFinancialReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate ?? DateTime.UtcNow;

            var userId = int.Parse(User.FindFirst("id")?.Value ?? "0");
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            // Query Accounts
            var accountsQuery = _context.Accounts.Include(a => a.User).AsQueryable();
            if (userRole != "Admin")
            {
                accountsQuery = accountsQuery.Where(a => a.UserId == userId);
            }
            var accounts = await accountsQuery.ToListAsync();

            // Prepare CSV
            var sb = new System.Text.StringBuilder();
            sb.AppendLine("Account ID,Phone Number,User,Total Calls,Total Call Cost,Total SMS,Total SMS Cost,Total Spent");

            foreach (var account in accounts)
            {
                var calls = await _context.Calls
                    .Where(c => c.AccountId == account.Id && c.StartTime >= start && c.StartTime <= end)
                    .ToListAsync();

                var sms = await _context.SMS
                    .Where(s => s.AccountId == account.Id && s.SentAt >= start && s.SentAt <= end)
                    .ToListAsync();

                var totalCalls = calls.Count;
                var totalCallCost = calls.Sum(c => c.Cost);
                var totalSms = sms.Count;
                var totalSmsCost = sms.Sum(s => s.Cost);
                var totalSpent = totalCallCost + totalSmsCost;

                sb.AppendLine($"{account.Id},{account.VirtualPhoneNumber},{account.User?.FullName},{totalCalls},{totalCallCost:F2},{totalSms},{totalSmsCost:F2},{totalSpent:F2}");
            }

            var fileName = $"financial_report_{start:yyyyMMdd}_{end:yyyyMMdd}.csv";
            return File(System.Text.Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", fileName);
        }
    }
}

