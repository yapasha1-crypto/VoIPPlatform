namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Interface for managing channel capacity and concurrent call limits
    /// </summary>
    public interface IChannelManager
    {
        /// <summary>
        /// Checks if a user can start a new call based on channel capacity
        /// For Users belonging to a Company, checks the Company's capacity
        /// </summary>
        /// <param name="userId">User ID attempting to start a call</param>
        /// <returns>True if call can be started, False if capacity exceeded</returns>
        Task<bool> CanStartCallAsync(int userId);

        /// <summary>
        /// Increments the active call counter for the user or their company
        /// </summary>
        /// <param name="userId">User ID starting the call</param>
        Task IncrementActiveCallsAsync(int userId);

        /// <summary>
        /// Decrements the active call counter for the user or their company
        /// </summary>
        /// <param name="userId">User ID ending the call</param>
        Task DecrementActiveCallsAsync(int userId);

        /// <summary>
        /// Gets the number of available channels for a user or company
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>Number of available channels</returns>
        Task<int> GetAvailableChannelsAsync(int userId);

        /// <summary>
        /// Gets detailed channel information for a user or company
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>Channel information object</returns>
        Task<ChannelInfo> GetChannelInfoAsync(int userId);
    }

    /// <summary>
    /// Channel capacity information
    /// </summary>
    public class ChannelInfo
    {
        public int UserId { get; set; }
        public string UserRole { get; set; } = string.Empty;
        public int MaxConcurrentCalls { get; set; }
        public int ActiveCalls { get; set; }
        public int AvailableChannels { get; set; }
        public double UtilizationPercentage { get; set; }
        public bool IsCompanyUser { get; set; }
        public int? CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
    }
}
