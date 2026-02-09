
namespace VoIPPlatform.API.DTOs
{
    public class AuditLogDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string? IPAddress { get; set; }
        public string? Changes { get; set; }
    }
}
