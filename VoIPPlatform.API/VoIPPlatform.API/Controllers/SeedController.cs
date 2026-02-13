using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Controllers
{
    /// <summary>
    /// Controller for seeding test data (Development/Testing only)
    /// Phase 5: Hierarchy & Multi-Tenant Test Data Generation
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly VoIPDbContext _context;
        private readonly ILogger<SeedController> _logger;

        public SeedController(VoIPDbContext context, ILogger<SeedController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Seeds the database with hierarchical test users (Reseller → Company → User)
        /// Phase 5: Creates complete hierarchy for testing multi-tenant features
        /// </summary>
        [HttpPost("hierarchy")]
        [AllowAnonymous] // Allow without auth for easy testing
        public async Task<IActionResult> SeedHierarchy()
        {
            try
            {
                var createdUsers = new List<object>();
                var skippedUsers = new List<string>();

                _logger.LogInformation("Starting hierarchy seed process...");

                // ==================== 1. CREATE RESELLER ====================
                var resellerUsername = "reseller";
                var existingReseller = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == resellerUsername);

                User reseller;
                if (existingReseller != null)
                {
                    reseller = existingReseller;
                    skippedUsers.Add($"Reseller '{resellerUsername}' already exists (ID: {reseller.Id})");
                    _logger.LogInformation("Reseller already exists, using existing user");
                }
                else
                {
                    reseller = new User
                    {
                        Username = resellerUsername,
                        Email = "reseller@voipplatform.com",
                        FirstName = "Demo",
                        LastName = "Reseller",
                        PasswordHash = HashPassword("Password123!"),
                        Role = "Reseller",
                        IsActive = true,
                        IsEmailVerified = true,
                        PhoneNumber = "+1-555-RESELLER",
                        CreatedAt = DateTime.UtcNow,
                        AccountBalance = 50000.00m, // Large balance for reseller
                        // Hierarchy fields (Phase 5)
                        ParentUserId = null, // Resellers have no parent
                        ResellerId = null,   // Will be set to own ID after creation
                        MaxConcurrentCalls = 100, // High capacity for reseller
                        ActiveCalls = 0,
                        BillingType = "PerChannel",
                        ChannelRate = 10.00m
                    };

                    _context.Users.Add(reseller);
                    await _context.SaveChangesAsync();

                    // Set ResellerId to own ID (self-reference)
                    reseller.ResellerId = reseller.Id;
                    await _context.SaveChangesAsync();

                    createdUsers.Add(new
                    {
                        id = reseller.Id,
                        username = reseller.Username,
                        role = reseller.Role,
                        password = "Password123!",
                        maxConcurrentCalls = reseller.MaxConcurrentCalls,
                        billingType = reseller.BillingType
                    });

                    _logger.LogInformation($"Created Reseller: {reseller.Username} (ID: {reseller.Id})");
                }

                // ==================== 2. CREATE COMPANY ====================
                var companyUsername = "company";
                var existingCompany = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == companyUsername);

                User company;
                if (existingCompany != null)
                {
                    company = existingCompany;
                    skippedUsers.Add($"Company '{companyUsername}' already exists (ID: {company.Id})");
                    _logger.LogInformation("Company already exists, using existing user");
                }
                else
                {
                    company = new User
                    {
                        Username = companyUsername,
                        Email = "company@voipplatform.com",
                        FirstName = "XYZ",
                        LastName = "Call Center",
                        PasswordHash = HashPassword("Password123!"),
                        Role = "Company",
                        IsActive = true,
                        IsEmailVerified = true,
                        PhoneNumber = "+1-555-COMPANY",
                        CreatedAt = DateTime.UtcNow,
                        AccountBalance = 10000.00m,
                        // Hierarchy fields (Phase 5)
                        ParentUserId = reseller.Id, // Company belongs to Reseller
                        ResellerId = reseller.Id,    // Denormalized reference
                        MaxConcurrentCalls = 10,     // Company has 10 channels
                        ActiveCalls = 0,             // Start with no active calls
                        BillingType = "PerChannel",  // Billed per channel
                        ChannelRate = 10.00m         // $10/channel/month
                    };

                    _context.Users.Add(company);
                    await _context.SaveChangesAsync();

                    createdUsers.Add(new
                    {
                        id = company.Id,
                        username = company.Username,
                        role = company.Role,
                        password = "Password123!",
                        parentUserId = company.ParentUserId,
                        resellerId = company.ResellerId,
                        maxConcurrentCalls = company.MaxConcurrentCalls,
                        billingType = company.BillingType
                    });

                    _logger.LogInformation($"Created Company: {company.Username} (ID: {company.Id}, Parent: {reseller.Id})");
                }

                // ==================== 3. CREATE AGENT (User under Company) ====================
                var agentUsername = "agent";
                var existingAgent = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == agentUsername);

                if (existingAgent != null)
                {
                    skippedUsers.Add($"Agent '{agentUsername}' already exists (ID: {existingAgent.Id})");
                    _logger.LogInformation("Agent already exists, skipping");
                }
                else
                {
                    var agent = new User
                    {
                        Username = agentUsername,
                        Email = "agent@voipplatform.com",
                        FirstName = "John",
                        LastName = "Agent",
                        PasswordHash = HashPassword("Password123!"),
                        Role = "User",
                        IsActive = true,
                        IsEmailVerified = true,
                        PhoneNumber = "+1-555-AGENT-01",
                        CreatedAt = DateTime.UtcNow,
                        AccountBalance = 500.00m,
                        // Hierarchy fields (Phase 5)
                        ParentUserId = company.Id,   // Agent belongs to Company
                        ResellerId = reseller.Id,    // Denormalized reference
                        MaxConcurrentCalls = 1,      // Standard users have 1 channel
                        ActiveCalls = 0,
                        BillingType = "PerUsage",    // Billed per usage
                        ChannelRate = 0.00m          // No per-channel rate
                    };

                    _context.Users.Add(agent);
                    await _context.SaveChangesAsync();

                    createdUsers.Add(new
                    {
                        id = agent.Id,
                        username = agent.Username,
                        role = agent.Role,
                        password = "Password123!",
                        parentUserId = agent.ParentUserId,
                        resellerId = agent.ResellerId,
                        maxConcurrentCalls = agent.MaxConcurrentCalls,
                        billingType = agent.BillingType
                    });

                    _logger.LogInformation($"Created Agent: {agent.Username} (ID: {agent.Id}, Parent: {company.Id})");
                }

                // ==================== 4. CREATE INDEPENDENT USER ====================
                var independentUsername = "user";
                var existingIndependent = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == independentUsername);

                if (existingIndependent != null)
                {
                    skippedUsers.Add($"Independent User '{independentUsername}' already exists (ID: {existingIndependent.Id})");
                    _logger.LogInformation("Independent user already exists, skipping");
                }
                else
                {
                    var independentUser = new User
                    {
                        Username = independentUsername,
                        Email = "user@voipplatform.com",
                        FirstName = "Jane",
                        LastName = "Independent",
                        PasswordHash = HashPassword("Password123!"),
                        Role = "User",
                        IsActive = true,
                        IsEmailVerified = true,
                        PhoneNumber = "+1-555-INDEP-01",
                        CreatedAt = DateTime.UtcNow,
                        AccountBalance = 250.00m,
                        // Hierarchy fields (Phase 5)
                        ParentUserId = null,         // No parent (independent)
                        ResellerId = null,           // No reseller
                        MaxConcurrentCalls = 1,      // Standard users have 1 channel
                        ActiveCalls = 0,
                        BillingType = "PerUsage",    // Billed per usage
                        ChannelRate = 0.00m          // No per-channel rate
                    };

                    _context.Users.Add(independentUser);
                    await _context.SaveChangesAsync();

                    createdUsers.Add(new
                    {
                        id = independentUser.Id,
                        username = independentUser.Username,
                        role = independentUser.Role,
                        password = "Password123!",
                        parentUserId = independentUser.ParentUserId,
                        resellerId = independentUser.ResellerId,
                        maxConcurrentCalls = independentUser.MaxConcurrentCalls,
                        billingType = independentUser.BillingType
                    });

                    _logger.LogInformation($"Created Independent User: {independentUser.Username} (ID: {independentUser.Id})");
                }

                // ==================== SUMMARY ====================
                var summary = new
                {
                    success = true,
                    message = "Hierarchy seeding completed",
                    created = createdUsers,
                    skipped = skippedUsers,
                    totalCreated = createdUsers.Count,
                    totalSkipped = skippedUsers.Count,
                    hierarchy = new
                    {
                        reseller = new
                        {
                            id = reseller.Id,
                            username = reseller.Username,
                            role = reseller.Role,
                            companies = new[] {
                                new {
                                    id = company.Id,
                                    username = company.Username,
                                    role = company.Role,
                                    maxChannels = company.MaxConcurrentCalls,
                                    users = createdUsers
                                        .Where(u => u.GetType().GetProperty("parentUserId")?.GetValue(u)?.Equals(company.Id) == true)
                                        .ToList()
                                }
                            }
                        }
                    },
                    instructions = new
                    {
                        loginCredentials = "All users have password: Password123!",
                        testReseller = "Login with username: reseller / password: Password123!",
                        testCompany = "Login with username: company / password: Password123!",
                        testAgent = "Login with username: agent / password: Password123!",
                        testIndependent = "Login with username: user / password: Password123!"
                    }
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding hierarchy");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error seeding hierarchy",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Hash password using SHA256 (matches AuthController implementation)
        /// </summary>
        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        /// <summary>
        /// Seeds the database with realistic base rates for testing Phase 6
        /// Phase 6: Creates 20 sample destinations with varied pricing
        /// </summary>
        [HttpPost("rates")]
        [AllowAnonymous] // Allow without auth for easy testing
        public async Task<IActionResult> SeedRates([FromQuery] bool clear = false)
        {
            try
            {
                _logger.LogInformation("Starting rates seed process...");

                // Check if base rates already exist
                var existingRatesCount = await _context.BaseRates.CountAsync();

                if (existingRatesCount > 0 && !clear)
                {
                    return Ok(new
                    {
                        success = false,
                        message = $"Base rates already exist ({existingRatesCount} rates). Use ?clear=true to replace them.",
                        existingCount = existingRatesCount
                    });
                }

                // Clear existing rates if requested
                if (clear && existingRatesCount > 0)
                {
                    _logger.LogWarning($"Clearing {existingRatesCount} existing base rates...");
                    var existingRates = await _context.BaseRates.ToListAsync();
                    _context.BaseRates.RemoveRange(existingRates);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Existing rates cleared");
                }

                // ==================== CREATE SAMPLE BASE RATES ====================
                var sampleRates = new List<BaseRate>
                {
                    // Low-cost destinations
                    new BaseRate { DestinationName = "USA", Code = "1", BuyPrice = 0.00500m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "Canada", Code = "1", BuyPrice = 0.00600m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "UK - Fixed", Code = "44", BuyPrice = 0.01200m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "UK - Mobile", Code = "447", BuyPrice = 0.02500m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "Germany", Code = "49", BuyPrice = 0.01500m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "France", Code = "33", BuyPrice = 0.01800m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "Spain", Code = "34", BuyPrice = 0.01400m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "Sweden", Code = "46", BuyPrice = 0.01000m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "Sweden - Mobile", Code = "467", BuyPrice = 0.02200m, CreatedAt = DateTime.UtcNow },

                    // Medium-cost destinations
                    new BaseRate { DestinationName = "Australia", Code = "61", BuyPrice = 0.03500m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "UAE", Code = "971", BuyPrice = 0.04200m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "Saudi Arabia", Code = "966", BuyPrice = 0.04500m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "India - Fixed", Code = "91", BuyPrice = 0.02800m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "India - Mobile", Code = "917", BuyPrice = 0.03200m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "Pakistan", Code = "92", BuyPrice = 0.05500m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "Egypt", Code = "20", BuyPrice = 0.06000m, CreatedAt = DateTime.UtcNow },

                    // Higher-cost destinations
                    new BaseRate { DestinationName = "Afghanistan", Code = "93", BuyPrice = 0.08500m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "Somalia", Code = "252", BuyPrice = 0.12000m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "South Sudan", Code = "211", BuyPrice = 0.15000m, CreatedAt = DateTime.UtcNow },
                    new BaseRate { DestinationName = "Satellite", Code = "881", BuyPrice = 0.95000m, CreatedAt = DateTime.UtcNow }
                };

                await _context.BaseRates.AddRangeAsync(sampleRates);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Successfully seeded {sampleRates.Count} base rates");

                // Calculate statistics
                var avgRate = sampleRates.Average(r => r.BuyPrice);
                var minRate = sampleRates.Min(r => r.BuyPrice);
                var maxRate = sampleRates.Max(r => r.BuyPrice);

                return Ok(new
                {
                    success = true,
                    message = "Base rates seeded successfully",
                    seeded = sampleRates.Select(r => new
                    {
                        destination = r.DestinationName,
                        code = r.Code,
                        buyPrice = r.BuyPrice
                    }).ToList(),
                    totalSeeded = sampleRates.Count,
                    statistics = new
                    {
                        averageBuyPrice = Math.Round(avgRate, 5),
                        lowestBuyPrice = minRate,
                        highestBuyPrice = maxRate
                    },
                    instructions = new
                    {
                        testNow = "Go to /dashboard/rates/configure and select a tariff plan to see calculated sell rates",
                        createCustomPlan = "Click 'Add New Rate List' to create custom pricing rules",
                        assignToUser = "Use POST /api/rates/assign-plan to assign a tariff plan to a user"
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding base rates");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error seeding base rates",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        /// <summary>
        /// Clears all users except Admin (WARNING: Destructive operation)
        /// </summary>
        [HttpPost("clear-hierarchy")]
        [AllowAnonymous]
        public async Task<IActionResult> ClearHierarchy()
        {
            try
            {
                _logger.LogWarning("Clearing hierarchy data...");

                // Delete all users except Admins
                var usersToDelete = await _context.Users
                    .Where(u => u.Role != "Admin")
                    .ToListAsync();

                _context.Users.RemoveRange(usersToDelete);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Hierarchy cleared (Admins preserved)",
                    deletedCount = usersToDelete.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing hierarchy");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error clearing hierarchy",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Clears all base rates (WARNING: Destructive operation)
        /// Phase 6: Removes all base rates for clean testing
        /// </summary>
        [HttpPost("clear-rates")]
        [AllowAnonymous]
        public async Task<IActionResult> ClearRates()
        {
            try
            {
                _logger.LogWarning("Clearing all base rates...");

                var ratesToDelete = await _context.BaseRates.ToListAsync();
                _context.BaseRates.RemoveRange(ratesToDelete);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "All base rates cleared",
                    deletedCount = ratesToDelete.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing base rates");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error clearing base rates",
                    error = ex.Message
                });
            }
        }
    }
}
