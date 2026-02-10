using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using VoIPPlatform.API.Models;
using VoIPPlatform.API.Services;

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
        private readonly IChannelManager _channelManager;

        public CallRecordsController(
            VoIPDbContext context,
            ILogger<CallRecordsController> logger,
            IChannelManager channelManager)
        {
            _context = context;
            _logger = logger;
            _channelManager = channelManager;
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

        /// <summary>
        /// Start a new call with channel capacity enforcement
        /// Phase 5: Returns 429 Too Many Requests if channel capacity exceeded
        /// </summary>
        [HttpPost("start-call")]
        public async Task<IActionResult> StartCall([FromBody] StartCallRequest request)
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

                _logger.LogInformation($"User {user.Username} (ID: {user.Id}) attempting to start call");

                // Phase 5: Check channel capacity BEFORE starting call
                bool canStart = await _channelManager.CanStartCallAsync(user.Id);
                if (!canStart)
                {
                    var channelInfo = await _channelManager.GetChannelInfoAsync(user.Id);
                    _logger.LogWarning(
                        $"Channel capacity exceeded for user {user.Id}. " +
                        $"Active: {channelInfo.ActiveCalls}, Max: {channelInfo.MaxConcurrentCalls}"
                    );

                    return StatusCode(429, new
                    {
                        success = false,
                        message = $"Channel capacity exceeded. Maximum {channelInfo.MaxConcurrentCalls} concurrent calls allowed.",
                        data = new
                        {
                            maxConcurrentCalls = channelInfo.MaxConcurrentCalls,
                            activeCalls = channelInfo.ActiveCalls,
                            availableChannels = channelInfo.AvailableChannels
                        }
                    });
                }

                // Create call record
                var callRecord = new CallRecord
                {
                    UserId = user.Id,
                    CallerId = request.CallerId,
                    CalleeId = request.CalleeId,
                    StartTime = DateTime.UtcNow,
                    Duration = 0,
                    Cost = 0,
                    Status = "InProgress"
                };

                _context.CallRecords.Add(callRecord);
                await _context.SaveChangesAsync();

                // Increment active calls counter
                await _channelManager.IncrementActiveCallsAsync(user.Id);

                _logger.LogInformation($"Call started successfully. Call ID: {callRecord.Id}");

                return Ok(new
                {
                    success = true,
                    message = "Call started successfully",
                    data = new
                    {
                        callId = callRecord.Id,
                        callerId = callRecord.CallerId,
                        calleeId = callRecord.CalleeId,
                        startTime = callRecord.StartTime,
                        status = callRecord.Status
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting call");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// End an active call and decrement channel counter
        /// Phase 5: Decrements ActiveCalls for user or their company
        /// </summary>
        [HttpPost("end-call")]
        public async Task<IActionResult> EndCall([FromBody] EndCallRequest request)
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

                // Find the call record
                var callRecord = await _context.CallRecords.FindAsync(request.CallId);
                if (callRecord == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Call record not found"
                    });
                }

                // Verify ownership
                if (callRecord.UserId != user.Id)
                {
                    return Forbid();
                }

                _logger.LogInformation($"Ending call {request.CallId} for user {user.Username}");

                // Update call record
                callRecord.Duration = request.Duration;
                callRecord.Cost = request.Cost;
                callRecord.Status = request.Status ?? "Completed";

                await _context.SaveChangesAsync();

                // Decrement active calls counter
                await _channelManager.DecrementActiveCallsAsync(user.Id);

                _logger.LogInformation(
                    $"Call {request.CallId} ended. Duration: {request.Duration}s, Cost: ${request.Cost}"
                );

                return Ok(new
                {
                    success = true,
                    message = "Call ended successfully",
                    data = new
                    {
                        callId = callRecord.Id,
                        duration = callRecord.Duration,
                        cost = callRecord.Cost,
                        status = callRecord.Status
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error ending call");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get channel information for current user
        /// Phase 5: Shows available channels and utilization
        /// </summary>
        [HttpGet("channel-info")]
        public async Task<IActionResult> GetChannelInfo()
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

                var channelInfo = await _channelManager.GetChannelInfoAsync(user.Id);

                return Ok(new
                {
                    success = true,
                    message = "Channel information retrieved successfully",
                    data = channelInfo
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching channel info");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error"
                });
            }
        }
    }

    // DTOs for Call Endpoints
    public class StartCallRequest
    {
        [Required]
        [StringLength(50)]
        public required string CallerId { get; set; }

        [Required]
        [StringLength(50)]
        public required string CalleeId { get; set; }
    }

    public class EndCallRequest
    {
        [Required]
        public int CallId { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int Duration { get; set; }

        [Required]
        [Range(0.0, double.MaxValue)]
        public decimal Cost { get; set; }

        public string? Status { get; set; }
    }
}
