namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Interface for managing hierarchical relationships between Users, Companies, and Resellers
    /// </summary>
    public interface IHierarchyService
    {
        /// <summary>
        /// Gets all child user IDs recursively for a given user (Reseller or Company)
        /// </summary>
        /// <param name="userId">Parent user ID (Reseller or Company)</param>
        /// <returns>List of all child user IDs</returns>
        Task<List<int>> GetAllChildUserIdsAsync(int userId);

        /// <summary>
        /// Gets all child users with full details
        /// </summary>
        /// <param name="userId">Parent user ID</param>
        /// <returns>List of child users</returns>
        Task<List<UserHierarchyDto>> GetAllChildUsersAsync(int userId);

        /// <summary>
        /// Gets aggregated statistics for a Reseller (all companies and users)
        /// </summary>
        /// <param name="resellerId">Reseller user ID</param>
        /// <returns>Aggregated statistics</returns>
        Task<ResellerStatsDto> GetResellerStatsAsync(int resellerId);

        /// <summary>
        /// Gets statistics for a Company (all sub-users)
        /// </summary>
        /// <param name="companyId">Company user ID</param>
        /// <returns>Company statistics</returns>
        Task<CompanyStatsDto> GetCompanyStatsAsync(int companyId);

        /// <summary>
        /// Validates if a user can be set as parent (prevents circular references)
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="parentUserId">Proposed parent user ID</param>
        /// <returns>True if valid, False if circular reference detected</returns>
        Task<bool> CanSetParentAsync(int userId, int parentUserId);

        /// <summary>
        /// Gets the root reseller for a given user
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>Reseller user ID or null</returns>
        Task<int?> GetRootResellerIdAsync(int userId);
    }

    // DTOs for Hierarchy Service
    public class UserHierarchyDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int? ParentUserId { get; set; }
        public int? ResellerId { get; set; }
        public int MaxConcurrentCalls { get; set; }
        public int ActiveCalls { get; set; }
        public decimal AccountBalance { get; set; }
        public bool IsActive { get; set; }
    }

    public class ResellerStatsDto
    {
        public int ResellerId { get; set; }
        public string ResellerName { get; set; } = string.Empty;
        public int TotalCompanies { get; set; }
        public int TotalUsers { get; set; }
        public int TotalChannelCapacity { get; set; }
        public int TotalActiveChannels { get; set; }
        public double ChannelUtilizationPercentage { get; set; }
        public int TotalCallsToday { get; set; }
        public decimal TotalRevenueToday { get; set; }
        public decimal TotalBalance { get; set; }
    }

    public class CompanyStatsDto
    {
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public int TotalUsers { get; set; }
        public int MaxConcurrentCalls { get; set; }
        public int ActiveCalls { get; set; }
        public int AvailableChannels { get; set; }
        public double ChannelUtilizationPercentage { get; set; }
        public int TotalCallsToday { get; set; }
        public decimal TotalCostToday { get; set; }
        public decimal CompanyBalance { get; set; }
        public string BillingType { get; set; } = string.Empty;
        public decimal ChannelRate { get; set; }
    }
}
