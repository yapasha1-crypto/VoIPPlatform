using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using VoIPPlatform.API.Models;
using VoIPPlatform.API.Services;
using VoIPPlatform.API.Services.Auth;

namespace VoIPPlatform.API.Controllers
{
    /// <summary>
    /// المصادقة والتسجيل (Authentication & Authorization)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly VoIPDbContext _context;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IVoIPInfoCenterService _voipInfoCenterService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(VoIPDbContext context, IJwtTokenService jwtTokenService, IVoIPInfoCenterService voipInfoCenterService, ILogger<AuthController> logger)
        {
            _context = context;
            _jwtTokenService = jwtTokenService;
            _voipInfoCenterService = voipInfoCenterService;
            _logger = logger;
        }

        // Removed CreateAdmin for brevity - can be re-added if needed, focusing on User flow now.

        /// <summary>
        /// Public user registration (Username-based, auto-assigns Customer role)
        /// </summary>
        [HttpPost("register-public")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterPublic([FromBody] PublicRegisterRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Invalid request data" });

                // Check if username already exists
                var existingUsername = _context.Users.FirstOrDefault(u => u.Username.ToLower() == request.Username.ToLower());
                if (existingUsername != null)
                    return BadRequest(new { success = false, message = "Username is already taken" });

                // Check if email already exists
                var existingEmail = _context.Users.FirstOrDefault(u => u.Email.ToLower() == request.Email.ToLower());
                if (existingEmail != null)
                    return BadRequest(new { success = false, message = "Email is already registered" });

                // Parse FullName into FirstName and LastName
                var nameParts = request.FullName.Trim().Split(' ', 2);
                var firstName = nameParts[0];
                var lastName = nameParts.Length > 1 ? nameParts[1] : "";

                // Create new user
                var user = new User
                {
                    Username = request.Username.ToLower(), // Use chosen Username
                    Email = request.Email.ToLower(),
                    FirstName = firstName,
                    LastName = lastName,
                    PasswordHash = HashPassword(request.Password),
                    Role = "Customer", // Auto-assign Customer role
                    IsActive = true,
                    IsEmailVerified = false,
                    PhoneNumber = "",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("New public user registered - Username: {Username}, Email: {Email}", user.Username, user.Email);

                return Ok(new
                {
                    success = true,
                    message = "User created successfully",
                    data = new
                    {
                        id = user.Id,
                        username = user.Username,
                        email = user.Email,
                        fullName = user.FullName,
                        role = user.Role
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering public user");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An internal server error occurred"
                });
            }
        }

        /// <summary>
        /// تسجيل مستخدم جديد باسم مستخدم (Admin/Internal use)
        /// </summary>
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "بيانات الطلب غير صحيحة", messageEn = "Invalid request data" });

                // Check by Username
                var existingUser = _context.Users.FirstOrDefault(u => u.Username == request.Username);
                if (existingUser != null)
                    return BadRequest(new { success = false, message = "اسم المستخدم مسجل بالفعل", messageEn = "Username already exists" });

                var user = new User
                {
                    Username = request.Username.ToLower(),
                    Email = request.Email,
                    FirstName = request.FirstName ?? "",
                    LastName = request.LastName ?? "",
                    PhoneNumber = request.PhoneNumber ?? "",
                    PasswordHash = HashPassword(request.Password),
                    Role = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(request.Role?.ToLower() ?? "customer"),
                    IsActive = true,
                    IsEmailVerified = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("New user registered locally: {Username}", user.Username);

                // ✅ Register user in VoIPInfoCenter (Real sync)
                // LOCAL-ONLY MODE: External registration disabled.
                /*
                try 
                {
                    _logger.LogInformation("Creating external account for using Username: {Username}", user.Username);
                    // ... external call removed ...
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error creating external account for {Username}", user.Username);
                }
                */

                return Ok(new
                {
                    success = true,
                    message = "تم التسجيل بنجاح",
                    data = new
                    {
                        id = user.Id,
                        username = user.Username,
                        role = user.Role
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering user");
                return StatusCode(500, new
                {
                    success = false,
                    message = "حدث خطأ داخلي",
                    messageEn = "An internal server error occurred"
                });
            }
        }

        /// <summary>
        /// تسجيل دخول المستخدم باسم المستخدم
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "بيانات الطلب غير صحيحة", messageEn = "Invalid request data" });

