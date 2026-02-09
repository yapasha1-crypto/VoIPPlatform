using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Controllers
{
    /// <summary>
    /// مراقب إدارة المستخدمين
    /// Users Management Controller
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        // خدمة قاعدة البيانات
        private readonly VoIPDbContext _context;
        private readonly ILogger<UsersController> _logger;

        // Constructor - يتم حقنه من Program.cs
        public UsersController(VoIPDbContext context, ILogger<UsersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// الحصول على جميع المستخدمين
        /// Get all users
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<object>>> GetAllUsers()
        {
            try
            {
                _logger.LogInformation("جاري جلب قائمة المستخدمين - Fetching all users");

                var users = await _context.Users
                    .Select(u => new
                    {
                        u.Id,
                        u.Email,
                        u.FirstName,
                        u.LastName,
                        u.PhoneNumber,
                        u.IsEmailVerified,
                        u.IsActive,
                        u.CreatedAt,
                        AccountBalance = u.Accounts.Sum(a => a.Balance),
                        Role = u.Role ?? "Customer"
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    message = "تم جلب المستخدمين بنجاح - Users fetched successfully",
                    count = users.Count,
                    data = users
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "خطأ في جلب المستخدمين - Error fetching users");
                return StatusCode(500, new
                {
                    success = false,
                    message = "حدث خطأ في الخادم - Internal server error",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// الحصول على مستخدم واحد بـ ID
        /// Get user by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<object>> GetUserById(int id)
        {
            try
            {
                _logger.LogInformation($"جاري البحث عن المستخدم {id} - Fetching user {id}");

                var user = await _context.Users
                    .Where(u => u.Id == id)
                    .Select(u => new
                    {
                        u.Id,
                        u.Email,
                        u.FirstName,
                        u.LastName,
                        u.PhoneNumber,
                        u.IsEmailVerified,
                        u.IsActive,
                        u.CreatedAt,
                        u.AccountBalance,
                        AccountsCount = u.Accounts.Count,
                        CallsCount = u.Calls.Count
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = $"المستخدم {id} غير موجود - User {id} not found"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "تم جلب بيانات المستخدم بنجاح - User data fetched successfully",
                    data = user
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "خطأ في جلب بيانات المستخدم - Error fetching user");
                return StatusCode(500, new
                {
                    success = false,
                    message = "حدث خطأ في الخادم - Internal server error",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// إنشاء مستخدم جديد
        /// Create new user
        /// </summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<object>> CreateUser([FromBody] CreateUserRequest request)
        {
            try
            {
                // تحقق من صحة البيانات
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "البيانات المدخلة غير صحيحة - Invalid input data",
                        errors = ModelState.Values.SelectMany(v => v.Errors)
                    });
                }

                // تحقق من وجود البريد الإلكتروني
                if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "البريد الإلكتروني مسجل بالفعل - Email already registered"
                    });
                }

                // إنشاء مستخدم جديد
                var newUser = new User
                {
                    Email = request.Email,
                    Username = request.Email.Split('@')[0].ToLower(),
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PhoneNumber = request.PhoneNumber,
                    // في النسخة الحقيقية، يجب تشفير كلمة المرور
                    PasswordHash = request.Password, // TODO: Hash the password properly
                    IsEmailVerified = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    AccountBalance = 0
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"تم إنشاء مستخدم جديد: {newUser.Email} - New user created: {newUser.Email}");

                return CreatedAtAction(nameof(GetUserById), new { id = newUser.Id }, new
                {
                    success = true,
                    message = "تم إنشاء المستخدم بنجاح - User created successfully",
                    data = new
                    {
                        newUser.Id,
                        newUser.Email,
                        newUser.FirstName,
                        newUser.LastName,
                        newUser.CreatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "خطأ في إنشاء مستخدم جديد - Error creating user");
                return StatusCode(500, new
                {
                    success = false,
                    message = "حدث خطأ في الخادم - Internal server error",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// تحديث بيانات المستخدم
        /// Update user
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<object>> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = $"المستخدم {id} غير موجود - User {id} not found"
                    });
                }

                // تحديث البيانات
                if (!string.IsNullOrEmpty(request.FirstName))
                    user.FirstName = request.FirstName;

                if (!string.IsNullOrEmpty(request.LastName))
                    user.LastName = request.LastName;

                if (!string.IsNullOrEmpty(request.PhoneNumber))
                    user.PhoneNumber = request.PhoneNumber;

                user.UpdatedAt = DateTime.UtcNow;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"تم تحديث المستخدم {id} - User {id} updated");

                return Ok(new
                {
                    success = true,
                    message = "تم تحديث بيانات المستخدم بنجاح - User updated successfully",
                    data = user
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "خطأ في تحديث المستخدم - Error updating user");
                return StatusCode(500, new
                {
                    success = false,
                    message = "حدث خطأ في الخادم - Internal server error",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// حذف مستخدم
        /// Delete user
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<object>> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = $"المستخدم {id} غير موجود - User {id} not found"
                    });
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"تم حذف المستخدم {id} - User {id} deleted");

                return Ok(new
                {
                    success = true,
                    message = "تم حذف المستخدم بنجاح - User deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "خطأ في حذف المستخدم - Error deleting user");
                return StatusCode(500, new
                {
                    success = false,
                    message = "حدث خطأ في الخادم - Internal server error",
                    error = ex.Message
                });
            }
        }
    }

    // ==========================================
    // Request DTOs (Data Transfer Objects)
    // ==========================================

    /// <summary>
    /// نموذج إنشاء مستخدم جديد
    /// </summary>
    public class CreateUserRequest
    {
        [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
        [EmailAddress(ErrorMessage = "البريد الإلكتروني غير صحيح")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "كلمة المرور مطلوبة")]
        [MinLength(6, ErrorMessage = "كلمة المرور يجب أن تكون 6 أحرف على الأقل")]
        public required string Password { get; set; }

        [Required(ErrorMessage = "الاسم الأول مطلوب")]
        public required string FirstName { get; set; }

        [Required(ErrorMessage = "اسم العائلة مطلوب")]
        public required string LastName { get; set; }

        public string? PhoneNumber { get; set; }
    }

    /// <summary>
    /// نموذج تحديث بيانات المستخدم
    /// </summary>
    public class UpdateUserRequest
    {
        public string? FirstName { get; set; }

        public string? LastName { get; set; }

        public string? PhoneNumber { get; set; }
    }
}

