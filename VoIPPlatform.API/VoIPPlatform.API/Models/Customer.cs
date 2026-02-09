namespace VoIPPlatform.API.Models
{
    public class Customer
    {
        public int Id { get; set; }
        public required string Username { get; set; }
        public required string PasswordHash { get; set; }
        public string? PhoneNumber { get; set; }
        public int CountryCode { get; set; }
        public string? Timezone { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }
}

