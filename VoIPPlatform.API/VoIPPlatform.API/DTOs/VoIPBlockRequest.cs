namespace VoIPPlatform.API.DTOs
{
    public class VoIPBlockRequest
    {
        public required string ResellerUsername { get; set; }
        public required string ResellerPassword { get; set; }
        public bool IsBlocked { get; set; }
    }
}

