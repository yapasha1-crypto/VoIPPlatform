namespace VoIPPlatform.API.Models
{
    public class Tariff
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Currency { get; set; } = "USD";
        public List<Rate> Rates { get; set; } = new List<Rate>();
    }
}
