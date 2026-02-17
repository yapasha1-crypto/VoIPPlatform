using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoIPPlatform.API.Models
{
    /// <summary>
    /// Invoice status lifecycle
    /// </summary>
    public enum InvoiceStatus
    {
        Draft = 0,      // Being assembled, not yet sent to customer
        Unpaid = 1,     // Sent to customer, awaiting payment
        Paid = 2,       // Payment confirmed
        Overdue = 3,    // Past due date and still unpaid
        Cancelled = 4   // Voided / written off
    }

    /// <summary>
    /// Phase 7: Billing Invoice.
    /// One invoice per user per billing period, containing line items per destination.
    /// </summary>
    [Table("Invoices")]
    public class Invoice
    {
        [Key]
        public int Id { get; set; }

        // ── Primary billing relationship ──────────────────────────────────────
        [Required]
        public int UserId { get; set; }
        public virtual User? User { get; set; }

        // ── Legacy account FK (nullable – kept for backward compatibility) ─────
        public int? AccountId { get; set; }
        public virtual Account? Account { get; set; }

        // ── Billing period ────────────────────────────────────────────────────
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }

        // ── Financials (rate precision: 18,5) ─────────────────────────────────
        [Column(TypeName = "decimal(18,5)")]
        public decimal TotalAmount { get; set; }

        // ── Status ────────────────────────────────────────────────────────────
        // Stored as int in DB; cast to InvoiceStatus enum in code.
        public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

        // ── Timestamps ───────────────────────────────────────────────────────
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(30);
        public DateTime? PaidDate { get; set; }

        // ── PDF storage (populated after generation in Phase 7.3) ────────────
        public string? FilePath { get; set; }

        public string? Notes { get; set; }

        // ── Navigation ───────────────────────────────────────────────────────
        public virtual ICollection<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();
    }
}
