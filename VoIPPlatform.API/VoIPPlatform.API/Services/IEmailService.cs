using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
        Task<bool> TestConnectionAsync();
    }
}