                // Find by Username
                var user = _context.Users.FirstOrDefault(u => u.Username.ToLower() == request.Username.ToLower());

                if (user == null)
                {
                   _logger.LogWarning("Login failed: User {Username} not found.", request.Username);
                   return Unauthorized(new { success = false, message = "اسم المستخدم أو كلمة المرور غير صحيحة", messageEn = "Invalid username or password" });
                }

                // Debug Logging
                var inputHash = HashPassword(request.Password);
                _logger.LogInformation("Login Debug - User: {Username}", user.Username);
                _logger.LogInformation("Login Debug - Stored Hash: {StoredHash}", user.PasswordHash);
                _logger.LogInformation("Login Debug - Input Password Length: {Len}", request.Password.Length);
                _logger.LogInformation("Login Debug - Input Hash:  {InputHash}", inputHash);
                _logger.LogInformation("Login Debug - Match: {Match}", inputHash == user.PasswordHash);

                if (string.IsNullOrWhiteSpace(user.PasswordHash) || !VerifyPassword(request.Password, user.PasswordHash))
                    return Unauthorized(new { success = false, message = "اسم المستخدم أو كلمة المرور غير صحيحة", messageEn = "Invalid username or password" });

                if (!user.IsActive)
                    return Unauthorized(new { success = false, message = "الحساب معطل", messageEn = "Account is disabled" });

                user.LastLoginAt = DateTime.UtcNow;
                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                var token = _jwtTokenService.GenerateToken(user);

                _logger.LogInformation("Successful login: {Username}", user.Username);

                // Fetch balance from external API
                // LOCAL-ONLY MODE: External balance fetch disabled.
                /*
                decimal? balance = null;
                try
                {
                    balance = await _voipInfoCenterService.GetUserBalanceAsync(user.Username, request.Password);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to fetch balance on login");
                }
                
                if (balance.HasValue) 
                {
                    user.AccountBalance = balance.Value;
                    _context.Users.Update(user);
                    await _context.SaveChangesAsync();
                }
                */

