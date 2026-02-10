using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Service for managing hierarchical relationships and querying data across the hierarchy
    /// </summary>
    public class HierarchyService : IHierarchyService
    {
        private readonly VoIPDbContext _context;
        private readonly ILogger<HierarchyService> _logger;

        public HierarchyService(VoIPDbContext context, ILogger<HierarchyService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Gets all child user IDs recursively
        /// </summary>
        public async Task<List<int>> GetAllChildUserIdsAsync(int userId)
        {
            var childIds = new List<int>();
            await GetChildIdsRecursive(userId, childIds);
            return childIds;
        }

        /// <summary>
        /// Recursive helper to get all descendant user IDs
        /// </summary>
        private async Task GetChildIdsRecursive(int parentId, List<int> accumulator)
        {
            var directChildren = await _context.Users
                .Where(u => u.ParentUserId == parentId)
                .Select(u => u.Id)
                .ToListAsync();

            accumulator.AddRange(directChildren);

            foreach (var childId in directChildren)
            {
                await GetChildIdsRecursive(childId, accumulator);
            }
        }

        /// <summary>
        /// Gets all child users with full details
        /// </summary>
        public async Task<List<UserHierarchyDto>> GetAllChildUsersAsync(int userId)
        {
            var childIds = await GetAllChildUserIdsAsync(userId);

            var users = await _context.Users
                .Where(u => childIds.Contains(u.Id))
                .Select(u => new UserHierarchyDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    FullName = u.FullName,
                    Email = u.Email,
                    Role = u.Role,
                    ParentUserId = u.ParentUserId,
                    ResellerId = u.ResellerId,
                    MaxConcurrentCalls = u.MaxConcurrentCalls,
                    ActiveCalls = u.ActiveCalls,
                    AccountBalance = u.AccountBalance,
                    IsActive = u.IsActive
                })
                .ToListAsync();

            return users;
        }

        /// <summary>
        /// Gets aggregated statistics for a Reseller
        /// </summary>
        public async Task<ResellerStatsDto> GetResellerStatsAsync(int resellerId)
        {
            try
            {
                var reseller = await _context.Users.FindAsync(resellerId);
                if (reseller == null || reseller.Role != "Reseller")
                {
                    throw new InvalidOperationException($"User {resellerId} is not a Reseller");
                }

                // Get all child user IDs (Companies and Users under this Reseller)
                var childIds = await GetAllChildUserIdsAsync(resellerId);

                // Get all companies under this reseller
                var companies = await _context.Users
                    .Where(u => u.ResellerId == resellerId && u.Role == "Company")
                    .ToListAsync();

                // Get all users (including companies)
                var allUsers = await _context.Users
                    .Where(u => childIds.Contains(u.Id))
                    .ToListAsync();

                // Calculate total channel capacity (sum of all companies' MaxConcurrentCalls)
                int totalCapacity = companies.Sum(c => c.MaxConcurrentCalls);

                // Calculate total active channels (sum of all companies' ActiveCalls)
                int totalActive = companies.Sum(c => c.ActiveCalls);

                // Calculate utilization percentage
                double utilization = totalCapacity > 0
                    ? (double)totalActive / totalCapacity * 100
                    : 0;

                // Get calls today for all child users
                var today = DateTime.UtcNow.Date;
                var callsToday = await _context.CallRecords
                    .Where(cr => childIds.Contains(cr.UserId) && cr.StartTime >= today)
                    .ToListAsync();

                int totalCallsToday = callsToday.Count;
                decimal totalRevenueToday = callsToday.Sum(cr => cr.Cost);

                // Calculate total balance across all users
                decimal totalBalance = allUsers.Sum(u => u.AccountBalance);

                return new ResellerStatsDto
                {
                    ResellerId = resellerId,
                    ResellerName = reseller.FullName,
                    TotalCompanies = companies.Count,
                    TotalUsers = allUsers.Count(u => u.Role == "User"),
                    TotalChannelCapacity = totalCapacity,
                    TotalActiveChannels = totalActive,
                    ChannelUtilizationPercentage = Math.Round(utilization, 2),
                    TotalCallsToday = totalCallsToday,
                    TotalRevenueToday = totalRevenueToday,
                    TotalBalance = totalBalance
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting reseller stats for {resellerId}");
                throw;
            }
        }

        /// <summary>
        /// Gets statistics for a Company
        /// </summary>
        public async Task<CompanyStatsDto> GetCompanyStatsAsync(int companyId)
        {
            try
            {
                var company = await _context.Users.FindAsync(companyId);
                if (company == null || company.Role != "Company")
                {
                    throw new InvalidOperationException($"User {companyId} is not a Company");
                }

                // Get all users under this company
                var users = await _context.Users
                    .Where(u => u.ParentUserId == companyId && u.Role == "User")
                    .ToListAsync();

                // Get child user IDs
                var childIds = await GetAllChildUserIdsAsync(companyId);
                childIds.Add(companyId); // Include company itself

                // Get calls today
                var today = DateTime.UtcNow.Date;
                var callsToday = await _context.CallRecords
                    .Where(cr => childIds.Contains(cr.UserId) && cr.StartTime >= today)
                    .ToListAsync();

                int totalCallsToday = callsToday.Count;
                decimal totalCostToday = callsToday.Sum(cr => cr.Cost);

                // Calculate available channels
                int availableChannels = Math.Max(0, company.MaxConcurrentCalls - company.ActiveCalls);

                // Calculate utilization
                double utilization = company.MaxConcurrentCalls > 0
                    ? (double)company.ActiveCalls / company.MaxConcurrentCalls * 100
                    : 0;

                return new CompanyStatsDto
                {
                    CompanyId = companyId,
                    CompanyName = company.FullName,
                    TotalUsers = users.Count,
                    MaxConcurrentCalls = company.MaxConcurrentCalls,
                    ActiveCalls = company.ActiveCalls,
                    AvailableChannels = availableChannels,
                    ChannelUtilizationPercentage = Math.Round(utilization, 2),
                    TotalCallsToday = totalCallsToday,
                    TotalCostToday = totalCostToday,
                    CompanyBalance = company.AccountBalance,
                    BillingType = company.BillingType,
                    ChannelRate = company.ChannelRate
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting company stats for {companyId}");
                throw;
            }
        }

        /// <summary>
        /// Validates if setting a parent would create a circular reference
        /// </summary>
        public async Task<bool> CanSetParentAsync(int userId, int parentUserId)
        {
            if (userId == parentUserId)
            {
                return false; // Cannot be own parent
            }

            // Check if parentUserId is a descendant of userId
            var descendantIds = await GetAllChildUserIdsAsync(userId);
            return !descendantIds.Contains(parentUserId);
        }

        /// <summary>
        /// Gets the root reseller for a user by traversing up the hierarchy
        /// </summary>
        public async Task<int?> GetRootResellerIdAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return null;
            }

            // If user has ResellerId set, return it
            if (user.ResellerId.HasValue)
            {
                return user.ResellerId.Value;
            }

            // If user is a Reseller, return their own ID
            if (user.Role == "Reseller")
            {
                return user.Id;
            }

            // Traverse up the hierarchy to find Reseller
            var currentUserId = userId;
            for (int i = 0; i < 10; i++) // Max depth safety
            {
                var currentUser = await _context.Users.FindAsync(currentUserId);
                if (currentUser == null)
                {
                    break;
                }

                if (currentUser.Role == "Reseller")
                {
                    return currentUser.Id;
                }

                if (currentUser.ParentUserId.HasValue)
                {
                    currentUserId = currentUser.ParentUserId.Value;
                }
                else
                {
                    break;
                }
            }

            return null;
        }
    }
}
