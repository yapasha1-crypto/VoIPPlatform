using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Service for calculating dynamic sell rates from base rates and tariff plans
    /// Implements the core pricing logic for the VoIP platform
    /// </summary>
    public class RateCalculatorService : IRateCalculatorService
    {
        private readonly VoIPDbContext _context;

        public RateCalculatorService(VoIPDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Calculate sell price using tariff plan rules
        /// Formula: SellPrice = BuyPrice + Profit (with Min/Max constraints)
        /// </summary>
        public decimal CalculateSellPrice(BaseRate baseRate, TariffPlan tariffPlan)
        {
            if (tariffPlan.Type == PricingType.Free)
            {
                return 0m;
            }

            decimal profit;

            if (tariffPlan.Type == PricingType.Percentage)
            {
                // Calculate percentage-based profit
                profit = baseRate.BuyPrice * (tariffPlan.ProfitPercent / 100m);
            }
            else // PricingType.Fixed
            {
                // Use fixed profit amount
                profit = tariffPlan.FixedProfit;
            }

            // Apply min/max profit constraints
            if (profit < tariffPlan.MinProfit)
            {
                profit = tariffPlan.MinProfit;
            }
            else if (profit > tariffPlan.MaxProfit)
            {
                profit = tariffPlan.MaxProfit;
            }

            decimal sellPrice = baseRate.BuyPrice + profit;

            // Apply rounding precision
            sellPrice = Math.Round(sellPrice, tariffPlan.Precision);

            return sellPrice;
        }

        /// <summary>
        /// Get all base rates with calculated sell prices based on tariff plan
        /// </summary>
        public async Task<List<ConfiguredRateDto>> GetConfiguredRatesAsync(int tariffPlanId)
        {
            var tariffPlan = await _context.TariffPlans
                .FirstOrDefaultAsync(tp => tp.Id == tariffPlanId);

            if (tariffPlan == null)
            {
                throw new InvalidOperationException($"Tariff plan with ID {tariffPlanId} not found");
            }

            var baseRates = await _context.BaseRates
                .OrderBy(br => br.DestinationName)
                .ToListAsync();

            var configuredRates = new List<ConfiguredRateDto>();

            foreach (var baseRate in baseRates)
            {
                var sellPrice = CalculateSellPrice(baseRate, tariffPlan);
                var profit = sellPrice - baseRate.BuyPrice;
                var profitMarginPercent = baseRate.BuyPrice > 0
                    ? (profit / baseRate.BuyPrice) * 100m
                    : 0m;

                configuredRates.Add(new ConfiguredRateDto
                {
                    BaseRateId = baseRate.Id,
                    DestinationName = baseRate.DestinationName,
                    Code = baseRate.Code,
                    BuyPrice = baseRate.BuyPrice,
                    SellPrice = sellPrice,
                    Profit = profit,
                    ProfitMarginPercent = Math.Round(profitMarginPercent, 2)
                });
            }

            return configuredRates;
        }

        /// <summary>
        /// Get rates for a specific user based on their assigned tariff plan
        /// If user has no tariff plan assigned, returns empty list
        /// </summary>
        public async Task<List<ConfiguredRateDto>> GetUserRatesAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.TariffPlan)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new InvalidOperationException($"User with ID {userId} not found");
            }

            if (user.TariffPlanId == null)
            {
                // User has no tariff plan assigned, return base rates with 0% markup
                var defaultPlan = await _context.TariffPlans
                    .FirstOrDefaultAsync(tp => tp.IsPredefined && tp.ProfitPercent == 0);

                if (defaultPlan == null)
                {
                    return new List<ConfiguredRateDto>();
                }

                return await GetConfiguredRatesAsync(defaultPlan.Id);
            }

            return await GetConfiguredRatesAsync(user.TariffPlanId.Value);
        }

        /// <summary>
        /// Get predefined tariff plans (0%, 10%, Free)
        /// </summary>
        public async Task<List<TariffPlan>> GetPredefinedPlansAsync()
        {
            return await _context.TariffPlans
                .Where(tp => tp.IsPredefined && tp.IsActive)
                .OrderBy(tp => tp.Name)
                .ToListAsync();
        }

        /// <summary>
        /// Get all active tariff plans (predefined + custom)
        /// </summary>
        public async Task<List<TariffPlan>> GetAllActivePlansAsync()
        {
            return await _context.TariffPlans
                .Where(tp => tp.IsActive)
                .OrderByDescending(tp => tp.IsPredefined)
                .ThenBy(tp => tp.Name)
                .ToListAsync();
        }

        /// <summary>
        /// Create a custom tariff plan
        /// </summary>
        public async Task<TariffPlan> CreateTariffPlanAsync(TariffPlan plan)
        {
            // Validate plan
            if (string.IsNullOrWhiteSpace(plan.Name))
            {
                throw new ArgumentException("Tariff plan name is required");
            }

            // Check for duplicate name
            var existingPlan = await _context.TariffPlans
                .FirstOrDefaultAsync(tp => tp.Name == plan.Name);

            if (existingPlan != null)
            {
                throw new InvalidOperationException($"A tariff plan with name '{plan.Name}' already exists");
            }

            // Set defaults
            plan.IsPredefined = false;
            plan.IsActive = true;
            plan.CreatedAt = DateTime.UtcNow;

            _context.TariffPlans.Add(plan);
            await _context.SaveChangesAsync();

            return plan;
        }
    }
}
