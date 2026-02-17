using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoIPPlatform.API.Models
{
    /// <summary>
    /// Phase 7: One line item per destination on an invoice.
    /// Example: "Calls to UK – 42.5 min × $0.00700/min = $0.29750"
    /// </summary>
    [Table("InvoiceLineItems")]
    public class InvoiceLineItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int InvoiceId { get; set; }
        public virtual Invoice? Invoice { get; set; }

        /// <summary>Human-readable label, e.g. "Calls to United Kingdom"</summary>
        [Required]
        public string Description { get; set; } = string.Empty;

        /// <summary>Total minutes called to this destination</summary>
        [Column(TypeName = "decimal(18,5)")]
        public decimal Quantity { get; set; }

        /// <summary>Rate per minute (SellPrice from user's TariffPlan)</summary>
        [Column(TypeName = "decimal(18,5)")]
        public decimal UnitPrice { get; set; }

        /// <summary>Quantity × UnitPrice — pre-computed and stored for invoice integrity</summary>
        [Column(TypeName = "decimal(18,5)")]
        public decimal Total { get; set; }
    }
}
