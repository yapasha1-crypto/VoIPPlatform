using System.ComponentModel.DataAnnotations.Schema;

namespace VoIPPlatform.API.Models
{
    /// <summary>
    /// Pricing Type for Tariff Plans
    /// </summary>
    public enum PricingType
    {
        Percentage,  // Add percentage-based profit (e.g., +10%)
        Fixed,       // Add fixed amount per minute
        Free         // No charge (SellPrice = 0)
    }

    /// <summary>
    /// Tariff Plan - Defines pricing rules for calculating Sell Rates from Base Rates
    /// Instead of storing millions of duplicate rates, we calculate on-the-fly
    /// </summary>
    public class TariffPlan
    {
        public int Id { get; set; }

        /// <summary>
        /// Plan Name (e.g., "Gold", "Silver", "10% Profit", "Free List")
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Pricing Type: Percentage, Fixed, or Free
        /// </summary>
        public PricingType Type { get; set; } = PricingType.Percentage;

        /// <summary>
        /// Profit Percentage (e.g., 10.0 for 10%)
        /// Only used when Type = Percentage
        /// </summary>
        [Column(TypeName = "decimal(18, 2)")]
        public decimal ProfitPercent { get; set; } = 0m;

        /// <summary>
        /// Fixed Profit Amount per minute
        /// Only used when Type = Fixed
        /// </summary>
        [Column(TypeName = "decimal(18, 5)")]
        public decimal FixedProfit { get; set; } = 0m;

        /// <summary>
        /// Minimum Profit Floor - Ensures we never make less than this per minute
        /// </summary>
        [Column(TypeName = "decimal(18, 5)")]
        public decimal MinProfit { get; set; } = 0m;

        /// <summary>
        /// Maximum Profit Cap - Limits profit to avoid overpricing
        /// </summary>
        [Column(TypeName = "decimal(18, 5)")]
        public decimal MaxProfit { get; set; } = 999999m;

        /// <summary>
        /// Rounding Precision (e.g., 4 = round to 4 decimal places)
        /// </summary>
        public int Precision { get; set; } = 5;

        /// <summary>
        /// Billing Interval in seconds (e.g., 60 = charge per 60 seconds)
        /// Default: 60 seconds (1 minute)
        /// </summary>
        public int ChargingIntervalSeconds { get; set; } = 60;

        /// <summary>
        /// Is this a system-predefined plan? (0%, 10%, Free)
        /// Predefined plans cannot be deleted
        /// </summary>
        public bool IsPredefined { get; set; } = false;

        /// <summary>
        /// Is this plan active and available for assignment?
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Creation timestamp
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update timestamp
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Users assigned to this tariff plan
        /// </summary>
        public virtual ICollection<User> Users { get; set; } = new List<User>();
    }
}
