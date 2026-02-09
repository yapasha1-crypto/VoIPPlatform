namespace VoIPPlatform.API.DTOs
{
    public class VoIPPhoneNumberRequest
    {
        public required string ResellerUsername { get; set; }
        public required string ResellerPassword { get; set; }
        public required string PhoneNumber { get; set; }
    }
}

