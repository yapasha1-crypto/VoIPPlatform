namespace VoIPPlatform.API.Models
{
    /// <summary>
    /// Payment Transaction - Top-up & Invoice System (Phase 7)
    /// Tracks all payments made by users with tax calculation and PDF invoices
    /// </summary>
    public class Payment
    {
        public int Id { get; set; }

        // Foreign Key to User
        public int UserId { get; set; }

        // Amount Before Tax (Subtotal)
        public decimal Amount { get; set; }

        // Calculated Tax Amount (Based on Country)
        // Sweden: 25% VAT | EU (with Tax ID): 0% | International: 0%
        public decimal TaxAmount { get; set; } = 0.00m;

        // Total Amount Paid (Amount + TaxAmount)
        public decimal TotalPaid { get; set; }

        // Payment Method: "CreditCard", "Stripe", "PayPal", "BankTransfer"
        public string PaymentMethod { get; set; } = "CreditCard";

        // Payment Status: "Pending", "Completed", "Failed", "Refunded"
        public string Status { get; set; } = "Pending";

        // Transaction Timestamp
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

        // Unique Invoice Number (e.g., "INV-2026-000001")
        public string InvoiceNumber { get; set; } = string.Empty;

        // Path to Generated PDF Invoice (e.g., "/invoices/123/INV-2026-000001.pdf")
        public string? InvoicePdfPath { get; set; }

        // Optional: Payment Gateway Transaction ID (Stripe, PayPal, etc.)
        public string? ExternalTransactionId { get; set; }

        // Optional: Notes or Description
        public string? Notes { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ==================== Navigation Properties ====================

        // Parent User
        public virtual User User { get; set; } = null!;
    }
}
