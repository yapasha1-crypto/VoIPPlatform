using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.DTOs;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AuditLogsController : ControllerBase
    {
        private readonly VoIPDbContext _context;

        public AuditLogsController(VoIPDbContext context)
        {
            _context = context;
        }

        // GET: api/AuditLogs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetAuditLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? user = null,
            [FromQuery] string? action = null)
        {
            var query = _context.AuditLogs.Include(l => l.User).AsQueryable();

            if (!string.IsNullOrEmpty(user))
            {
                query = query.Where(l => l.User != null && l.User.Username.Contains(user));
            }

            if (!string.IsNullOrEmpty(action))
            {
                query = query.Where(l => l.Action.Contains(action));
            }

            // Sort by newest first
            query = query.OrderByDescending(l => l.Timestamp);

            var totalItems = await query.CountAsync();
            var logs = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new AuditLogDto
                {
                    Id = l.Id,
                    UserName = l.User != null ? l.User.Username : "Unknown",
                    Action = l.Action,
                    EntityName = l.EntityName,
                    Timestamp = l.Timestamp,
                    IPAddress = l.IPAddress,
                    Changes = l.Changes
                })
                .ToListAsync();

            return Ok(new
            {
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                Data = logs
            });
        }

        // GET: api/AuditLogs/export
        [HttpGet("export")]
        public async Task<IActionResult> ExportAuditLogs(
            [FromQuery] string? user = null,
            [FromQuery] string? action = null)
        {
            var query = _context.AuditLogs.Include(l => l.User).AsQueryable();

            if (!string.IsNullOrEmpty(user))
            {
                query = query.Where(l => l.User != null && l.User.Username.Contains(user));
            }

            if (!string.IsNullOrEmpty(action))
            {
                query = query.Where(l => l.Action.Contains(action));
            }

            // Sort by newest first
            query = query.OrderByDescending(l => l.Timestamp);

            var logs = await query.ToListAsync();

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("Id,Timestamp,User,Action,EntityName,IPAddress,Changes");

            foreach (var log in logs)
            {
                var userName = log.User != null ? log.User.Username : "Unknown";
                var changes = (log.Changes ?? "").Replace("\"", "\"\""); // Escape quotes
                csv.AppendLine($"{log.Id},{log.Timestamp:yyyy-MM-dd HH:mm:ss},{userName},{log.Action},{log.EntityName},{log.IPAddress},\"{changes}\"");
            }

            var userId = int.Parse(User.FindFirst("id")?.Value ?? "0");
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                Action = "Exported Audit Logs",
                EntityName = "AuditLog",
                Timestamp = DateTime.UtcNow,
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                Changes = "Exported logs to CSV"
            });
            await _context.SaveChangesAsync();

            var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", $"audit_logs_{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
        }
    }
}
