using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using VoIPPlatform.API.Models;
using VoIPPlatform.API.Services;

namespace VoIPPlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly VoIPDbContext _context;
        private readonly ILogger<DashboardController> _logger;
        private readonly IHierarchyService _hierarchyService;

        public DashboardController(
            VoIPDbContext context,
            ILogger<DashboardController> logger,
            IHierarchyService hierarchyService)
        {
            _context = context;
            _logger = logger;
            _hierarchyService = hierarchyService;
        }

        [HttpGet("stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.UtcNow.Date;

            // Execute queries in parallel where possible or just await sequentially
            var totalCustomers = await _context.Accounts.CountAsync();
            var activeCustomers = await _context.Accounts.CountAsync(a => a.IsActive);
            var totalUsers = await _context.Users.CountAsync();
            
            var totalCallsToday = await _context.Calls.CountAsync(c => c.StartTime >= today);
            
            // SumAsync might throw if empty on some providers, but EF Core handles it. Cast to nullable decimal safely.
            var totalRevenueToday = await _context.Calls
                .Where(c => c.StartTime >= today)
                .SumAsync(c => (decimal?)c.Cost) ?? 0;

            var totalSystemBalance = await _context.Accounts.SumAsync(a => (decimal?)a.Balance) ?? 0;

            return Ok(new
            {
                TotalCustomers = totalCustomers,
                ActiveCustomers = activeCustomers,
                TotalUsers = totalUsers,
                TotalCallsToday = totalCallsToday,
                TotalRevenueToday = totalRevenueToday,
                TotalSystemBalance = totalSystemBalance
            });
        }

        /// <summary>
        /// Get dashboard statistics for logged-in user (personal stats)
        /// </summary>
        [HttpGet("user-stats")]
        [Authorize]
        public async Task<IActionResult> GetUserStats()
        {
            try
            {
                var username = User.Identity?.Name;
                if (string.IsNullOrEmpty(username))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                var user = await _context.Users
                    .Include(u => u.Accounts)
                    .FirstOrDefaultAsync(u => u.Username == username);

                if (user == null)
                {
                    return Unauthorized(new { success = false, message = "User not found" });
                }

                _logger.LogInformation("Fetching dashboard stats for user: {Username}", username);

                // Get call records statistics
                var callRecords = await _context.CallRecords
                    .Where(cr => cr.UserId == user.Id)
                    .ToListAsync();

                // Calculate statistics
                var totalCalls = callRecords.Count;
                var totalCost = callRecords.Sum(cr => cr.Cost);
                var totalDuration = callRecords
                    .Where(cr => cr.Status == "Answered")
                    .Sum(cr => cr.Duration);

                // Count active services (accounts)
                var activeServices = user.Accounts.Count(a => a.IsActive);

                // User balance
                var balance = user.AccountBalance;

                return Ok(new
                {
                    success = true,
                    message = "Dashboard statistics retrieved successfully",
                    data = new
                    {
                        balance = balance,
                        totalCalls = totalCalls,
                        totalCost = totalCost,
                        totalDuration = totalDuration,
                        activeServices = activeServices > 0 ? activeServices : 1 // Default to 1 if no accounts
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching dashboard statistics");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Get aggregated dashboard statistics for Resellers (all companies and users)
        /// Phase 5: Multi-Tenant Hierarchy
        /// </summary>
        [HttpGet("reseller-stats")]
        [Authorize(Roles = "Reseller")]
        public async Task<IActionResult> GetResellerStats()
        {
            try
            {
                var username = User.Identity?.Name;
                if (string.IsNullOrEmpty(username))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                var reseller = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == username && u.Role == "Reseller");

                if (reseller == null)
                {
                    return Unauthorized(new {
                        success = false,
                        message = "User is not a Reseller"
                    });
                }

                _logger.LogInformation($"Fetching reseller stats for {reseller.Username} (ID: {reseller.Id})");

                // Get aggregated stats using HierarchyService
                var stats = await _hierarchyService.GetResellerStatsAsync(reseller.Id);

                return Ok(new
                {
                    success = true,
                    message = "Reseller statistics retrieved successfully",
                    data = stats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching reseller statistics");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get dashboard statistics for Companies (channel usage, sub-users)
        /// Phase 5: Multi-Tenant Hierarchy
        /// </summary>
        [HttpGet("company-stats")]
        [Authorize(Roles = "Company")]
        public async Task<IActionResult> GetCompanyStats()
        {
            try
            {
                var username = User.Identity?.Name;
                if (string.IsNullOrEmpty(username))
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                var company = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == username && u.Role == "Company");

                if (company == null)
                {
                    return Unauthorized(new {
                        success = false,
                        message = "User is not a Company"
                    });
                }

                _logger.LogInformation($"Fetching company stats for {company.Username} (ID: {company.Id})");

                // Get company stats using HierarchyService
                var stats = await _hierarchyService.GetCompanyStatsAsync(company.Id);

                return Ok(new
                {
                    success = true,
                    message = "Company statistics retrieved successfully",
                    data = stats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching company statistics");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error",
                    error = ex.Message
                });
            }
        }
    }
}