                return Ok(new
                {
                    success = true,
                    message = "تم الدخول بنجاح",
                    data = new
                    {
                        token = token,
                        username = user.Username, // Add explicit username property for frontend convenience
                        balance = user.AccountBalance, // Return fetched balance or fallback to stored
                        accessKey = request.Password, // Return password for client-side external API usage
                        user = new
                        {
                            id = user.Id,
                            username = user.Username,
                            role = user.Role
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging in");
                return StatusCode(500, new
                {
                    success = false,
                    message = "حدث خطأ داخلي",
                    messageEn = "An internal server error occurred"
                });
            }
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private bool VerifyPassword(string password, string hash)
        {
            var hashOfInput = HashPassword(password);
            return hashOfInput == hash;
        }

        public class RegisterRequest
        {
            [Required(ErrorMessage = "اسم المستخدم مطلوب")]
            [StringLength(40, MinimumLength = 4, ErrorMessage = "اسم المستخدم يجب أن يكون بين 4 و 40 حرف")]
            [RegularExpression(@"^[a-zA-Z0-9_\-\.\@]+$", ErrorMessage = "اسم المستخدم يحتوي على أحرف غير مسموحة")]
            public required string Username { get; set; }

            [Required(ErrorMessage = "كلمة المرور مطلوبة")]
            [StringLength(100, MinimumLength = 4, ErrorMessage = "كلمة المرور يجب أن تكون 4 أحرف على الأقل")]
            public required string Password { get; set; }

            [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
            [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
            public required string Email { get; set; }

            public string? FirstName { get; set; }
            public string? LastName { get; set; }
            public string? PhoneNumber { get; set; }
            public string? CountryCode { get; set; }
            public string? Role { get; set; }
        }

        public class PublicRegisterRequest
        {
            [Required(ErrorMessage = "Full name is required")]
            [StringLength(100, MinimumLength = 3, ErrorMessage = "Full name must be between 3 and 100 characters")]
            public required string FullName { get; set; }

            [Required(ErrorMessage = "Username is required")]
            [StringLength(40, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 40 characters")]
            [RegularExpression(@"^[a-zA-Z0-9_\-\.]+$", ErrorMessage = "Username can only contain letters, numbers, underscore, dash, and dot")]
            public required string Username { get; set; }

            [Required(ErrorMessage = "Email is required")]
            [EmailAddress(ErrorMessage = "Invalid email format")]
            public required string Email { get; set; }

            [Required(ErrorMessage = "Password is required")]
            [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters")]
            public required string Password { get; set; }
        }

        public class LoginRequest
        {
            [Required(ErrorMessage = "اسم المستخدم مطلوب")]
            public required string Username { get; set; }

            [Required(ErrorMessage = "كلمة المرور مطلوبة")]
            public required string Password { get; set; }
        }
        /// <summary>
        /// تغيير كلمة المرور للمستخدم الحالي
        /// </summary>
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                var username = User.Identity?.Name;
                if (string.IsNullOrEmpty(username)) return Unauthorized();

                var user = _context.Users.FirstOrDefault(u => u.Username == username);
                if (user == null) return Unauthorized();

                // 1. Verify Old Password Locally
                if (string.IsNullOrWhiteSpace(user.PasswordHash) || !VerifyPassword(request.OldPassword, user.PasswordHash))
                {
                    return BadRequest(new { success = false, message = "كلمة المرور القديمة غير صحيحة", messageEn = "Invalid old password" });
                }

                // 2. Change Password Externally
                var externalSuccess = await _voipInfoCenterService.ChangePasswordAsync(user.Username, request.OldPassword, request.NewPassword);
                if (!externalSuccess)
                {
                    return BadRequest(new { success = false, message = "فشل تغيير كلمة المرور في السيرفر الخارجي", messageEn = "Failed to change password on external server" });
                }

                // 3. Update Local Password
                user.PasswordHash = HashPassword(request.NewPassword);
                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Password changed successfully for {Username}", user.Username);

                return Ok(new { success = true, message = "تم تغيير كلمة المرور بنجاح", messageEn = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password");
                return StatusCode(500, new { success = false, message = "حدث خطأ داخلي", messageEn = "Internal server error" });
            }
        }

        /// <summary>
        /// الحصول على بيانات المستخدم الحالي (مع تحديث الرصيد)
        /// </summary>
        /// <summary>
        /// Purge Database and Reset MasterAdmin (Maintenance Mode)
        /// </summary>
        [HttpPost("purge-and-reset")]
        [AllowAnonymous]
        public async Task<IActionResult> PurgeAndReset()
        {
            try
            {
                try { _context.Invoices.RemoveRange(_context.Invoices); } catch {}
                try { _context.Reports.RemoveRange(_context.Reports); } catch {}
                try { _context.Transactions.RemoveRange(_context.Transactions); } catch {}
                try { _context.SMS.RemoveRange(_context.SMS); } catch {}
                try { _context.Calls.RemoveRange(_context.Calls); } catch {}
                try { _context.ContactNumbers.RemoveRange(_context.ContactNumbers); } catch {}
                try { _context.AuditLogs.RemoveRange(_context.AuditLogs); } catch {}
                
                await _context.SaveChangesAsync(); // Commit leafs first

                try { _context.Accounts.RemoveRange(_context.Accounts); } catch {}
                try { _context.CustomerAccounts.RemoveRange(_context.CustomerAccounts); } catch {}
                await _context.SaveChangesAsync(); // Commit Accounts

                _context.Users.RemoveRange(_context.Users);
                
                await _context.SaveChangesAsync(); // Commit Users

                // 2. Seed MasterAdmin (Mixed Case, Admin Role)
                using (var sha256 = System.Security.Cryptography.SHA256.Create())
                {
                    var password = "MasterPass123!";
                    var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                    var passwordHash = Convert.ToBase64String(hashedBytes);

                    var masterAdmin = new User
                    {
                        Username = "MasterAdmin", // Rule B: Preserve Mixed Case
                        Email = "master@beroea.com",
                        FirstName = "Master",
                        LastName = "Admin",
                        Role = "Admin", // Rule: Ensure Admin Role
                        PasswordHash = passwordHash,
                        IsActive = true,
                        IsEmailVerified = true,
                        CreatedAt = DateTime.UtcNow,
                        AccountBalance = 0,
                        PhoneNumber = "1234567890"
                    };

                    _context.Users.Add(masterAdmin);
                    await _context.SaveChangesAsync();

                    // Rule: Create Linked Account to prevent 404s
                    var masterAccount = new Account
                    {
                        UserId = masterAdmin.Id,
                        Balance = 0,
                        VirtualPhoneNumber = "1000", // Required
                        AccountType = "VoIP",
                        CountryCode = "US",
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };
                    _context.Accounts.Add(masterAccount);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { success = true, message = "Database purged and MasterAdmin reset." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Purge Failed");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Seed fake call records for current user (Development/Testing)
        /// </summary>
        [HttpPost("seed-call-records")]
        [Authorize]
        public async Task<IActionResult> SeedCallRecords()
        {
            try
            {
                var username = User.Identity?.Name;
                if (string.IsNullOrEmpty(username)) return Unauthorized();

                var user = _context.Users.FirstOrDefault(u => u.Username == username);
                if (user == null) return Unauthorized();

                // Remove existing call records for this user
                var existingRecords = _context.CallRecords.Where(cr => cr.UserId == user.Id);
                _context.CallRecords.RemoveRange(existingRecords);
                await _context.SaveChangesAsync();

                // Generate 20-30 random call records
                var random = new Random();
                var recordCount = random.Next(20, 31);
                var statuses = new[] { "Answered", "Busy", "Failed", "NoAnswer" };
                var phoneNumbers = new[] { "+14155551234", "+442071234567", "+33123456789", "+61291234567", "+81312345678" };

                for (int i = 0; i < recordCount; i++)
                {
                    var status = statuses[random.Next(statuses.Length)];
                    var duration = status == "Answered" ? random.Next(30, 1800) : 0; // 30s to 30min for answered calls
                    var costPerSecond = 0.02m; // $0.02 per second
                    var cost = status == "Answered" ? duration * costPerSecond : 0;

                    var callRecord = new CallRecord
                    {
                        UserId = user.Id,
                        CallerId = user.PhoneNumber ?? "+19999999999",  // Default if user has no phone
                        CalleeId = phoneNumbers[random.Next(phoneNumbers.Length)],
                        StartTime = DateTime.UtcNow.AddDays(-random.Next(1, 30)).AddHours(-random.Next(0, 24)),
                        Duration = duration,
                        Cost = Math.Round(cost, 2),
                        Status = status
                    };

                    _context.CallRecords.Add(callRecord);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Seeded {Count} call records for user {Username}", recordCount, username);

                return Ok(new
                {
                    success = true,
                    message = $"Seeded {recordCount} call records successfully",
                    count = recordCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding call records");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            try
            {
                var username = User.Identity?.Name;
                if (string.IsNullOrEmpty(username)) return Unauthorized();

                var user = _context.Users.FirstOrDefault(u => u.Username == username);
                if (user == null) return Unauthorized();

                // Fetch fresh balance (Try without password as Reseller)
                // LOCAL-ONLY MODE: External balance refresh disabled.
                /*
                decimal? balance = null;
                try 
                {
                    balance = await _voipInfoCenterService.GetUserBalanceAsync(user.Username);
                    if (balance.HasValue && balance.Value != user.AccountBalance)
                    {
                        user.AccountBalance = balance.Value;
                        _context.Users.Update(user);
                        await _context.SaveChangesAsync();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to refresh balance in GetMe");
                }
                */
                
                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        id = user.Id,
                        username = user.Username,
                        email = user.Email,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        phoneNumber = user.PhoneNumber,
                        balance = user.AccountBalance,
                        role = user.Role
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user details");
                return StatusCode(500, new { success = false, message = "Internal Error" });
            }
        }
        
        // ... (Existing private methods) ...
        
        public class ChangePasswordRequest
        {
            [Required]
            public required string OldPassword { get; set; }

            [Required]
            [StringLength(100, MinimumLength = 4)]
            public required string NewPassword { get; set; }
        }

    }
}