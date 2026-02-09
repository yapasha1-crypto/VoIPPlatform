using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoIPPlatform.API.Models
{
    [Table("Reports")]
    public class Report
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("Account")]
        public int AccountId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(50)]
        public required string ReportType { get; set; } // Monthly, Annual, Custom, AccountStatement

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        // إحصائيات المكالمات
        public int TotalCalls { get; set; }
        public int CompletedCalls { get; set; }
        public int FailedCalls { get; set; }
        public long TotalCallDurationSeconds { get; set; }
        public decimal TotalCallCost { get; set; }

        // إحصائيات الرسائل
        public int TotalSMS { get; set; }
        public int SentSMS { get; set; }
        public int FailedSMS { get; set; }
        public decimal TotalSMSCost { get; set; }

        // الإيرادات والرصيد
        public decimal TotalRevenue { get; set; }
        public decimal StartingBalance { get; set; }
        public decimal EndingBalance { get; set; }
        public decimal TotalDeducted { get; set; }

        // معلومات إضافية
        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExportedAt { get; set; }

        [StringLength(100)]
        public string ExportFormat { get; set; } = "JSON"; // PDF, Excel, JSON

        // Navigation Properties
        public virtual Account? Account { get; set; }
    }
}
