namespace VoIPPlatform.API.Models
{
    public class VoIPProvider
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string ApiUrl { get; set; }
        public required string ApiUsername { get; set; }
        public required string ApiPassword { get; set; }
        public bool IsActive { get; set; } = true;
        public int TimeoutSeconds { get; set; } = 30;
        public int MaxRetries { get; set; } = 3;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}