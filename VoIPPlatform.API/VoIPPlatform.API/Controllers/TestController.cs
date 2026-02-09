using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.Models;
using VoIPPlatform.API.Services;
using System.Security.Cryptography;
using System.Text;

namespace VoIPPlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TestController : ControllerBase
    {
        private readonly IVoIPInfoCenterService _voipService;
        private readonly VoIPDbContext _context;

        public TestController(IVoIPInfoCenterService voipService, VoIPDbContext context)
        {
            _voipService = voipService;
            _context = context;
        }

        [HttpGet("balance")]
        public async Task<IActionResult> GetBalance()
        {
            var username = User.Identity?.Name;
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            // Try to get balance, this will use the service logic we just improved
            var balance = await _voipService.GetUserBalanceAsync(username);
            return Ok(new { username, balance });
        }

        [HttpPost("transaction")]
        public async Task<IActionResult> AddTransaction([FromBody] TransactionRequest request)
        {
            if (request.Amount == 0) return BadRequest("Amount must be non-zero");
            
            // Allow specifying a different username for testing, default to current user
            var targetUser = !string.IsNullOrEmpty(request.Username) ? request.Username : User.Identity?.Name;
            if (string.IsNullOrEmpty(targetUser)) return Unauthorized();

            var success = await _voipService.AddTransactionAsync(targetUser, request.Amount);
            return Ok(new { success, targetUser, amount = request.Amount });
        }


        [HttpPost("phone")]
        public async Task<IActionResult> ManagePhone([FromBody] PhoneRequest request)
        {
            var targetUser = !string.IsNullOrEmpty(request.Username) ? request.Username : User.Identity?.Name;
            if (string.IsNullOrEmpty(targetUser)) return Unauthorized();

            bool success;
            if (request.Action?.ToLower() == "delete")
                success = await _voipService.DeletePhoneNumberAsync(targetUser, request.PhoneNumber);
            else
                success = await _voipService.AddPhoneNumberAsync(targetUser, request.PhoneNumber);

            return Ok(new { success, targetUser, action = request.Action, phone = request.PhoneNumber });
        }

        [HttpPost("block")]
        public async Task<IActionResult> BlockUser([FromBody] BlockRequest request)
        {
            var targetUser = !string.IsNullOrEmpty(request.Username) ? request.Username : User.Identity?.Name;
            if (string.IsNullOrEmpty(targetUser)) return Unauthorized();

            var result = await _voipService.SetCustomerBlockStatusAsync(targetUser, request.Block);
            return Ok(new { success = result.Success, targetUser, block = request.Block, message = result.Message });
        }

        [HttpPost("validate")]
        public async Task<IActionResult> ValidateUser([FromBody] ValidateRequest request)
        {
            var targetUser = !string.IsNullOrEmpty(request.Username) ? request.Username : User.Identity?.Name;
            if (string.IsNullOrEmpty(targetUser)) return Unauthorized();

            // Note: Validation usually requires checking the password provided in request against the one on server.
            // But here we are validating a username/password combination passed explicitly.
            var success = await _voipService.ValidateUserAsync(targetUser, request.Password);
            return Ok(new { success, targetUser });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] TestResetPasswordRequest request)
        {
            var targetUser = !string.IsNullOrEmpty(request.Username) ? request.Username : User.Identity?.Name;
            if (string.IsNullOrEmpty(targetUser)) return Unauthorized();

            var success = await _voipService.ResetPasswordAsync(targetUser, request.NewPassword);
            return Ok(new { success, targetUser });
        }

        [HttpGet("calls")]
        public async Task<IActionResult> GetCalls([FromQuery] string? password)
        {
            var username = User.Identity?.Name;
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var calls = await _voipService.GetCallOverviewAsync(username, password ?? "");
            return Ok(new { username, count = calls.Count, calls });
        }

        [HttpGet("users")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users.Select(u => new { u.Id, u.Username, u.IsActive }).ToListAsync();
            return Ok(users);
        }

        [HttpPost("force-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForcePasswordUpdate([FromBody] ForcePasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user == null) return NotFound("User not found");

            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(request.NewPassword));
                user.PasswordHash = Convert.ToBase64String(hashedBytes);
            }
            
            _context.Users.Update(user);
            await _context.SaveChangesAsync();


            return Ok(new { success = true, message = $"Password updated (SHA256) for {request.Username}" });
        }

        public class ForcePasswordRequest
        {
            public required string Username { get; set; }
            public required string NewPassword { get; set; }
        }

        public class TransactionRequest
        {
            public string? Username { get; set; }
            public decimal Amount { get; set; }
        }

        public class PhoneRequest
        {
            public string? Username { get; set; }
            public required string PhoneNumber { get; set; }
            public string? Action { get; set; } // "add" or "delete"
        }

        public class BlockRequest
        {
            public string? Username { get; set; }
            public bool Block { get; set; }
        }

        public class ValidateRequest
        {
            public string? Username { get; set; }
            public required string Password { get; set; }
        }

        public class TestResetPasswordRequest
        {
            public string? Username { get; set; }
            public required string NewPassword { get; set; }
        }

    }
}
