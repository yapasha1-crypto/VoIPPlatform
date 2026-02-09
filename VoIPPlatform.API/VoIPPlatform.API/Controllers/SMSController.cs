using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using VoIPPlatform.API.Exceptions;
using VoIPPlatform.API.Models;
using VoIPPlatform.API.Services;

namespace VoIPPlatform.API.Controllers
{
    /// <summary>
    /// إدارة الرسائل النصية (SMS Management)
    /// يوفر عمليات إرسال الرسائل مع تتبع التكلفة والرصيد
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "User,Customer,Reseller,Admin")]
    public class SMSController : ControllerBase
    {
        private readonly VoIPDbContext _context;
        private readonly IVoiceTradingService _voiceTradingService;
        private readonly ILogger<SMSController> _logger;

        public SMSController(VoIPDbContext context, IVoiceTradingService voiceTradingService, ILogger<SMSController> logger)
        {
            _context = context;
            _voiceTradingService = voiceTradingService;
            _logger = logger;
        }

        /// <summary>
        /// إرسال رسالة نصية جديدة مع خصم الكلفة من الرصيد
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "User,Customer,Reseller,Admin")]
        public async Task<IActionResult> SendSMS([FromBody] SendSMSRequest request)
        {
            try
            {
                _logger.LogInformation("Processing SendSMS Request [VERSION 2]. UserId: {UserId}, AccountId: {AccountId}", request.UserId, request.AccountId);


                if (!ModelState.IsValid)
                    throw new BadRequestException("Invalid request data", "بيانات الطلب غير صحيحة");

                // (Account lookup moved after User lookup for auto-creation)

                // ✅ تحقق من وجود المستخدم
                var user = await _context.Users.FindAsync(request.UserId);
                if (user == null)
                {
                    _logger.LogError("User with ID {UserId} was not found in the database.", request.UserId);
                    return NotFound(new { success = false, message = $"المستخدم رقم {request.UserId} غير موجود", error = "User Not Found" });
                }

                // ✅ تحقق من وجود الحساب (Account) مرتبط بالمستخدم
                // Fix: If Account is missing (e.g. registered but no account row created), create it now.
                var account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == request.UserId);
                
                if (account == null)
                {
                    _logger.LogInformation("Creating new account for user {UserId}...", request.UserId);
                    // Lazy creation of Account
                    account = new Account
                    {
                        UserId = user.Id,
                        AccountType = "Prepaid",
                        Balance = user.AccountBalance, // Sync from User table
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        CountryCode = ExtractCountryCode(user.PhoneNumber ?? ""),
                        VirtualPhoneNumber = user.PhoneNumber ?? "Not Assigned"
                    };
                    _context.Accounts.Add(account);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Auto-created missing Account for User {UserId}", user.Id);
                }

                // ✅ تحقق من أن الحساب نشط
                if (!account.IsActive)
                    throw new BadRequestException("Account is inactive", "الحساب غير نشط");

                // ✅ تصحيح رقم المرسل (Sender ID)
                // If request has generic/placeholder sender, try to use User's real phone number
                string finalSender = request.SenderNumber;
                if ((finalSender == "VoIPv1" || finalSender == "string" || finalSender == "1234567890") && !string.IsNullOrEmpty(user.PhoneNumber))
                {
                    finalSender = user.PhoneNumber;
                }

                // ✅ احسب التكلفة
                var messageLength = request.MessageContent.Length;
                var countryCode = ExtractCountryCode(request.RecipientNumber);
                var cost = _voiceTradingService.CalculateSMSCost(countryCode, messageLength);

                // ✅ تحقق من وجود رصيد كافي
                if (account.Balance < cost)
                {
                    _logger.LogWarning(
                        "Insufficient balance for SMS. Account: {AccountId}, Balance: {Balance}, Cost: {Cost}",
                        account.Id, account.Balance, cost);

                    throw new BadRequestException(
                        "Insufficient balance",
                        $"الرصيد غير كافي. الرصيد الحالي: {account.Balance:N2}, الكلفة: {cost:N2}");
                }

                _logger.LogInformation(
                    "Sending SMS from {SenderNumber} to {RecipientNumber} for account {AccountId}",
                    request.SenderNumber, request.RecipientNumber, request.AccountId);
                
                // Continue with transaction...
                // Only showing up to here for the tool call, but need to make sure I don't break the rest of the function.
                // Actually the tool replaces the chunk. I need to be careful to match exactly.
                // The replacement content must bridge the gap correctly.
                
                // Let's stop at the logger line 100 in the original view.
                
                // ... (Original logic continues)
                _logger.LogInformation("DEBUG CHECK: Resolved Account ID: {AccountId}, Balance: {Balance}", account.Id, account.Balance);

                // Validation passed, proceeding to transaction...

            // ✅ ابدأ Database Transaction (Skip for InMemory tests)
            var isInMemory = _context.Database.ProviderName?.Contains("InMemory") == true;
            if (isInMemory)
            {
                // أرسل الرسالة عبر VoiceTrading
                var voiceTradingResponse = await _voiceTradingService.SendSMSAsync(
                    request.SenderNumber,
                    request.RecipientNumber,
                    request.MessageContent);

                // حدد حالة الرسالة بناءً على الرد
                string smsStatus = voiceTradingResponse.Success ? "Sent" : "Failed";

                // خصم الكلفة من الرصيد
                account.Balance -= cost;
                account.MonthlyUsage += cost;

                // ✅ أنشئ SMS Record
                var sms = new SMS
                {
                    AccountId = account.Id,
                    UserId = request.UserId,
                    SenderNumber = request.SenderNumber,
                    RecipientNumber = request.RecipientNumber,
                    MessageContent = request.MessageContent,
                    MessageLength = messageLength,
                    Cost = cost,
                    Status = smsStatus,
                    CreatedAt = DateTime.UtcNow,
                    SentAt = voiceTradingResponse.Success ? DateTime.UtcNow : null,
                    ErrorMessage = voiceTradingResponse.ErrorMessage,
                    ExternalId = voiceTradingResponse.ExternalId
                };

                _context.SMS.Add(sms);
                await _context.SaveChangesAsync();

                // ✅ سجل Transaction
                var transaction = new Transaction
                {
                    AccountId = request.AccountId,
                    Amount = -cost, // سالب لأنه خصم
                    Type = "SMSCost",
                    Status = smsStatus == "Sent" ? "Completed" : "Failed",
                    Description = $"SMS to {request.RecipientNumber}",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Transactions.Add(transaction);

                // ✅ حدّث الحساب
                _context.Accounts.Update(account);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "SMS sent successfully. SMSId: {SMSId}, Status: {Status}, Amount deducted: {Amount}",
                    sms.Id, smsStatus, cost);

                return CreatedAtAction(nameof(GetSMSById), new { id = sms.Id }, new
                {
                    success = true,
                    message = voiceTradingResponse.Success ? "تم إرسال الرسالة بنجاح" : "فشل إرسال الرسالة",
                    data = new
                    {
                        sms.Id,
                        sms.AccountId,
                        sms.UserId,
                        sms.SenderNumber,
                        sms.RecipientNumber,
                        sms.MessageLength,
                        sms.Cost,
                        sms.Status,
                        sms.CreatedAt,
                        balanceAfter = account.Balance,
                        balanceDeducted = cost,
                        externalId = voiceTradingResponse.ExternalId,
                        voiceTradingMessage = voiceTradingResponse.Message
                    }
                });
            }

            using (var dbTransaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // أرسل الرسالة عبر VoiceTrading
                    var voiceTradingResponse = await _voiceTradingService.SendSMSAsync(
                        request.SenderNumber,
                        request.RecipientNumber,
                        request.MessageContent);

                    // حدد حالة الرسالة بناءً على الرد
                    string smsStatus = voiceTradingResponse.Success ? "Sent" : "Failed";

                    // خصم الكلفة من الرصيد
                    account.Balance -= cost;
                    account.MonthlyUsage += cost;

                    // ✅ أنشئ SMS Record
                    var sms = new SMS
                    {
                        AccountId = account.Id, // ✨ FIX: Use the resolved/created Account ID
                        UserId = request.UserId,
                        SenderNumber = request.SenderNumber,
                        RecipientNumber = request.RecipientNumber,
                        MessageContent = request.MessageContent,
                        MessageLength = messageLength,
                        Cost = cost,
                        Status = smsStatus,
                        CreatedAt = DateTime.UtcNow,
                        SentAt = voiceTradingResponse.Success ? DateTime.UtcNow : null,
                        ErrorMessage = voiceTradingResponse.ErrorMessage?.Length > 500
                            ? voiceTradingResponse.ErrorMessage.Substring(0, 500)
                            : voiceTradingResponse.ErrorMessage,
                        ExternalId = voiceTradingResponse.ExternalId?.Length > 100
                            ? voiceTradingResponse.ExternalId.Substring(0, 100)
                            : voiceTradingResponse.ExternalId
                    };

                    _context.SMS.Add(sms);
                    await _context.SaveChangesAsync();

                    // ✅ سجل Transaction
                    var transaction = new Transaction
                    {
                        AccountId = account.Id, // ✨ FIX: Use the resolved/created Account ID
                        Amount = -cost, // سالب لأنه خصم
                        Type = "SMSCost",
                        Status = smsStatus == "Sent" ? "Completed" : "Failed",
                        Description = $"SMS to {request.RecipientNumber}",
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Transactions.Add(transaction);

                    // ✅ حدّث الحساب
                    _context.Accounts.Update(account);
                    await _context.SaveChangesAsync();

                    if (!voiceTradingResponse.Success)
                    {
                         // Rollback transaction to avoid charging or recording failed attempts (optional, but requested by user to debug)
                         // OR keep it but return 400 so UI shows error.
                         // Let's keep the record but return 400 so the user sees the alert.
                         // Actually, if we return 400, the frontend treats it as error.
                         // So we should probably NOT commit if it's a critical external failure?
                         // User wants to know WHY it failed.
                         
                         _logger.LogWarning("VoiceTrading failed: {Error}", voiceTradingResponse.ErrorMessage);
                         await dbTransaction.CommitAsync(); // Commit the "Failed" record so user sees it in history
                         
                         return BadRequest(new 
                         { 
                            success = false, 
                            message = "فشل في إرسال الرسالة من المزود الخارجي", 
                            error = voiceTradingResponse.ErrorMessage,
                            details = voiceTradingResponse.Message
                         });
                    }

                    // ✅ Commit Transaction
                    await dbTransaction.CommitAsync();

                    _logger.LogInformation(
                        "SMS sent successfully. SMSId: {SMSId}, Status: {Status}, Amount deducted: {Amount}",
                        sms.Id, smsStatus, cost);

                    return CreatedAtAction(nameof(GetSMSById), new { id = sms.Id }, new
                    {
                        success = true,
                        message = voiceTradingResponse.Success ? "تم إرسال الرسالة بنجاح" : "فشل إرسال الرسالة",
                        data = new
                        {
                            sms.Id,
                            sms.AccountId,
                            sms.UserId,
                            sms.SenderNumber,
                            sms.RecipientNumber,
                            sms.MessageLength,
                            sms.Cost,
                            sms.Status,
                            sms.CreatedAt,
                            balanceAfter = account.Balance,
                            balanceDeducted = cost,
                            externalId = voiceTradingResponse.ExternalId,
                            voiceTradingMessage = voiceTradingResponse.Message
                        }
                    });
                }
                catch (Exception ex)
                {
                    // Rollback في حالة الخطأ
                    await dbTransaction.RollbackAsync();
                    _logger.LogError(ex, "Error sending SMS");
                    throw;
                }
                }
            } // Close using
            catch (NotFoundException ex)
            {
                _logger.LogError(ex, "NotFoundException in SendSMS: {Message}", ex.Message);
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                 _logger.LogError(ex, "Unexpected error in SendSMS.");
                 throw; 
            }
        }


        /// <summary>
        /// جلب جميع الرسائل
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "User,Customer,Reseller,Admin")]
        public async Task<IActionResult> GetAllSMS()
        {
            _logger.LogInformation("Fetching all SMS");

            var smsList = await _context.SMS
                .Include(s => s.Account)
                .Include(s => s.User)
                .Select(s => new
                {
                    s.Id,
                    s.AccountId,
                    s.UserId,
                    AccountNumber = s.Account!.VirtualPhoneNumber,
                    UserName = s.User!.FirstName + " " + s.User!.LastName,
                    s.SenderNumber,
                    s.RecipientNumber,
                    s.MessageContent,
                    s.MessageLength,
                    s.Cost,
                    s.Status,
                    s.CreatedAt,
                    s.SentAt,
                    s.ErrorMessage
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message = "تم جلب الرسائل بنجاح",
                data = smsList,
                count = smsList.Count
            });
        }

        /// <summary>
        /// جلب بيانات رسالة محددة
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "User,Customer,Reseller,Admin")]
        public async Task<IActionResult> GetSMSById(int id)
        {
            var sms = await _context.SMS
                .Include(s => s.Account)
                .Include(s => s.User)
                .Where(s => s.Id == id)
                .Select(s => new
                {
                    s.Id,
                    s.AccountId,
                    s.UserId,
                    AccountNumber = s.Account!.VirtualPhoneNumber,
                    UserName = s.User!.FirstName + " " + s.User!.LastName,
                    s.SenderNumber,
                    s.RecipientNumber,
                    s.MessageContent,
                    s.MessageLength,
                    s.Cost,
                    s.Status,
                    s.CreatedAt,
                    s.SentAt,
                    s.ErrorMessage,
                    s.ExternalId
                })
                .FirstOrDefaultAsync();

            if (sms == null)
                throw new NotFoundException("SMS", "الرسالة");

            return Ok(new
            {
                success = true,
                message = "تم جلب الرسالة بنجاح",
                data = sms
            });
        }

        /// <summary>
        /// جلب رسائل حساب معين
        /// </summary>
        [HttpGet("account/{accountId}")]
        [Authorize(Roles = "User,Customer,Reseller,Admin")]
        public async Task<IActionResult> GetSMSByAccountId(int accountId)
        {
            var account = await _context.Accounts.FindAsync(accountId);
            if (account == null)
                throw new NotFoundException("Account", "الحساب");

            _logger.LogInformation("Fetching SMS for account: {AccountId}", accountId);

            var smsList = await _context.SMS
                .Include(s => s.Account)
                .Include(s => s.User)
                .Where(s => s.AccountId == accountId)
                .Select(s => new
                {
                    s.Id,
                    s.AccountId,
                    s.UserId,
                    AccountNumber = s.Account!.VirtualPhoneNumber,
                    UserName = s.User!.FirstName + " " + s.User!.LastName,
                    s.SenderNumber,
                    s.RecipientNumber,
                    s.MessageContent,
                    s.MessageLength,
                    s.Cost,
                    s.Status,
                    s.CreatedAt,
                    s.SentAt
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message = "تم جلب رسائل الحساب بنجاح",
                data = smsList,
                count = smsList.Count
            });
        }

        /// <summary>
        /// جلب إحصائيات الرسائل
        /// </summary>
        [HttpGet("stats/summary")]
        [Authorize(Roles = "User,Customer,Reseller,Admin")]
        public async Task<IActionResult> GetSMSStats()
        {
            _logger.LogInformation("Fetching SMS statistics");

            var totalSMS = await _context.SMS.CountAsync();
            var sentSMS = await _context.SMS.CountAsync(s => s.Status == "Sent");
            var failedSMS = await _context.SMS.CountAsync(s => s.Status == "Failed");
            var totalCost = await _context.SMS.SumAsync(s => s.Cost);
            var averageMessageLength = totalSMS > 0 ? await _context.SMS.AverageAsync(s => s.MessageLength) : 0;

            return Ok(new
            {
                success = true,
                message = "تم جلب إحصائيات الرسائل بنجاح",
                data = new
                {
                    totalSMS,
                    sentSMS,
                    failedSMS,
                    totalCostSAR = totalCost,
                    averageMessageLength = (int)averageMessageLength,
                    successRate = totalSMS > 0 ? ((sentSMS * 100.0) / totalSMS).ToString("F2") + "%" : "0%"
                }
            });
        }

        /// <summary>
        /// طلب إرسال رسالة نصية
        /// </summary>
        public class SendSMSRequest
        {
            [Required(ErrorMessage = "رقم الحساب مطلوب")]
            [Range(1, int.MaxValue, ErrorMessage = "رقم الحساب يجب أن يكون موجب")]
            public int AccountId { get; set; }

            [Required(ErrorMessage = "رقم المستخدم مطلوب")]
            [Range(1, int.MaxValue, ErrorMessage = "رقم المستخدم يجب أن يكون موجب")]
            public int UserId { get; set; }

            [Required(ErrorMessage = "رقم المرسل مطلوب")]
            [Phone(ErrorMessage = "صيغة رقم المرسل غير صحيحة")]
            public required string SenderNumber { get; set; }

            [Required(ErrorMessage = "رقم المستقبل مطلوب")]
            [Phone(ErrorMessage = "صيغة رقم المستقبل غير صحيحة")]
            public required string RecipientNumber { get; set; }

            [Required(ErrorMessage = "محتوى الرسالة مطلوب")]
            [StringLength(1000, MinimumLength = 1, ErrorMessage = "الرسالة يجب أن تكون بين 1 و 1000 حرف")]
            public required string MessageContent { get; set; }
        }

        /// <summary>
        /// استخراج كود الدولة من رقم الهاتف
        /// </summary>
        private string ExtractCountryCode(string phoneNumber)
        {
            // إزالة أي أحرف غير رقمية ما عدا علامة الجمع
            var cleaned = System.Text.RegularExpressions.Regex.Replace(phoneNumber, @"[^\d+]", "");
            if (cleaned.StartsWith("+"))
                cleaned = cleaned.Substring(1);

            // كود الدولة عادة 1-3 أرقام
            if (cleaned.Length >= 3)
                return cleaned.Substring(0, cleaned.StartsWith("1") ? 1 : 2);

            return "default";
        }
    }
}
