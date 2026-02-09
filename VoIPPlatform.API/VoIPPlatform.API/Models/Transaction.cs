namespace VoIPPlatform.API.Models
{
    public class Transaction
    {
        public int Id { get; set; }
        public int AccountId { get; set; }
        public decimal Amount { get; set; }
        public required string Type { get; set; } // Deposit, Withdrawal, CallCost
        public required string Status { get; set; } // Pending, Completed, Failed
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Foreign Key
        public virtual Account? Account { get; set; }
    }
}
