using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// DTO for Configured Rate (BaseRate + Calculated SellPrice)
    /// </summary>
    public class ConfiguredRateDto
    {
        public int BaseRateId { get; set; }
        public string DestinationName { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public decimal BuyPrice { get; set; }
        public decimal SellPrice { get; set; }
        public decimal Profit { get; set; }
        public decimal ProfitMarginPercent { get; set; }
    }

    /// <summary>
    /// Service for calculating dynamic sell rates from base rates and tariff plans
    /// </summary>
    public interface IRateCalculatorService
    {
        /// <summary>
        /// Calculate sell price for a single base rate using tariff plan rules
        /// </summary>
        /// <param name="baseRate">The base rate (buy price)</param>
        /// <param name="tariffPlan">The tariff plan with pricing rules</param>
        /// <returns>Calculated sell price</returns>
        decimal CalculateSellPrice(BaseRate baseRate, TariffPlan tariffPlan);

        /// <summary>
        /// Get all base rates with calculated sell prices based on tariff plan
        /// </summary>
        /// <param name="tariffPlanId">The tariff plan ID to apply</param>
        /// <returns>List of configured rates with sell prices</returns>
        Task<List<ConfiguredRateDto>> GetConfiguredRatesAsync(int tariffPlanId);

        /// <summary>
        /// Get rates for a specific user based on their assigned tariff plan
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <returns>List of configured rates for the user</returns>
        Task<List<ConfiguredRateDto>> GetUserRatesAsync(int userId);

        /// <summary>
        /// Get predefined tariff plans (0%, 10%, Free)
        /// </summary>
        Task<List<TariffPlan>> GetPredefinedPlansAsync();

        /// <summary>
        /// Get all active tariff plans (predefined + custom)
        /// </summary>
        Task<List<TariffPlan>> GetAllActivePlansAsync();

        /// <summary>
        /// Create a custom tariff plan
        /// </summary>
        Task<TariffPlan> CreateTariffPlanAsync(TariffPlan plan);
    }
}
