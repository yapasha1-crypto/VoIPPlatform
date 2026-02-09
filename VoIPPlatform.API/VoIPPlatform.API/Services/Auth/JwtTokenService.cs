using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services.Auth
{
    public interface IJwtTokenService
    {
        string GenerateToken(User user);
    }

    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<JwtTokenService> _logger;

        public JwtTokenService(IConfiguration configuration, ILogger<JwtTokenService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public string GenerateToken(User user)
        {
            try
            {
                var jwtSettings = _configuration.GetSection("Jwt");
                var secretKey = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
                var issuer = jwtSettings["Issuer"] ?? "VoIPPlatform";
                var audience = jwtSettings["Audience"] ?? "VoIPPlatformUsers";
                var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");

                if (secretKey.Length < 32)
                {
                    throw new InvalidOperationException("JWT Secret must be at least 32 characters long");
                }

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
                var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var role = user.Role?.ToLower() ?? "user";
                var roleTitlecased = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(role);

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email ?? ""),
                    new Claim("FirstName", user.FirstName ?? ""),
                    new Claim("LastName", user.LastName ?? ""),
                    new Claim(ClaimTypes.Role, roleTitlecased)
                };

                // Role Hierarchy: MasterAdmin gets Admin privileges
                // REMOVED: Hardcoded check. Database role "Admin" is now source of truth.
                if (role == "masteradmin" || role == "admin")
                {
                    // Ensure Admin claim is present if not already (safeguard for "admin" vs "Admin")
                    if (!claims.Any(c => c.Type == ClaimTypes.Role && c.Value == "Admin"))
                    {
                        claims.Add(new Claim(ClaimTypes.Role, "Admin"));
                    }
                }

                var token = new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
                    signingCredentials: credentials
                );

                var tokenHandler = new JwtSecurityTokenHandler();
                return tokenHandler.WriteToken(token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating JWT token");
                throw;
            }
        }
    }
}
