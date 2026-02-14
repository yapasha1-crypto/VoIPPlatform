using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private readonly VoIPDbContext _context;
        private readonly ILogger<TransactionsController> _logger;

        public TransactionsController(VoIPDbContext context, ILogger<TransactionsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/transactions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAllTransactions()
        {
            try
            {
                var transactions = await _context.Transactions
                    .Include(t => t.Account)
                    .Select(t => new
                    {
                        t.Id,
                        t.AccountId,
                        AccountNumber = t.Account.VirtualPhoneNumber,
                        t.Amount,
                        t.Type,
                        t.Status,
                        t.Description,
                        t.CreatedAt,
                        t.UpdatedAt
                    })
                    .OrderByDescending(t => t.CreatedAt)
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    message = "تم جلب المعاملات بنجاح",
                    data = transactions,
                    count = transactions.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "خطأ في جلب المعاملات");
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطأ في جلب المعاملات",
                    error = ex.Message
                });
            }
        }

        // GET: api/transactions/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetTransactionById(int id)
        {
            try
            {
                var transaction = await _context.Transactions
                    .Include(t => t.Account)
                    .Where(t => t.Id == id)
                    .Select(t => new
                    {
                        t.Id,
                        t.AccountId,
                        AccountNumber = t.Account.VirtualPhoneNumber,
                        t.Amount,
                        t.Type,
                        t.Status,
                        t.Description,
                        t.CreatedAt,
                        t.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (transaction == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "المعاملة غير موجودة"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "تم جلب المعاملة بنجاح",
                    data = transaction
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"خطأ في جلب المعاملة برقم {id}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطأ في جلب المعاملة",
                    error = ex.Message
                });
            }
        }

        // GET: api/transactions/account/{accountId}
        [HttpGet("account/{accountId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetTransactionsByAccountId(int accountId)
        {
            try
            {
                var account = await _context.Accounts.FindAsync(accountId);
                if (account == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "الحساب غير موجود"
                    });
                }

                var transactions = await _context.Transactions
                    .Include(t => t.Account)
                    .Where(t => t.AccountId == accountId)
                    .Select(t => new
                    {
                        t.Id,
                        t.AccountId,
                        AccountNumber = t.Account.VirtualPhoneNumber,
                        t.Amount,
                        t.Type,
                        t.Status,
                        t.Description,
                        t.CreatedAt,
                        t.UpdatedAt
                    })
                    .OrderByDescending(t => t.CreatedAt)
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    message = "تم جلب معاملات الحساب بنجاح",
                    data = transactions,
                    count = transactions.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"خطأ في جلب معاملات الحساب {accountId}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطأ في جلب معاملات الحساب",
                    error = ex.Message
                });
            }
        }

        // POST: api/transactions
        [HttpPost]
        public async Task<ActionResult<object>> CreateTransaction([FromBody] CreateTransactionRequest request)
        {
            try
            {
                var account = await _context.Accounts.FindAsync(request.AccountId);
                if (account == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "الحساب غير موجود"
                    });
                }

                if ((request.Type == "Withdrawal" || request.Type == "CallCost") && account.Balance < request.Amount)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "الرصيد غير كافي",
                        currentBalance = account.Balance,
                        requiredAmount = request.Amount
                    });
                }

                var transaction = new Transaction
                {
                    AccountId = request.AccountId,
                    Amount = request.Amount,
                    Type = request.Type,
                    Status = "Completed",
                    Description = request.Description,
                    CreatedAt = DateTime.UtcNow
                };

                if (request.Type == "Deposit")
                {
                    account.Balance += request.Amount;
                }
                else if (request.Type == "Withdrawal" || request.Type == "CallCost")
                {
                    account.Balance -= request.Amount;
                }

                _context.Transactions.Add(transaction);
                _context.Accounts.Update(account);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetTransactionById), new { id = transaction.Id }, new
                {
                    success = true,
                    message = "تم تسجيل المعاملة بنجاح",
                    data = new
                    {
                        transaction.Id,
                        transaction.AccountId,
                        transaction.Amount,
                        transaction.Type,
                        transaction.Status,
                        transaction.Description,
                        transaction.CreatedAt,
                        NewBalance = account.Balance
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "خطأ في تسجيل المعاملة");
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطأ في تسجيل المعاملة",
                    error = ex.Message
                });
            }
        }

        // GET: api/transactions/stats
        [HttpGet("stats")]
        public async Task<ActionResult<object>> GetTransactionStats()
        {
            try
            {
                var totalTransactions = await _context.Transactions.CountAsync();
                var totalDeposits = await _context.Transactions
                    .Where(t => t.Type == "Deposit")
                    .SumAsync(t => t.Amount);
                var totalWithdrawals = await _context.Transactions
                    .Where(t => t.Type == "Withdrawal")
                    .SumAsync(t => t.Amount);
                var totalCallCosts = await _context.Transactions
                    .Where(t => t.Type == "CallCost")
                    .SumAsync(t => t.Amount);

                return Ok(new
                {
                    success = true,
                    message = "تم جلب إحصائيات المعاملات بنجاح",
                    data = new
                    {
                        totalTransactions,
                        totalDepositsSAR = totalDeposits,
                        totalWithdrawalsSAR = totalWithdrawals,
                        totalCallCostsSAR = totalCallCosts,
                        netBalanceSAR = totalDeposits - totalWithdrawals - totalCallCosts
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "خطأ في جلب إحصائيات المعاملات");
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطأ في جلب إحصائيات المعاملات",
                    error = ex.Message
                });
            }
        }

        // GET: api/transactions/account/{accountId}/stats
        [HttpGet("account/{accountId}/stats")]
        public async Task<ActionResult<object>> GetAccountTransactionStats(int accountId)
        {
            try
            {
                var account = await _context.Accounts.FindAsync(accountId);
                if (account == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "الحساب غير موجود"
                    });
                }

                var totalTransactions = await _context.Transactions
                    .CountAsync(t => t.AccountId == accountId);
                var totalDeposits = await _context.Transactions
                    .Where(t => t.AccountId == accountId && t.Type == "Deposit")
                    .SumAsync(t => t.Amount);
                var totalWithdrawals = await _context.Transactions
                    .Where(t => t.AccountId == accountId && t.Type == "Withdrawal")
                    .SumAsync(t => t.Amount);
                var totalCallCosts = await _context.Transactions
                    .Where(t => t.AccountId == accountId && t.Type == "CallCost")
                    .SumAsync(t => t.Amount);

                return Ok(new
                {
                    success = true,
                    message = "تم جلب إحصائيات معاملات الحساب بنجاح",
                    data = new
                    {
                        accountId,
                        accountNumber = account.VirtualPhoneNumber,
                        currentBalance = account.Balance,
                        totalTransactions,
                        totalDepositsSAR = totalDeposits,
                        totalWithdrawalsSAR = totalWithdrawals,
                        totalCallCostsSAR = totalCallCosts,
                        totalSpentSAR = totalWithdrawals + totalCallCosts
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"خطأ في جلب إحصائيات معاملات الحساب {accountId}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "خطأ في جلب إحصائيات معاملات الحساب",
                    error = ex.Message
                });
            }
        }
    }

    // Request Models
    public class CreateTransactionRequest
    {
        public int AccountId { get; set; }
        public decimal Amount { get; set; }
        public required string Type { get; set; }
        public string? Description { get; set; }
    }
}
