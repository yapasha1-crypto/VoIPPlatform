namespace VoIPPlatform.API.DTOs
{
    public class VoipSettingsDto
    {
        public string ProviderName { get; set; } = "VoIPInfoCenter"; // e.g. "VoIPInfoCenter" or "Twilio"
        public string ApiUrl { get; set; } = "https://www.voipinfocenter.com/API/Request.ashx";
        public string ApiUsername { get; set; } = string.Empty;
        public string ApiPassword { get; set; } = string.Empty;
    }
}
