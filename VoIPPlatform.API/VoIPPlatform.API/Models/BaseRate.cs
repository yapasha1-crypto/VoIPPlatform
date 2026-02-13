using System.ComponentModel.DataAnnotations.Schema;

namespace VoIPPlatform.API.Models
{
    /// <summary>
    /// Base Rates (Buy Rates) - The wholesale prices we pay for calls to different destinations
    /// These are used as the foundation for calculating Sell Rates based on TariffPlan rules
    /// </summary>
    public class BaseRate
    {
        public int Id { get; set; }

        /// <summary>
        /// Destination Name (e.g., "Afghanistan", "Sweden Mobile", "USA")
        /// </summary>
        public string DestinationName { get; set; } = string.Empty;

        /// <summary>
        /// Destination Code (e.g., "93" for Afghanistan, "46" for Sweden)
        /// Used for call routing and rate matching
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Buy Price - The cost we pay per minute to the upstream provider
        /// This is the wholesale rate before any profit margin is applied
        /// </summary>
        [Column(TypeName = "decimal(18, 5)")]
        public decimal BuyPrice { get; set; }

        /// <summary>
        /// Creation timestamp for tracking when the rate was added/updated
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update timestamp
        /// </summary>
        public DateTime? UpdatedAt { get; set; }
    }
}
