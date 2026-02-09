using System.ComponentModel.DataAnnotations.Schema;

namespace VoIPPlatform.API.Models
{
    public class Rate
    {
        public int Id { get; set; }
        
        public int TariffId { get; set; }
        [ForeignKey("TariffId")]
        public Tariff? Tariff { get; set; }

        public string Destination { get; set; } = string.Empty; // e.g., "Sweden Mobile"
        public string Prefix { get; set; } = string.Empty; // e.g., "467"
        
        [Column(TypeName = "decimal(18, 5)")] // High precision for rates
        public decimal Price { get; set; }
    }
}
