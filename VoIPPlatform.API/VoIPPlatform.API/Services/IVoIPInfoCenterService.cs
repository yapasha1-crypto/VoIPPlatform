using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    public interface IVoIPInfoCenterService
    {
        Task<(bool Success, string Error)> CreateCustomerAsync(string username, string password, string? phoneNumber = null, string countryCode = "752", string initialBalance = "0", string? timezone = null, int tariffId = -3);
        Task<bool> ChangePasswordAsync(string username, string oldPassword, string newPassword);
        Task<decimal?> GetUserBalanceAsync(string username, string? password = null);
        Task<bool> AddTransactionAsync(string username, decimal amount);
        Task<List<ExternalCallRecord>> GetCallOverviewAsync(string username, string password);
        
        // New Methods for Full Integration
        Task<bool> AddPhoneNumberAsync(string username, string phoneNumber);
        Task<bool> DeletePhoneNumberAsync(string username, string phoneNumber);
        Task<(bool Success, string Message)> SetCustomerBlockStatusAsync(string username, bool isBlocked);
        Task<bool> ValidateUserAsync(string username, string password);
        Task<bool> ResetPasswordAsync(string username, string newPassword);
    }

    public class ExternalCallRecord
    {
        public string CallId { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Source { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public int Duration { get; set; }
        public decimal Cost { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
