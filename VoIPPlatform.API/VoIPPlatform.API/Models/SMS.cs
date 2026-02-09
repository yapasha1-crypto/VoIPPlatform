using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoIPPlatform.API.Models
{
    [Table("SMS")]
    public class SMS
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("Account")]
        public int AccountId { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserId { get; set; }

        [Required]
        [Phone(ErrorMessage = "صيغة رقم المرسل غير صحيحة")]
        public required string SenderNumber { get; set; } // from

        [Required]
        [Phone(ErrorMessage = "صيغة رقم المستقبل غير صحيحة")]
        public required string RecipientNumber { get; set; } // to

        [Required]
        [StringLength(1000, ErrorMessage = "النص لا يمكن أن يتجاوز 1000 حرف")]
        public required string MessageContent { get; set; } // text

        public int MessageLength { get; set; } // عدد الأحرف

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Cost { get; set; } // التكلفة

        [StringLength(50)]
        public string? Status { get; set; } // Sent, Failed, Pending

        public DateTime CreatedAt { get; set; }

        public DateTime? SentAt { get; set; }

        [StringLength(500)]
        public string? ErrorMessage { get; set; }  // ✅ الآن nullable

        [StringLength(100)]
        public string? ExternalId { get; set; } // VoiceTrading Response ID

        // Navigation Properties
        public virtual Account? Account { get; set; }
        public virtual User? User { get; set; }
    }
}