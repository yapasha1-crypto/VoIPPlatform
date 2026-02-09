using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoIPPlatform.API.Models
{
    public class Call
    {
        [Key]
        public int Id { get; set; }

        // Foreign Keys
        [Required]
        public int AccountId { get; set; }

        [Required]
        public int UserId { get; set; }

        // Caller Information
        [Required]
        [StringLength(20)]
        public required string CallerNumber { get; set; }

        [Required]
        [StringLength(20)]
        public required string ReceiverNumber { get; set; }

        [Required]
        [StringLength(5)]
        public string CountryCode { get; set; } = "SA";

        // Call Duration (in seconds)
        [Required]
        public int DurationSeconds { get; set; }

        // Call Status
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Completed"; // "Completed", "Failed", "Missed", "Declined"

        // Recording
        [StringLength(500)]
        public string? RecordingUrl { get; set; } // ✅ يقبل NULL الآن

        [Required]
        public bool IsRecorded { get; set; } = false;

        // Cost
        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Cost { get; set; }

        // Timestamps
        [Required]
        public DateTime StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        // Notes
        [StringLength(500)]
        public string? Notes { get; set; }

        // Navigation Properties
        [ForeignKey("AccountId")]
        public virtual Account? Account { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
