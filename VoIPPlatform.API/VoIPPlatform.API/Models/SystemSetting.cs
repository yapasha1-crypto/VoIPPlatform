using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoIPPlatform.API.Models
{
    [Table("SystemSettings")]
    public class SystemSetting
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string SettingKey { get; set; } = string.Empty;

        [Required]
        public string SettingValue { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Group { get; set; } = string.Empty; // e.g., SMTP, VoIPProvider, General
    }
}
