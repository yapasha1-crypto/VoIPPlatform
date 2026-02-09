using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Controllers
{
    /// <summary>
    /// Call Records (CDR) Management
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CallRecordsController : ControllerBase
    {
        private readonly VoIPDbContext _context;
        private readonly ILogger<CallRecordsController> _logger;

        public CallRecordsController(VoIPDbContext context, ILogger<CallRecordsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get call records for logged-in user (sorted by newest first)
        /// </summary>
        [HttpGet("my-calls")]
        public async Task<IActionResult> GetMyCalls()
        {
            try
            {
                var username = User.Identity?.Name;
                if (string.IsNullOrEmpty(username))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (user == null)
                {
                    return Unauthorized(new { success = false, message = "User not found" });
                }

                _logger.LogInformation("Fetching call records for user: {Username}", username);

                var callRecords = await _context.CallRecords
                    .Where(cr => cr.UserId == user.Id)
                    .OrderByDescending(cr => cr.StartTime)
                    .Select(cr => new
                    {
                        cr.Id,
                        cr.CallerId,
                        cr.CalleeId,
                        cr.StartTime,
                        cr.Duration,
                        cr.Cost,
                        cr.Status
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    message = "Call records retrieved successfully",
                    data = callRecords,
                    count = callRecords.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching call records");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error"
                });
            }
        }
    }
}
