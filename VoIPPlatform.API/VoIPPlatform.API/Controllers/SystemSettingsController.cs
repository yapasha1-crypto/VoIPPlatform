using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.DTOs;
using VoIPPlatform.API.Models;
using VoIPPlatform.API.Services;

namespace VoIPPlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class SystemSettingsController : ControllerBase
    {
        private readonly VoIPDbContext _context;
        private readonly IEmailService _emailService;

        public SystemSettingsController(VoIPDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // GET: api/SystemSettings/smtp
        [HttpGet("smtp")]
        public async Task<ActionResult<SmtpSettingsDto>> GetSmtpSettings()
        {
            var settings = await _context.SystemSettings
                .Where(s => s.Group == "SMTP")
                .ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);

            var dto = new SmtpSettingsDto
            {
                SmtpHost = settings.GetValueOrDefault("SmtpHost") ?? "",
                SmtpPort = int.TryParse(settings.GetValueOrDefault("SmtpPort"), out var port) ? port : 587,
                SmtpUsername = settings.GetValueOrDefault("SmtpUsername") ?? "",
                SmtpPassword = settings.GetValueOrDefault("SmtpPassword") ?? "",
                SmtpEnableSsl = bool.TryParse(settings.GetValueOrDefault("SmtpEnableSsl"), out var ssl) ? ssl : true,
                SmtpFromAddress = settings.GetValueOrDefault("SmtpFromAddress") ?? ""
            };

            return Ok(dto);
        }

        // POST: api/SystemSettings/smtp
        [HttpPost("smtp")]
        public async Task<IActionResult> UpdateSmtpSettings(SmtpSettingsDto dto)
        {
            await UpdateSetting("SmtpHost", dto.SmtpHost, "SMTP");
            await UpdateSetting("SmtpPort", dto.SmtpPort.ToString(), "SMTP");
            await UpdateSetting("SmtpUsername", dto.SmtpUsername, "SMTP");
            await UpdateSetting("SmtpPassword", dto.SmtpPassword, "SMTP");
            await UpdateSetting("SmtpEnableSsl", dto.SmtpEnableSsl.ToString(), "SMTP");
            await UpdateSetting("SmtpFromAddress", dto.SmtpFromAddress, "SMTP");

            var userId = int.Parse(User.FindFirst("id")?.Value ?? "0");
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                Action = "Updated SMTP Settings",
                EntityName = "SystemSettings",
                Timestamp = DateTime.UtcNow,
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Settings updated successfully" });
        }

        // POST: api/SystemSettings/test-email
        [HttpPost("test-email")]
        public async Task<IActionResult> TestEmail()
        {
            try
            {
                var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
                if (string.IsNullOrEmpty(adminEmail))
                {
                     // Fallback if claim is missing, though Authorize ensures user exists.
                     // Or send to a hardcoded test address if you prefer, but admin email is safer.
                     return BadRequest("Could not determine admin email address from token.");
                }
                
                // Alternatively, send to the "From" address just to test credentials
                // But usually we want to see it delivered.
                
                await _emailService.SendEmailAsync(adminEmail, "Test Email from VoIPPlatform", "<h1>Success!</h1><p>Your SMTP settings are working correctly.</p>");
                return Ok(new { message = $"Test email sent to {adminEmail}" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Failed to send email: {ex.Message}");
            }
        }

        private async Task UpdateSetting(string key, string value, string group)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == key && s.Group == group);
            if (setting == null)
            {
                setting = new SystemSetting { SettingKey = key, SettingValue = value, Group = group };
                _context.SystemSettings.Add(setting);
            }
            else
            {
                setting.SettingValue = value;
            }
        }

        // GET: api/SystemSettings/voip
        [HttpGet("voip")]
        public async Task<ActionResult<VoipSettingsDto>> GetVoipSettings()
        {
            var settings = await _context.SystemSettings
                .Where(s => s.Group == "VoIPProvider")
                .ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);

            var dto = new VoipSettingsDto
            {
                ProviderName = settings.GetValueOrDefault("ProviderName") ?? "VoIPInfoCenter",
                ApiUrl = settings.GetValueOrDefault("ApiUrl") ?? "https://www.voipinfocenter.com/API/Request.ashx",
                ApiUsername = settings.GetValueOrDefault("ApiUsername") ?? "",
                ApiPassword = settings.GetValueOrDefault("ApiPassword") ?? ""
            };

            return Ok(dto);
        }

        // POST: api/SystemSettings/voip
        [HttpPost("voip")]
        public async Task<IActionResult> UpdateVoipSettings(VoipSettingsDto dto)
        {
            await UpdateSetting("ProviderName", dto.ProviderName, "VoIPProvider");
            await UpdateSetting("ApiUrl", dto.ApiUrl, "VoIPProvider");
            await UpdateSetting("ApiUsername", dto.ApiUsername, "VoIPProvider");
            await UpdateSetting("ApiPassword", dto.ApiPassword, "VoIPProvider");

            var userId = int.Parse(User.FindFirst("id")?.Value ?? "0");
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                Action = "Updated VoIP Provider Settings",
                EntityName = "SystemSettings",
                Timestamp = DateTime.UtcNow,
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "VoIP settings updated successfully" });
        }
    }
}
