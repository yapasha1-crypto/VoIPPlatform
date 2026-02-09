using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoIPPlatform.API.Models
{
    [Table("AuditLogs")]
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }

        public int? UserId { get; set; }
        public virtual User? User { get; set; }

        [Required]
        [StringLength(100)]
        public string Action { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string EntityName { get; set; } = string.Empty; // e.g., SystemSetting, User, Invoice

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [StringLength(50)]
        public string? IPAddress { get; set; }

        public string? Changes { get; set; } // JSON string of old vs new values
    }
}
