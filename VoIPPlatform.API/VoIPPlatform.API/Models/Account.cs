using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoIPPlatform.API.Models
{
    [Table("Accounts")]
    public class Account
    {
        // معرّف فريد
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        // الاتصال مع المستخدم
        [Required]
        public int UserId { get; set; }
        public virtual User? User { get; set; }

        // رقم الهاتف الافتراضي
        [Required]
        [StringLength(20)]
        public required string VirtualPhoneNumber { get; set; }

        // نوع الحساب
        [StringLength(50)]
        public string? AccountType { get; set; } // "VoIP", "LocalNumber", "TollFree"

        // رمز الدولة
        [StringLength(5)]
        public string? CountryCode { get; set; }

        // حالة الحساب
        public bool IsActive { get; set; } = true;

        // الرصيد المتبقي
        public decimal Balance { get; set; } = 0;

        // استخدام شهري
        public decimal MonthlyUsage { get; set; } = 0;

        // التواريخ
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime RenewsAt { get; set; } = DateTime.UtcNow.AddMonths(1);
        public DateTime? DeactivatedAt { get; set; }

        // ==================== العلاقات ====================
        public virtual ICollection<Call> Calls { get; set; } = new List<Call>();
        public virtual ICollection<SMS> SMSMessages { get; set; } = new List<SMS>();
        public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
        public virtual ICollection<ContactNumber> ContactNumbers { get; set; } = new List<ContactNumber>();
        public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
    }
}
