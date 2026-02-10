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
    }
}
