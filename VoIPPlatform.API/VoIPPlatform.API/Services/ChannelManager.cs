using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Service for managing channel capacity and concurrent call limits
    /// Implements hierarchy-aware channel checking (User → Company → Reseller)
    /// </summary>
    public class ChannelManager : IChannelManager
    {
        private readonly VoIPDbContext _context;
        private readonly ILogger<ChannelManager> _logger;

        public ChannelManager(VoIPDbContext context, ILogger<ChannelManager> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Checks if a user can start a new call based on channel capacity
        /// Logic: If user belongs to a Company, check Company's capacity
        ///        If user is independent, check their own capacity
        /// </summary>
        public async Task<bool> CanStartCallAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning($"User {userId} not found for channel check");
                    return false;
                }

                // Determine which entity to check for capacity
                User entityToCheck = user;

                // If user belongs to a Company, check the Company's capacity instead
                if (user.Role == "User" && user.ParentUserId.HasValue)
                {
                    var company = await _context.Users.FindAsync(user.ParentUserId.Value);
                    if (company != null && company.Role == "Company")
                    {
                        entityToCheck = company;
                        _logger.LogInformation($"User {userId} belongs to Company {company.Id}. Checking company capacity.");
                    }
                }

                // Check if capacity is available
                bool canStart = entityToCheck.ActiveCalls < entityToCheck.MaxConcurrentCalls;

                _logger.LogInformation(
                    $"Channel Check - Entity: {entityToCheck.Role} (ID: {entityToCheck.Id}), " +
                    $"Active: {entityToCheck.ActiveCalls}, Max: {entityToCheck.MaxConcurrentCalls}, " +
                    $"Can Start: {canStart}"
                );

                return canStart;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking channel capacity for user {userId}");
                return false;
            }
        }

        /// <summary>
        /// Increments the active call counter
        /// If user belongs to a Company, increments the Company's counter
        /// </summary>
        public async Task IncrementActiveCallsAsync(int userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    throw new InvalidOperationException($"User {userId} not found");
                }

                // Determine which entity to increment
                User entityToIncrement = user;

                // If user belongs to a Company, increment Company's counter
                if (user.Role == "User" && user.ParentUserId.HasValue)
                {
                    var company = await _context.Users.FindAsync(user.ParentUserId.Value);
                    if (company != null && company.Role == "Company")
                    {
                        entityToIncrement = company;
                    }
                }

                // Increment active calls
                entityToIncrement.ActiveCalls++;
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation(
                    $"Incremented ActiveCalls for {entityToIncrement.Role} {entityToIncrement.Id} " +
                    $"(Now: {entityToIncrement.ActiveCalls}/{entityToIncrement.MaxConcurrentCalls})"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Error incrementing active calls for user {userId}");
                throw;
            }
        }

        /// <summary>
        /// Decrements the active call counter
        /// If user belongs to a Company, decrements the Company's counter
        /// </summary>
        public async Task DecrementActiveCallsAsync(int userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    throw new InvalidOperationException($"User {userId} not found");
                }

                // Determine which entity to decrement
                User entityToDecrement = user;

                // If user belongs to a Company, decrement Company's counter
                if (user.Role == "User" && user.ParentUserId.HasValue)
                {
                    var company = await _context.Users.FindAsync(user.ParentUserId.Value);
                    if (company != null && company.Role == "Company")
                    {
                        entityToDecrement = company;
                    }
                }

                // Decrement active calls (don't go below 0)
                if (entityToDecrement.ActiveCalls > 0)
                {
                    entityToDecrement.ActiveCalls--;
                }
                else
                {
                    _logger.LogWarning(
                        $"ActiveCalls already at 0 for {entityToDecrement.Role} {entityToDecrement.Id}"
                    );
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation(
                    $"Decremented ActiveCalls for {entityToDecrement.Role} {entityToDecrement.Id} " +
                    $"(Now: {entityToDecrement.ActiveCalls}/{entityToDecrement.MaxConcurrentCalls})"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Error decrementing active calls for user {userId}");
                throw;
            }
        }

        /// <summary>
        /// Gets the number of available channels
        /// </summary>
        public async Task<int> GetAvailableChannelsAsync(int userId)
        {
            var info = await GetChannelInfoAsync(userId);
            return info.AvailableChannels;
        }

        /// <summary>
        /// Gets detailed channel information
        /// </summary>
        public async Task<ChannelInfo> GetChannelInfoAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.ParentUser)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new InvalidOperationException($"User {userId} not found");
            }

            // Determine which entity controls the capacity
            User capacityEntity = user;
            bool isCompanyUser = false;
            int? companyId = null;
            string companyName = string.Empty;

            if (user.Role == "User" && user.ParentUserId.HasValue)
            {
                var company = await _context.Users.FindAsync(user.ParentUserId.Value);
                if (company != null && company.Role == "Company")
                {
                    capacityEntity = company;
                    isCompanyUser = true;
                    companyId = company.Id;
                    companyName = company.FullName;
                }
            }

            int available = Math.Max(0, capacityEntity.MaxConcurrentCalls - capacityEntity.ActiveCalls);
            double utilization = capacityEntity.MaxConcurrentCalls > 0
                ? (double)capacityEntity.ActiveCalls / capacityEntity.MaxConcurrentCalls * 100
                : 0;

            return new ChannelInfo
            {
                UserId = user.Id,
                UserRole = user.Role,
                MaxConcurrentCalls = capacityEntity.MaxConcurrentCalls,
                ActiveCalls = capacityEntity.ActiveCalls,
                AvailableChannels = available,
                UtilizationPercentage = Math.Round(utilization, 2),
                IsCompanyUser = isCompanyUser,
                CompanyId = companyId,
                CompanyName = companyName
            };
        }
    }
}
