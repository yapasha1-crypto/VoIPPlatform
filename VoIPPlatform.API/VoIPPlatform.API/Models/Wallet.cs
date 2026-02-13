namespace VoIPPlatform.API.Models
{
    /// <summary>
    /// User Wallet - Pre-paid Balance System (Phase 7)
    /// Each user has one wallet that tracks their balance
    /// </summary>
    public class Wallet
    {
        public int Id { get; set; }

        // Foreign Key to User (One-to-One)
        public int UserId { get; set; }

        // Current Balance (Decimal precision for financial accuracy)
        public decimal Balance { get; set; } = 0.00m;

        // Currency Code (ISO 4217: USD, EUR, SEK, etc.)
        public string Currency { get; set; } = "USD";

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // ==================== Navigation Properties ====================

        // Parent User (One-to-One)
        public virtual User User { get; set; } = null!;
    }
}
