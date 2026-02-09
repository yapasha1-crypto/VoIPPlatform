namespace VoIPPlatform.API.DTOs
{
    public class VoIPChangePasswordRequest
    {
        public required string ResellerUsername { get; set; }
        public required string ResellerPassword { get; set; }
        public required string OldPassword { get; set; }
        public required string NewPassword { get; set; }
    }
}

