namespace VoIPPlatform.API.DTOs
{
    public class VoIPResetPasswordRequest
    {
        public required string ResellerUsername { get; set; }
        public required string ResellerPassword { get; set; }
        public required string NewPassword { get; set; }
    }
}

