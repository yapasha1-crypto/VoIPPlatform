using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoIPPlatform.API.Models
{
    [Table("Invoices")]
    public class Invoice
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int AccountId { get; set; }
        public virtual Account? Account { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        public string Status { get; set; } = "Pending"; // Pending, Paid, Overdue, Cancelled

        public DateTime IssueDate { get; set; } = DateTime.UtcNow;
        public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(30);
        public DateTime? PaidDate { get; set; }

        public string? PaymentMethod { get; set; } // Credit Card, Bank Transfer, PayPal

        public string? Notes { get; set; }
    }
}
