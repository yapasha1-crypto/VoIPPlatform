using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using VoIPPlatform.API.Exceptions;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Controllers
{
    /// <summary>
    /// إدارة الحسابات (Accounts Management)
    /// </summary>
    /// <remarks>
    /// يوفر عمليات إدارة كاملة للحسابات:
    /// - إنشاء حسابات جديدة
    /// - جلب بيانات الحسابات
    /// - تحديث الحسابات
    /// - حذف الحسابات
    /// - معالجة الرصيد والاستخدام
    /// </remarks>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AccountsController : ControllerBase
    {
        private readonly VoIPDbContext _context;
        private readonly ILogger<AccountsController> _logger;

        public AccountsController(VoIPDbContext context, ILogger<AccountsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// جلب جميع الحسابات
        /// </summary>
        /// <remarks>
        /// يسترجع قائمة بجميع الحسابات مع تفاصيل المستخدمين
        /// </remarks>
        /// <returns>قائمة الحسابات</returns>
        /// <response code="200">تم جلب الحسابات بنجاح</response>
        /// <response code="401">غير مصرح</response>
        [HttpGet]
        [Authorize(Roles = "Customer,Reseller,Admin")]

        public async Task<IActionResult> GetAllAccounts()
        {
            _logger.LogInformation("Fetching all accounts");

            var accounts = await _context.Accounts
                .Include(a => a.User)
                .Select(a => new
                {
                    a.Id,
                    a.UserId,
                    UserName = a.User.FirstName + " " + a.User.LastName,
                    a.VirtualPhoneNumber,
                    a.AccountType,
                    a.CountryCode,
                    a.IsActive,
                    a.Balance,
                    a.MonthlyUsage,
                    a.CreatedAt,
                    a.RenewsAt
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message = "تم جلب الحسابات بنجاح",
                data = accounts,
                count = accounts.Count
            });
        }

        /// <summary>
        /// جلب حساب محدد
        /// </summary>
        /// <remarks>
        /// يسترجع بيانات حساب واحد باستخدام معرّفه
        /// </remarks>
        /// <param name="id">معرّف الحساب</param>
        /// <returns>بيانات الحساب</returns>
        /// <response code="200">تم جلب الحساب بنجاح</response>
        /// <response code="404">الحساب غير موجود</response>
        /// <response code="401">غير مصرح</response>
        [HttpGet("{id}")]
        [Authorize(Roles = "Customer,Reseller,Admin")]
        public async Task<IActionResult> GetAccountById(int id)
        {
            var account = await _context.Accounts
                .Include(a => a.User)
                .Where(a => a.Id == id)
                .Select(a => new
                {
                    a.Id,
                    a.UserId,
                    UserName = a.User.FirstName + " " + a.User.LastName,
                    a.VirtualPhoneNumber,
                    a.AccountType,
                    a.CountryCode,
                    a.IsActive,
                    a.Balance,
                    a.MonthlyUsage,
                    a.CreatedAt,
                    a.RenewsAt
                })
                .FirstOrDefaultAsync();

            if (account == null)
                throw new NotFoundException("Account", "الحساب");

            return Ok(new
            {
                success = true,
                message = "تم جلب الحساب بنجاح",
                data = account
            });
        }

        /// <summary>
        /// إنشاء حساب جديد
        /// </summary>
        /// <remarks>
        /// إنشاء حساب جديد للمستخدم مع رقم هاتف افتراضي
        /// 
        /// **مثال الطلب:**
        /// ```
        /// {
        ///   "userId": 1,
        ///   "virtualPhoneNumber": "+966501234567",
        ///   "accountType": "VoIP",
        ///   "countryCode": "SA",
        ///   "initialBalance": 100.00
        /// }
        /// ```
        /// </remarks>
        /// <param name="request">بيانات الحساب الجديد</param>
        /// <returns>معرّف الحساب الجديد</returns>
        /// <response code="201">تم إنشاء الحساب بنجاح</response>
        /// <response code="400">بيانات غير صحيحة</response>
        /// <response code="404">المستخدم غير موجود</response>
        /// <response code="401">غير مصرح</response>
        [HttpPost]
        [Authorize(Roles = "Customer,Reseller,Admin")]

        public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequest request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data", "بيانات الطلب غير صحيحة");

            // تحقق من وجود المستخدم
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
                throw new NotFoundException("User", "المستخدم");

            // تحقق من وجود حساب سابق للمستخدم
            var existingAccount = await _context.Accounts
                .FirstOrDefaultAsync(a => a.UserId == request.UserId);

            if (existingAccount != null)
                throw new BadRequestException(
                    "User already has an account",
                    "هذا المستخدم لديه حساب بالفعل");

            _logger.LogInformation(
                "Creating account for user: {UserId} with phone: {PhoneNumber}",
                request.UserId,
                request.VirtualPhoneNumber);

            var account = new Account
            {
                UserId = request.UserId,
                VirtualPhoneNumber = request.VirtualPhoneNumber,
                AccountType = request.AccountType,
                CountryCode = request.CountryCode,
                IsActive = true,
                Balance = request.InitialBalance ?? 0,
                MonthlyUsage = 0,
                CreatedAt = DateTime.UtcNow,
                RenewsAt = DateTime.UtcNow.AddMonths(1)
            };

            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Account created successfully: {AccountId}", account.Id);

            return CreatedAtAction(nameof(GetAccountById), new { id = account.Id }, new
            {
                success = true,
                message = "تم إنشاء الحساب بنجاح",
                data = new
                {
                    account.Id,
                    account.UserId,
                    account.VirtualPhoneNumber,
                    account.AccountType,
                    account.CountryCode,
                    account.IsActive,
                    account.Balance,
                    account.CreatedAt
                }
            });
        }

        /// <summary>
        /// تحديث بيانات حساب
        /// </summary>
        /// <remarks>
        /// تحديث معلومات الحساب مثل الرصيد والنوع
        /// 
        /// **مثال الطلب:**
        /// ```
        /// {
        ///   "virtualPhoneNumber": "+966501234567",
        ///   "accountType": "VoIP",
        ///   "balance": 150.00,
        ///   "isActive": true
        /// }
        /// ```
        /// </remarks>
        /// <param name="id">معرّف الحساب</param>
        /// <param name="request">البيانات المطلوب تحديثها</param>
        /// <returns>رسالة النجاح</returns>
        /// <response code="200">تم تحديث الحساب بنجاح</response>
        /// <response code="400">بيانات غير صحيحة</response>
        /// <response code="404">الحساب غير موجود</response>
        /// <response code="401">غير مصرح</response>
        [HttpPut("{id}")]
        [Authorize(Roles = "Customer,Reseller,Admin")]

        public async Task<IActionResult> UpdateAccount(int id, [FromBody] UpdateAccountRequest request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data", "بيانات الطلب غير صحيحة");

            var account = await _context.Accounts.FindAsync(id);
            if (account == null)
                throw new NotFoundException("Account", "الحساب");

            _logger.LogInformation("Updating account: {AccountId}", id);

            // تحديث البيانات
            if (!string.IsNullOrEmpty(request.VirtualPhoneNumber))
                account.VirtualPhoneNumber = request.VirtualPhoneNumber;

            if (!string.IsNullOrEmpty(request.AccountType))
                account.AccountType = request.AccountType;

            if (request.Balance.HasValue)
                account.Balance = request.Balance.Value;

            if (request.IsActive.HasValue)
                account.IsActive = request.IsActive.Value;

            _context.Accounts.Update(account);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Account updated successfully: {AccountId}", id);

            return Ok(new
            {
                success = true,
                message = "تم تحديث الحساب بنجاح",
                data = new
                {
                    account.Id,
                    account.UserId,
                    account.VirtualPhoneNumber,
                    account.AccountType,
                    account.CountryCode,
                    account.IsActive,
                    account.Balance,
                    account.RenewsAt
                }
            });
        }

        /// <summary>
        /// جلب رصيد الحساب
        /// </summary>
        /// <remarks>
        /// عرض الرصيد الحالي والاستخدام الشهري
        /// </remarks>
        /// <param name="id">معرّف الحساب</param>
        /// <returns>بيانات الرصيد</returns>
        /// <response code="200">تم جلب الرصيد بنجاح</response>
        /// <response code="404">الحساب غير موجود</response>
        /// <response code="401">غير مصرح</response>
        [HttpGet("{id}/balance")]
        [Authorize(Roles = "Customer,Reseller,Admin")]
        public async Task<IActionResult> GetBalance(int id)
        {
            // Support lookup by AccountID OR UserID
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == id || a.UserId == id);
            if (account == null)
                throw new NotFoundException("Account", "الحساب");

            _logger.LogInformation("Fetching balance for account: {AccountId}", id);

            return Ok(new
            {
                success = true,
                message = "تم جلب الرصيد بنجاح",
                data = new
                {
                    account.Id,
                    account.VirtualPhoneNumber,
                    account.Balance,
                    account.MonthlyUsage,
                    CurrencyCode = "SAR"
                }
            });
        }

        /// <summary>
        /// حذف حساب
        /// </summary>
        /// <remarks>
        /// حذف حساب من النظام بشكل نهائي
        /// ⚠️ هذه العملية غير قابلة للتراجع
        /// </remarks>
        /// <param name="id">معرّف الحساب</param>
        /// <returns>رسالة النجاح</returns>
        /// <response code="200">تم حذف الحساب بنجاح</response>
        /// <response code="404">الحساب غير موجود</response>
        /// <response code="403">ليس لديك صلاحية</response>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteAccount(int id)
        {
            var account = await _context.Accounts.FindAsync(id);
            if (account == null)
                throw new NotFoundException("Account", "الحساب");

            _logger.LogInformation("Deleting account: {AccountId}", id);

            _context.Accounts.Remove(account);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Account deleted successfully: {AccountId}", id);

            return Ok(new
            {
                success = true,
                message = "تم حذف الحساب بنجاح"
            });
        }
    }

    /// <summary>
    /// طلب إنشاء حساب جديد
    /// </summary>
    public class CreateAccountRequest
    {
        /// <summary>معرّف المستخدم</summary>
        [Required(ErrorMessage = "معرّف المستخدم مطلوب")]
        [Range(1, int.MaxValue, ErrorMessage = "معرّف المستخدم يجب أن يكون موجب")]
        public int UserId { get; set; }

        /// <summary>رقم الهاتف الافتراضي</summary>
        [Required(ErrorMessage = "رقم الهاتف مطلوب")]
        [Phone(ErrorMessage = "صيغة رقم الهاتف غير صحيحة")]
        public required string VirtualPhoneNumber { get; set; }

        /// <summary>نوع الحساب (VoIP, LocalNumber, TollFree)</summary>
        [Required(ErrorMessage = "نوع الحساب مطلوب")]
        [StringLength(50, ErrorMessage = "نوع الحساب لا يتجاوز 50 حرف")]
        public required string AccountType { get; set; }

        /// <summary>كود الدولة</summary>
        [Required(ErrorMessage = "كود الدولة مطلوب")]
        [StringLength(10, ErrorMessage = "كود الدولة لا يتجاوز 10 أحرف")]
        public required string CountryCode { get; set; }

        /// <summary>الرصيد الأولي</summary>
        [Range(0, double.MaxValue, ErrorMessage = "الرصيد يجب أن يكون موجب أو صفر")]
        public decimal? InitialBalance { get; set; }
    }

    /// <summary>
    /// طلب تحديث بيانات حساب
    /// </summary>
    public class UpdateAccountRequest
    {
        /// <summary>رقم الهاتف الافتراضي الجديد</summary>
        [Phone(ErrorMessage = "صيغة رقم الهاتف غير صحيحة")]
        public string? VirtualPhoneNumber { get; set; }

        /// <summary>نوع الحساب الجديد</summary>
        [StringLength(50, ErrorMessage = "نوع الحساب لا يتجاوز 50 حرف")]
        public string? AccountType { get; set; }

        /// <summary>الرصيد الجديد</summary>
        [Range(0, double.MaxValue, ErrorMessage = "الرصيد يجب أن يكون موجب أو صفر")]
        public decimal? Balance { get; set; }

        /// <summary>حالة الحساب (نشط/معطل)</summary>
        public bool? IsActive { get; set; }
    }
}
