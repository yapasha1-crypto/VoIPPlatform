using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using VoIPPlatform.API.Exceptions;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Controllers
{
    /// <summary>
    /// إدارة العملاء (Customers)
    /// </summary>
    /// <remarks>
    /// يوفر هذا الـ Controller عمليات إدارة كاملة للعملاء:
    /// - إنشاء عملاء جدد
    /// - جلب بيانات العملاء
    /// - تحديث بيانات العملاء
    /// - حذف العملاء
    /// </remarks>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CustomersController : ControllerBase
    {
        private readonly VoIPDbContext _context;
        private readonly ILogger<CustomersController> _logger;
        private readonly Services.IVoIPInfoCenterService _voipService;

        public CustomersController(VoIPDbContext context, ILogger<CustomersController> logger, Services.IVoIPInfoCenterService voipService)
        {
            _context = context;
            _logger = logger;
            _voipService = voipService;
        }

        /// <summary>
        /// إنشاء عميل جديد
        /// </summary>
        /// <remarks>
        /// ينشئ حساب عميل جديد محلياً وعلى خادم VoIP الخارجي
        /// </remarks>
        [HttpPost("create")]
        [Authorize(Roles = "Customer,Reseller,Admin")]
        public async Task<IActionResult> CreateCustomer([FromBody] VoIPCreateCustomerRequest request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data", "بيانات الطلب غير صحيحة");

            _logger.LogInformation("Creating customer: {CustomerUsername}", request.CustomerUsername);

            // تحقق من وجود العميل محلياً
            var existingCustomer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Username == request.CustomerUsername);

            if (existingCustomer != null)
                throw new BadRequestException(
                    "Username already exists",
                    "اسم العميل موجود بالفعل");

            // 1. إنشاء العميل على سيرفر VoIP الخارجي
            // تنظيف الرقم من أي + أو 0 في البداية لضمان الدمج الصحيح
            var cleanPhone = request.PhoneNumber.TrimStart('+').TrimStart('0');
            var fullPhoneNumber = $"+{request.CountryCode}{cleanPhone}";

            var result = await _voipService.CreateCustomerAsync(
                request.CustomerUsername,
                request.CustomerPassword,
                fullPhoneNumber,
                request.CountryCode.ToString(),
                "0", // الرصيد الأولي
                request.Timezone, // المنطقة الزمنية
                request.TariffRateId ?? -3 // التعرفة (Default -3)
            );

            if (!result.Success)
            {
                _logger.LogWarning("Failed to create customer on external VoIP Server: {User}. Reason: {Reason}", request.CustomerUsername, result.Error);
                throw new BadRequestException("External Server Error", $"فشل إنشاء الحساب على السيرفر الخارجي: {result.Error}");
            }

            // 2. إنشاء العميل محلياً (فقط إذا نجح الخارجي)
            var customer = new Customer
            {
                Username = request.CustomerUsername,
                PasswordHash = HashPassword(request.CustomerPassword),
                PhoneNumber = request.PhoneNumber,
                CountryCode = request.CountryCode,
                Timezone = request.Timezone,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Customer created successfully: {CustomerId}", customer.Id);

            return Ok(new
            {
                message = "تم إنشاء العميل بنجاح (محلياً وخارجياً)",
                customerId = customer.Id,
                customerUsername = customer.Username
            });
        }

        /// <summary>
        /// جلب جميع العملاء
        /// </summary>
        /// <remarks>
        /// يسترجع قائمة بجميع العملاء المسجلين في النظام
        /// </remarks>
        /// <returns>قائمة العملاء مع العدد الإجمالي</returns>
        /// <response code="200">تم جلب العملاء بنجاح</response>
        /// <response code="401">غير مصرح</response>
        [HttpGet]
        [Authorize(Roles = "Customer,Reseller,Admin")]
        public async Task<IActionResult> GetAllCustomers()
        {
            _logger.LogInformation("Fetching all customers");
            var customers = await Task.FromResult(_context.Customers.ToList());

            return Ok(new
            {
                message = "تم جلب جميع العملاء بنجاح",
                total = customers.Count,
                data = customers
            });
        }

        /// <summary>
        /// جلب بيانات عميل محدد
        /// </summary>
        /// <remarks>
        /// يسترجع بيانات عميل معين باستخدام معرّفه الفريد
        /// </remarks>
        /// <param name="id">معرّف العميل</param>
        /// <returns>بيانات العميل</returns>
        /// <response code="200">تم جلب بيانات العميل بنجاح</response>
        /// <response code="404">العميل غير موجود</response>
        /// <response code="401">غير مصرح</response>
        [HttpGet("{id}")]
        [Authorize(Roles = "Customer,Reseller,Admin")]
        public async Task<IActionResult> GetCustomer(int id)
        {
            var customer = await _context.Customers.FindAsync(id);

            if (customer == null)
                throw new NotFoundException("Customer", "العميل");

            _logger.LogInformation("Fetching customer: {CustomerId}", id);

            return Ok(new
            {
                message = "تم جلب بيانات العميل بنجاح",
                data = customer
            });
        }

        /// <summary>
        /// تحديث بيانات عميل
        /// </summary>
        /// <remarks>
        /// تحديث معلومات العميل مثل رقم الهاتف والمنطقة الزمنية
        /// 
        /// **مثال الطلب:**
        /// ```
        /// {
        ///   "phoneNumber": "+966501234567",
        ///   "timezone": "Asia/Riyadh"
        /// }
        /// ```
        /// </remarks>
        /// <param name="id">معرّف العميل</param>
        /// <param name="request">البيانات المطلوب تحديثها</param>
        /// <returns>رسالة النجاح</returns>
        /// <response code="200">تم تحديث بيانات العميل بنجاح</response>
        /// <response code="400">بيانات غير صحيحة</response>
        /// <response code="404">العميل غير موجود</response>
        /// <response code="401">غير مصرح</response>
        [HttpPut("{id}")]
        [Authorize(Roles = "Customer,Reseller,Admin")]
        public async Task<IActionResult> UpdateCustomer(int id, [FromBody] VoIPUpdateCustomerRequest request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data", "بيانات الطلب غير صحيحة");

            var customer = await _context.Customers.FindAsync(id);

            if (customer == null)
                throw new NotFoundException("Customer", "العميل");

            if (!string.IsNullOrEmpty(request.PhoneNumber))
                customer.PhoneNumber = request.PhoneNumber;

            if (!string.IsNullOrEmpty(request.Timezone))
                customer.Timezone = request.Timezone;

            customer.UpdatedAt = DateTime.UtcNow;

            _context.Customers.Update(customer);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Customer updated: {CustomerId}", id);

            return Ok(new { message = "تم تحديث بيانات العميل بنجاح" });
        }

        /// <summary>
        /// حذف عميل
        /// </summary>
        /// <remarks>
        /// حذف عميل من النظام بشكل نهائي
        /// ⚠️ هذه العملية غير قابلة للتراجع
        /// </remarks>
        /// <param name="id">معرّف العميل</param>
        /// <returns>رسالة النجاح</returns>
        /// <response code="200">تم حذف العميل بنجاح</response>
        /// <response code="404">العميل غير موجود</response>
        /// <response code="403">ليس لديك صلاحية</response>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            var customer = await _context.Customers.FindAsync(id);

            if (customer == null)
                throw new NotFoundException("Customer", "العميل");

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Customer deleted: {CustomerId}", id);

            return Ok(new { message = "تم حذف العميل بنجاح" });
        }

        // --- Phone Number Management ---

        [HttpPost("{id}/phones")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddPhoneNumber(int id, [FromBody] AddPhoneRequest request)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) throw new NotFoundException("Customer", "العميل");

            var result = await _voipService.AddPhoneNumberAsync(customer.Username, request.PhoneNumber);
            if (!result) throw new BadRequestException("External Error", "Failed to add phone number on VoIP Server.");

            _logger.LogInformation("Phone added to customer {User}: {Phone}", customer.Username, request.PhoneNumber);
            return Ok(new { message = "Phone number added successfully" });
        }

        [HttpDelete("{id}/phones/{phoneNumber}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePhoneNumber(int id, string phoneNumber)
        {
            // Decode phone number if it contains encoded characters (like + -> %2B)
            phoneNumber = Uri.UnescapeDataString(phoneNumber);

            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) throw new NotFoundException("Customer", "العميل");

            var result = await _voipService.DeletePhoneNumberAsync(customer.Username, phoneNumber);
            if (!result) throw new BadRequestException("External Error", "Failed to delete phone number on VoIP Server.");

            _logger.LogInformation("Phone deleted from customer {User}: {Phone}", customer.Username, phoneNumber);
            return Ok(new { message = "Phone number deleted successfully" });
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCustomerStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) throw new NotFoundException("Customer", "العميل");

            // IsActive = true means Blocked = false
            // IsActive = false means Blocked = true
            var isBlocked = !request.IsActive;

            // 1. Update External Service
            var voipResult = await _voipService.SetCustomerBlockStatusAsync(customer.Username, isBlocked);
            if (!voipResult.Success)
            {
                // Better to fail safe.
                throw new BadRequestException("External Error", $"Failed to update block status: {voipResult.Message}");
            }

            // 2. Update Local Database
            customer.IsActive = request.IsActive;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Customer {Id} status updated to Active={Status}", id, request.IsActive);

            return Ok(new { message = "Customer status updated successfully", isActive = customer.IsActive });
        }

        /// <summary>
        /// تشفير كلمة المرور
        /// </summary>
        /// <param name="password">كلمة المرور النصية</param>
        /// <returns>كلمة المرور المشفرة</returns>
        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }
        [HttpPatch("{id}/password")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ResetCustomerPassword(int id, [FromBody] ResetPasswordRequest request)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) throw new NotFoundException("Customer", "العميل");

            // 1. Update External Service
            var voipResult = await _voipService.ResetPasswordAsync(customer.Username, request.NewPassword);
            if (!voipResult)
            {
                throw new BadRequestException("External Error", "Failed to reset password on VoIP Server.");
            }

            // 2. Update Local Database
            customer.PasswordHash = HashPassword(request.NewPassword);
            customer.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Password reset for customer {Id} ({User})", id, customer.Username);

            return Ok(new { message = "Password reset successfully (Local & External)" });
        }
    }

    /// <summary>
    /// طلب إنشاء عميل جديد
    /// </summary>
    public class VoIPCreateCustomerRequest
    {
        /// <summary>اسم المستخدم للعميل</summary>
        [Required(ErrorMessage = "اسم العميل مطلوب")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "الاسم يجب أن يكون بين 3 و 50 حرف")]
        public required string CustomerUsername { get; set; }

        /// <summary>كلمة المرور</summary>
        [Required(ErrorMessage = "كلمة المرور مطلوبة")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "كلمة المرور يجب أن تكون 8 أحرف على الأقل")]
        public required string CustomerPassword { get; set; }

        /// <summary>رقم الهاتف</summary>
        [Required(ErrorMessage = "رقم الهاتف مطلوب")]
        [RegularExpression(@"^\+?[1-9]\d{1,14}$", ErrorMessage = "صيغة رقم الهاتف غير صحيحة (يجب أن يكون 7-15 أرقام)")]
        public required string PhoneNumber { get; set; }

        /// <summary>كود الدولة</summary>
        [Required(ErrorMessage = "كود الدولة مطلوب")]
        [Range(1, 999, ErrorMessage = "كود الدولة يجب أن يكون بين 1 و 999")]
        public int CountryCode { get; set; }

        /// <summary>معرف التعرفة</summary>
        public int? TariffRateId { get; set; }

        /// <summary>المنطقة الزمنية</summary>
        [Required(ErrorMessage = "المنطقة الزمنية مطلوبة")]
        public required string Timezone { get; set; }
    }

    /// <summary>
    /// طلب تحديث بيانات عميل
    /// </summary>
    public class VoIPUpdateCustomerRequest
    {
        /// <summary>رقم الهاتف الجديد</summary>
        [RegularExpression(@"^\+?[1-9]\d{1,14}$", ErrorMessage = "صيغة رقم الهاتف غير صحيحة")]
        public string? PhoneNumber { get; set; }

        /// <summary>المنطقة الزمنية الجديدة</summary>
        public string? Timezone { get; set; }
    }

    /// <summary>
    /// طلب إضافة رقم هاتف جديد
    /// </summary>
    public class AddPhoneRequest
    {
        [Required]
        [RegularExpression(@"^\+?[1-9]\d{1,14}$", ErrorMessage = "Invalid phone format")]
        public required string PhoneNumber { get; set; }
    }

    public class UpdateStatusRequest
    {
        [Required]
        public bool IsActive { get; set; }
    }
    public class ResetPasswordRequest
    {
        [Required]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        public required string NewPassword { get; set; }
    }


}
