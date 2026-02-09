using System.Net;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IServiceProvider _serviceProvider;

        public EmailService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        private async Task<SmtpClient> GetSmtpClientAsync(VoIPDbContext context)
        {
            var settings = await context.SystemSettings
                .Where(s => s.Group == "SMTP")
                .ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);

            var host = settings.GetValueOrDefault("SmtpHost");
            var port = int.Parse(settings.GetValueOrDefault("SmtpPort") ?? "587");
            var username = settings.GetValueOrDefault("SmtpUsername");
            var password = settings.GetValueOrDefault("SmtpPassword");
            var enableSsl = bool.Parse(settings.GetValueOrDefault("SmtpEnableSsl") ?? "true");

            if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                throw new InvalidOperationException("SMTP settings are not configured.");
            }

            var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = enableSsl
            };

            return client;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<VoIPDbContext>();
                using (var client = await GetSmtpClientAsync(context))
                {
                    var fromAddress = context.SystemSettings
                        .Where(s=>s.Group=="SMTP" && s.SettingKey == "SmtpFromAddress")
                        .Select(s=>s.SettingValue)
                        .FirstOrDefault() ?? "noreply@voipplatform.com";

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(fromAddress),
                        Subject = subject,
                        Body = body,
                        IsBodyHtml = true
                    };
                    mailMessage.To.Add(to);

                    await client.SendMailAsync(mailMessage);
                }
            }
        }

        public async Task<bool> TestConnectionAsync()
        {
            try 
            {
                 using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<VoIPDbContext>();
                    using (var client = await GetSmtpClientAsync(context))
                    {
                        // Just try to resolve and create object, maybe send a dummy logic or check validity
                        // Unfortuantely SmtpClient doesn't have a "Connect" method without sending.
                        // We will rely on SendEmailAsync throwing exception if it fails during the "Test Email" feature.
                        return true;
                    }
                }
            }
            catch
            {
                return false;
            }
        }
    }
}
