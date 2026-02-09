using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using VoIPPlatform.API.Exceptions;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Controllers
{
    /// <summary>
    /// إدارة المكالمات (Calls Management)
    /// يوفر عمليات إدارة شاملة للمكالمات مع تتبع الرصيد والعمليات المالية
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "User,Customer,Reseller,Admin")]
    public class CallsController : ControllerBase
    {
        private readonly VoIPDbContext _context;
        private readonly ILogger<CallsController> _logger;
        private readonly Services.IVoIPInfoCenterService _voipService;

        public CallsController(VoIPDbContext context, ILogger<CallsController> logger, Services.IVoIPInfoCenterService voipService)
        {
            _context = context;
            _logger = logger;
            _voipService = voipService;
        }

        /// <summary>
        /// تسجيل مكالمة جديدة مع خصم الكلفة من الرصيد
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "User,Customer,Reseller,Admin")]
        public async Task<IActionResult> CreateCall([FromBody] CreateCallRequest request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data", "بيانات الطلب غير صحيحة");

            // ✅ تحقق من وجود الحساب
            var account = await _context.Accounts.FindAsync(request.AccountId);
            if (account == null)
                throw new NotFoundException("Account", "الحساب");

            // ✅ تحقق من وجود المستخدم
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
                throw new NotFoundException("User", "المستخدم");

            // ✅ تحقق من أن الحساب نشط
            if (!account.IsActive)
                throw new BadRequestException("Account is inactive", "الحساب غير نشط");

            // ✅ تحقق من وجود رصيد كافي
            if (account.Balance < request.Cost)
            {
                _logger.LogWarning(
                    "Insufficient balance for call. Account: {AccountId}, Balance: {Balance}, Cost: {Cost}",
                    account.Id, account.Balance, request.Cost);

                throw new BadRequestException(
                    "Insufficient balance",
                    $"الرصيد غير كافي. الرصيد الحالي: {account.Balance:N2}, الكلفة: {request.Cost:N2}");
            }

            _logger.LogInformation(
                "Creating call from {CallerNumber} to {ReceiverNumber} for account {AccountId}",
                request.CallerNumber, request.ReceiverNumber, request.AccountId);

            // ✅ ابدأ Database Transaction (Skip for InMemory tests)
            var isInMemory = _context.Database.ProviderName?.Contains("InMemory") == true;
            if (isInMemory)
            {
                // Logic without transaction for tests
                // حفظ الرصيد قبل العملية
                decimal balanceBefore = account.Balance;

                // خصم الكلفة من الرصيد
                account.Balance -= request.Cost;
                account.MonthlyUsage += request.Cost;

                // ✅ أنشئ Call
                var call = new Call
                {
                    AccountId = request.AccountId,
                    UserId = request.UserId,
                    CallerNumber = request.CallerNumber,
                    ReceiverNumber = request.ReceiverNumber,
                    CountryCode = request.CountryCode ?? "46",
                    DurationSeconds = request.DurationSeconds,
                    Status = request.Status ?? "Completed",
                    Cost = request.Cost,
                    StartTime = request.StartTime ?? DateTime.UtcNow,
                    EndTime = request.EndTime,
                    IsRecorded = request.IsRecorded ?? false,
                    Notes = request.Notes
                };

                _context.Calls.Add(call);
                await _context.SaveChangesAsync();

                // ✅ سجل Transaction
                var transaction = new Transaction
                {
                    AccountId = request.AccountId,
                    Amount = -request.Cost, // سالب لأنه خصم
                    Type = "CallCost",
                    Status = "Completed",
                    Description = $"Call from {request.CallerNumber} to {request.ReceiverNumber}",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Transactions.Add(transaction);

                // ✅ حدّث الحساب
                _context.Accounts.Update(account);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Call created successfully. CallId: {CallId}, Amount deducted: {Amount}",
                    call.Id, request.Cost);

                return CreatedAtAction(nameof(GetCallById), new { id = call.Id }, new
                {
                    success = true,
                    message = "تم تسجيل المكالمة بنجاح",
                    data = new
                    {
                        call.Id,
                        call.AccountId,
                        call.UserId,
                        call.CallerNumber,
                        call.ReceiverNumber,
                        call.CountryCode,
                        call.DurationSeconds,
                        call.Status,
                        call.Cost,
                        call.StartTime,
                        call.EndTime,
                        call.IsRecorded,
                        balanceAfter = account.Balance,
                        balanceDeducted = request.Cost
                    }
                });
            }

            using (var dbTransaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // حفظ الرصيد قبل العملية
                    decimal balanceBefore = account.Balance;

                    // خصم الكلفة من الرصيد
                    account.Balance -= request.Cost;
                    account.MonthlyUsage += request.Cost;

                    // ✅ أنشئ Call
                    var call = new Call
                    {
                        AccountId = request.AccountId,
                        UserId = request.UserId,
                        CallerNumber = request.CallerNumber,
                        ReceiverNumber = request.ReceiverNumber,
                        CountryCode = request.CountryCode ?? "46",
                        DurationSeconds = request.DurationSeconds,
                        Status = request.Status ?? "Completed",
                        Cost = request.Cost,
                        StartTime = request.StartTime ?? DateTime.UtcNow,
                        EndTime = request.EndTime,
                        IsRecorded = request.IsRecorded ?? false,
                        Notes = request.Notes
                    };

                    _context.Calls.Add(call);
                    await _context.SaveChangesAsync();

                    // ✅ سجل Transaction
                    var transaction = new Transaction
                    {
                        AccountId = request.AccountId,
                        Amount = -request.Cost, // سالب لأنه خصم
                        Type = "CallCost",
                        Status = "Completed",
                        Description = $"Call from {request.CallerNumber} to {request.ReceiverNumber}",
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Transactions.Add(transaction);

                    // ✅ حدّث الحساب
                    _context.Accounts.Update(account);
                    await _context.SaveChangesAsync();

                    // ✅ Commit Transaction
                    await dbTransaction.CommitAsync();

                    _logger.LogInformation(
                        "Call created successfully. CallId: {CallId}, Amount deducted: {Amount}",
                        call.Id, request.Cost);

                    return CreatedAtAction(nameof(GetCallById), new { id = call.Id }, new
                    {
                        success = true,
                        message = "تم تسجيل المكالمة بنجاح",
                        data = new
                        {
                            call.Id,
                            call.AccountId,
                            call.UserId,
                            call.CallerNumber,
                            call.ReceiverNumber,
                            call.CountryCode,
                            call.DurationSeconds,
                            call.Status,
                            call.Cost,
                            call.StartTime,
                            call.EndTime,
                            call.IsRecorded,
                            balanceAfter = account.Balance,
                            balanceDeducted = request.Cost
                        }
                    });
                }
                catch (Exception ex)
                {
                    // Rollback in case of error
                    await dbTransaction.RollbackAsync();
                    _logger.LogError(ex, "Error creating call");
                    throw;
                }
            }
        }

        /// <summary>
        /// جلب جميع المكالمات
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "User,Customer,Reseller,Admin")]
        public async Task<IActionResult> GetAllCalls()
        {
            _logger.LogInformation("Fetching all calls");

            var calls = await _context.Calls
                .Include(c => c.Account)
                .Include(c => c.User)
                .Select(c => new
                {
                    c.Id,
                    c.AccountId,
                    c.UserId,
                    AccountNumber = c.Account!.VirtualPhoneNumber,
                    UserName = c.User!.FirstName + " " + c.User!.LastName,
                    c.CallerNumber,
                    c.ReceiverNumber,
                    c.CountryCode,
                    c.DurationSeconds,
                    c.Status,
                    c.Cost,
                    c.StartTime,
                    c.EndTime,
                    c.IsRecorded,
                    c.Notes
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message = "تم جلب المكالمات بنجاح",
                data = calls,
                count = calls.Count
            });
        }

        /// <summary>
        /// جلب بيانات مكالمة محددة
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "User,Customer,Reseller,Admin")]
        public async Task<IActionResult> GetCallById(int id)
        {
            var call = await _context.Calls
                .Include(c => c.Account)
                .Include(c => c.User)
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.AccountId,
                    c.UserId,
                    AccountNumber = c.Account!.VirtualPhoneNumber,
                    UserName = c.User!.FirstName + " " + c.User!.LastName,
                    c.CallerNumber,
                    c.ReceiverNumber,
                    c.CountryCode,
                    c.DurationSeconds,
                    c.Status,
                    c.Cost,
                    c.StartTime,
                    c.EndTime,
                    c.IsRecorded,
                    c.Notes
                })
                .FirstOrDefaultAsync();

            if (call == null)
                throw new NotFoundException("Call", "المكالمة");

            return Ok(new
            {
                success = true,
                message = "تم جلب المكالمة بنجاح",
                data = call
            });
        }

        /// <summary>
        /// جلب مكالمات حساب معين
        /// </summary>
        [HttpGet("account/{accountId}")]
        [Authorize(Roles = "User,Customer,Reseller,Admin")]
        public async Task<IActionResult> GetCallsByAccountId(int accountId)
        {
            var account = await _context.Accounts.FindAsync(accountId);
            if (account == null)
                throw new NotFoundException("Account", "الحساب");

            _logger.LogInformation("Fetching calls for account: {AccountId}", accountId);

            var calls = await _context.Calls
                .Include(c => c.Account)
                .Include(c => c.User)
                .Where(c => c.AccountId == accountId)
                .Select(c => new
                {
                    c.Id,
                    c.AccountId,
                    c.UserId,
                    AccountNumber = c.Account!.VirtualPhoneNumber,
                    UserName = c.User!.FirstName + " " + c.User!.LastName,
                    c.CallerNumber,
                    c.ReceiverNumber,
                    c.CountryCode,
                    c.DurationSeconds,
                    c.Status,
                    c.Cost,
                    c.StartTime,
                    c.EndTime,
                    c.IsRecorded
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message = "تم جلب مكالمات الحساب بنجاح",
                data = calls,
                count = calls.Count
            });
        }

        /// <summary>
        /// جلب المكالمات الحقيقية من المزود الخارجي
        /// </summary>
        [HttpGet("external")]
        [Authorize]
        public async Task<IActionResult> GetCallsExternal([FromHeader(Name = "X-VoIP-Password")] string? passwordHeader, [FromQuery] string? passwordQuery)
        {
            var username = User.Identity?.Name;
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var password = passwordHeader ?? passwordQuery;
            // If password is still empty, the service call will likely fail or return empty, 
            // but we can try letting it pass if the service handles it (it returns empty list).

            var calls = await _voipService.GetCallOverviewAsync(username, password ?? "");
            
            return Ok(new
            {
                success = true,
                message = "External calls fetched",
                data = calls,
                count = calls.Count
            });
        }

        /// <summary>
        /// تحديث بيانات مكالمة
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "User,Customer,Reseller,Admin")]
        public async Task<IActionResult> UpdateCall(int id, [FromBody] UpdateCallRequest request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data", "بيانات الطلب غير صحيحة");

            var call = await _context.Calls.FindAsync(id);
            if (call == null)
                throw new NotFoundException("Call", "المكالمة");

            _logger.LogInformation("Updating call: {CallId}", id);

            if (!string.IsNullOrEmpty(request.CallerNumber))
                call.CallerNumber = request.CallerNumber;

            if (!string.IsNullOrEmpty(request.ReceiverNumber))
                call.ReceiverNumber = request.ReceiverNumber;

            if (!string.IsNullOrEmpty(request.Status))
                call.Status = request.Status;

            if (request.DurationSeconds.HasValue)
                call.DurationSeconds = request.DurationSeconds.Value;

            if (request.Cost.HasValue)
                call.Cost = request.Cost.Value;

            if (request.EndTime.HasValue)
                call.EndTime = request.EndTime;

            if (!string.IsNullOrEmpty(request.Notes))
                call.Notes = request.Notes;

            if (request.IsRecorded.HasValue)
                call.IsRecorded = request.IsRecorded.Value;

            _context.Calls.Update(call);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Call updated successfully: {CallId}", id);

            return Ok(new
            {
                success = true,
                message = "تم تحديث المكالمة بنجاح",
                data = new
                {
                    call.Id,
                    call.AccountId,
                    call.UserId,
                    call.CallerNumber,
                    call.ReceiverNumber,
                    call.Status,
                    call.DurationSeconds,
                    call.Cost,
                    call.StartTime,
                    call.EndTime,
                    call.IsRecorded
                }
            });
        }

        /// <summary>
        /// حذف سجل مكالمة
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCall(int id)
        {
            var call = await _context.Calls.FindAsync(id);
            if (call == null)
                throw new NotFoundException("Call", "المكالمة");

            _logger.LogInformation("Deleting call: {CallId}", id);

            _context.Calls.Remove(call);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Call deleted successfully: {CallId}", id);

            return Ok(new
            {
                success = true,
                message = "تم حذف المكالمة بنجاح"
            });
        }

        /// <summary>
        /// جلب إحصائيات المكالمات
        /// </summary>
        [HttpGet("stats/summary")]
        [Authorize(Roles = "User,Customer,Reseller,Admin")]
        public async Task<IActionResult> GetCallStats()
        {
            _logger.LogInformation("Fetching call statistics");

            var totalCalls = await _context.Calls.CountAsync();
            var completedCalls = await _context.Calls.CountAsync(c => c.Status == "Completed");
            var failedCalls = await _context.Calls.CountAsync(c => c.Status == "Failed");
            var totalDuration = await _context.Calls.SumAsync(c => c.DurationSeconds);
            var totalCost = await _context.Calls.SumAsync(c => c.Cost);

            return Ok(new
            {
                success = true,
                message = "تم جلب إحصائيات المكالمات بنجاح",
                data = new
                {
                    totalCalls,
                    completedCalls,
                    failedCalls,
                    totalDurationSeconds = totalDuration,
                    totalCostSAR = totalCost,
                    averageDurationSeconds = totalCalls > 0 ? totalDuration / totalCalls : 0,
                    averageCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0
                }
            });
        }

        /// <summary>
        /// طلب إنشاء مكالمة جديدة
        /// </summary>
        public class CreateCallRequest
        {
            [Required(ErrorMessage = "رقم الحساب مطلوب")]
            [Range(1, int.MaxValue, ErrorMessage = "رقم الحساب يجب أن يكون موجب")]
            public int AccountId { get; set; }

            [Required(ErrorMessage = "رقم المستخدم مطلوب")]
            [Range(1, int.MaxValue, ErrorMessage = "رقم المستخدم يجب أن يكون موجب")]
            public int UserId { get; set; }

            [Required(ErrorMessage = "رقم المتصل مطلوب")]
            [Phone(ErrorMessage = "صيغة رقم المتصل غير صحيحة")]
            public required string CallerNumber { get; set; }

            [Required(ErrorMessage = "رقم المستقبل مطلوب")]
            [Phone(ErrorMessage = "صيغة رقم المستقبل غير صحيحة")]
            public required string ReceiverNumber { get; set; }

            [StringLength(10, ErrorMessage = "كود الدولة لا يمكن أن يتجاوز 10 أحرف")]
            public string? CountryCode { get; set; }

            [Required(ErrorMessage = "مدة المكالمة مطلوبة")]
            [Range(1, int.MaxValue, ErrorMessage = "مدة المكالمة يجب أن تكون موجبة")]
            public int DurationSeconds { get; set; }

            [StringLength(50, ErrorMessage = "حالة المكالمة لا تتجاوز 50 حرف")]
            public string? Status { get; set; }

            [Required(ErrorMessage = "التكلفة مطلوبة")]
            [Range(0, double.MaxValue, ErrorMessage = "التكلفة يجب أن تكون موجبة أو صفر")]
            public decimal Cost { get; set; }

            public DateTime? StartTime { get; set; }
            public DateTime? EndTime { get; set; }
            public bool? IsRecorded { get; set; }

            [StringLength(500, ErrorMessage = "الملاحظات لا تتجاوز 500 حرف")]
            public string? Notes { get; set; }
        }

        /// <summary>
        /// طلب تحديث بيانات مكالمة
        /// </summary>
        public class UpdateCallRequest
        {
            [Phone(ErrorMessage = "صيغة رقم المتصل غير صحيحة")]
            public string? CallerNumber { get; set; }

            [Phone(ErrorMessage = "صيغة رقم المستقبل غير صحيحة")]
            public string? ReceiverNumber { get; set; }

            [StringLength(50, ErrorMessage = "حالة المكالمة لا تتجاوز 50 حرف")]
            public string? Status { get; set; }

            [Range(1, int.MaxValue, ErrorMessage = "مدة المكالمة يجب أن تكون موجبة")]
            public int? DurationSeconds { get; set; }

            [Range(0, double.MaxValue, ErrorMessage = "التكلفة يجب أن تكون موجبة أو صفر")]
            public decimal? Cost { get; set; }

            public DateTime? EndTime { get; set; }
            public bool? IsRecorded { get; set; }

            [StringLength(500, ErrorMessage = "الملاحظات لا تتجاوز 500 حرف")]
            public string? Notes { get; set; }
        }
    }
}