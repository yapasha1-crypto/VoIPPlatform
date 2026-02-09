using System.ComponentModel.DataAnnotations;

namespace VoIPPlatform.API.DTOs
{
    /// <summary>
    /// DTO لإنشاء تقرير جديد
    /// </summary>
    public class CreateReportRequest
    {
        [Required(ErrorMessage = "معرّف الحساب مطلوب")]
        public int AccountId { get; set; }

        [Required(ErrorMessage = "معرّف المستخدم مطلوب")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "نوع التقرير مطلوب")]
        [StringLength(50)]
        public required string ReportType { get; set; } // Monthly, Annual, Custom, AccountStatement

        [Required(ErrorMessage = "تاريخ البداية مطلوب")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "تاريخ النهاية مطلوب")]
        public DateTime EndDate { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    /// <summary>
    /// DTO لتحديث تقرير
    /// </summary>
    public class UpdateReportRequest
    {
        public string? ReportType { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Notes { get; set; }
        public string? ExportFormat { get; set; }
    }

    /// <summary>
    /// DTO لعرض بيانات التقرير
    /// </summary>
    public class ReportResponseDto
    {
        public int Id { get; set; }
        public int AccountId { get; set; }
        public int UserId { get; set; }
        public required string ReportType { get; set; }
        public DateTime StartDate { get; set; }
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
        public string? Notes { get; set; }
        public DateTime GeneratedAt { get; set; }
        public DateTime? ExportedAt { get; set; }
        public required string ExportFormat { get; set; }

        // معلومات الحساب
        public string? AccountNumber { get; set; }
        public string? UserName { get; set; }
    }
}

