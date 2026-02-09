using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoIPPlatform.API.Models
{
    /// <summary>
    /// Call Detail Record (CDR) for historical call data
    /// </summary>
    [Table("CallRecords")]
    public class CallRecord
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        // Foreign Key
        [Required]
        public int UserId { get; set; }

        // Call Parties
        [Required]
        [StringLength(50)]
        public required string CallerId { get; set; }  // Source phone number

        [Required]
        [StringLength(50)]
        public required string CalleeId { get; set; }  // Destination phone number

        // Call Details
        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int Duration { get; set; }  // Duration in seconds

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Cost { get; set; }

        [Required]
        [StringLength(50)]
        public required string Status { get; set; }  // Answered, Busy, Failed, NoAnswer

        // Navigation Property
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
