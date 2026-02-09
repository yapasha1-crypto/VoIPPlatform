using System.Globalization;
using System.Xml.Linq; // For XML parsing if needed, or regex if text
using VoIPPlatform.API.Models;
using Microsoft.EntityFrameworkCore;

namespace VoIPPlatform.API.Services
{
    public class VoIPInfoCenterService : IVoIPInfoCenterService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<VoIPInfoCenterService> _logger;
        private readonly IServiceProvider _serviceProvider;

        public VoIPInfoCenterService(HttpClient httpClient, IConfiguration configuration, ILogger<VoIPInfoCenterService> logger, IServiceProvider serviceProvider)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        private async Task<(string Url, string User, string Pass)> GetCredentialsAsync()
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<VoIPDbContext>();
                    var settings = await context.SystemSettings
                            .Where(s => s.Group == "VoIPProvider")
                            .ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);

                    var url = settings.GetValueOrDefault("ApiUrl");
                    if (string.IsNullOrEmpty(url)) url = _configuration["VoIPProvider:ApiUrl"] ?? "https://www.voipinfocenter.com/API/Request.ashx";

                    var user = settings.GetValueOrDefault("ApiUsername");
                    if (string.IsNullOrEmpty(user)) user = _configuration["VoIPProvider:ApiUsername"] ?? "";

                    var pass = settings.GetValueOrDefault("ApiPassword");
                    if (string.IsNullOrEmpty(pass)) pass = _configuration["VoIPProvider:ApiPassword"] ?? "";

                    return (url, user, pass);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve VoIP credentials from DB, falling back to config.");
                return (
                    _configuration["VoIPProvider:ApiUrl"] ?? "https://www.voipinfocenter.com/API/Request.ashx",
                    _configuration["VoIPProvider:ApiUsername"] ?? "",
                    _configuration["VoIPProvider:ApiPassword"] ?? ""
                );
            }
        }

        public async Task<(bool Success, string Error)> CreateCustomerAsync(string customerUser, string customerPass, string? phoneNumber = null, string countryCode = "752", string initialBalance = "0", string? timezone = null, int tariffId = -3)
        {
            // Add User-Agent to avoid being treated as a bot/crawler redirect
            if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
            {
                _httpClient.DefaultRequestHeaders.Add("User-Agent", "VoIPPlatform-Client/1.0");
            }

            // Verify credentials are read correctly
            var (baseUrl, rUser, rPass) = await GetCredentialsAsync();
            rUser = rUser.Trim();
            rPass = rPass.Trim();
            
            var geoCallCli = phoneNumber ?? "";
            // Ensure phone starts with + if not empty
            if (!string.IsNullOrEmpty(geoCallCli) && !geoCallCli.StartsWith("+")) 
            {
                geoCallCli = "+" + geoCallCli;
            }

            // Construct URL parameters
            var paramUsername = Uri.EscapeDataString(rUser); // Encoded per docs implication
            var paramPassword = Uri.EscapeDataString(rPass); // Encoded per docs implication
            var paramCustomer = Uri.EscapeDataString(customerUser);
            var paramCustomerPass = Uri.EscapeDataString(customerPass);
            var paramGeoCall = Uri.EscapeDataString(geoCallCli); // Becomes %2B...
            var paramCountry = countryCode;
            var paramTimezone = Uri.EscapeDataString(timezone ?? "");
            var paramTariff = tariffId;

            // Log the 'Effective' URL for debugging (Masking password)
            var debugUrl = $"{baseUrl}?command=createcustomer&username={paramUsername}&password=***&customer={paramCustomer}&geocallcli={paramGeoCall}&tariffrate={paramTariff}&country={paramCountry}&timezone={paramTimezone}";
            _logger.LogInformation("VoIPInfoCenter Request URL: {Url}", debugUrl);

            var url = $"{baseUrl}?command=createcustomer" +
                      $"&username={paramUsername}" + 
                      $"&password={paramPassword}" + 
                      $"&customer={paramCustomer}" +
                      $"&customerpassword={paramCustomerPass}" +
                      $"&geocallcli={paramGeoCall}" + 
                      $"&tariffrate={paramTariff}" +
                      $"&country={paramCountry}" + 
                      $"&timezone={paramTimezone}";

            try
            {
                var response = await _httpClient.GetStringAsync(url);
                _logger.LogInformation("CreateCustomer Response: {Response}", response);
                
                // Success Check
                if (response.Contains("<Result>Success</Result>", StringComparison.OrdinalIgnoreCase) || 
                    response.Contains("Customer was created", StringComparison.OrdinalIgnoreCase))
                {
                     _logger.LogInformation("VoIPInfoCenter API Success: {Response}", response);
                     return (true, string.Empty);
                }

                // Check for HTML response (Login Page Redirect)
                if (response.TrimStart().StartsWith("<!DOCTYPE html", StringComparison.OrdinalIgnoreCase) ||
                    response.Contains("<html", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogError("VoIPInfoCenter API returned HTML. Response: {Response}", response);
                    return (false, "Cloudflare/Firewall Blocked Request (HTML Response).");
                }
                
                // Extract Reason from XML
                var reasonMatch = System.Text.RegularExpressions.Regex.Match(response, @"<Reason>(.*?)</Reason>");
                var failureReason = reasonMatch.Success ? reasonMatch.Groups[1].Value : "Unknown Failure";

                // If no reason found, check for plain text
                if (string.IsNullOrEmpty(failureReason) && !response.Contains("<")) failureReason = response; // Fallback to raw response

                _logger.LogWarning("VoIPInfoCenter API returned failure: {Reason}", failureReason);
                return (false, failureReason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create customer in VoIPInfoCenter");
                return (false, "Internal Exception during External Request.");
            }
        }

        public async Task<bool> ChangePasswordAsync(string customerUser, string oldPassword, string newPassword)
        {
            // Verify credentials are read correctly
            var (baseUrl, rUser, rPass) = await GetCredentialsAsync();
            rUser = rUser.Trim();
            rPass = rPass.Trim();

            var url = $"{baseUrl}?command=changepassword" +
                      $"&username={rUser}" +
                      $"&password={rPass}" + // Send RAW (assuming same requirement as createcustomer)
                      $"&customer={Uri.EscapeDataString(customerUser)}" +
                      $"&oldcustomerpassword={Uri.EscapeDataString(oldPassword)}" +
                      $"&newcustomerpassword={Uri.EscapeDataString(newPassword)}";

            try
            {
                // specific logging for debugging if needed, masking passwords
                _logger.LogInformation("Changing password for {User}...", customerUser);

                var response = await _httpClient.GetStringAsync(url);
                _logger.LogInformation("ChangePassword Response: {Response}", response);

                if (response.Contains("<Result>Success</Result>", StringComparison.OrdinalIgnoreCase) ||
                    response.Contains("Password changed", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                _logger.LogWarning("ChangePassword Failed: {Response}", response);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to call ChangePassword API");
                return false;
            }
        }

        public async Task<decimal?> GetUserBalanceAsync(string customerUser, string? password = null)
        {
            var (baseUrl, rUser, rPass) = await GetCredentialsAsync();
            var url = $"{baseUrl}?command=getuserinfo" +
                      $"&username={rUser}" +
                      $"&password={rPass}" +
                      $"&customer={customerUser}";

            if (!string.IsNullOrEmpty(password))
            {
                url += $"&customerpassword={password}";
            }

            try
            {
                var response = await _httpClient.GetStringAsync(url);
                _logger.LogInformation("GetUserInfo Response: {Response}", response);

                if (string.IsNullOrWhiteSpace(response)) return null;

                // 1. Try XML Parsing with DTD ignored
                try 
                {
                    if (response.Trim().StartsWith("<"))
                    {
                        var settings = new System.Xml.XmlReaderSettings { DtdProcessing = System.Xml.DtdProcessing.Ignore };
                        using (var reader = System.Xml.XmlReader.Create(new StringReader(response), settings))
                        {
                            var doc = XDocument.Load(reader);
                            var balanceElement = doc.Descendants("Balance").FirstOrDefault() 
                                              ?? doc.Descendants("balance").FirstOrDefault();

                            if (balanceElement != null && decimal.TryParse(balanceElement.Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var balance))
                            {
                                return balance;
                            }
                        }
                    }
                }
                catch (Exception xmlEx) 
                { 
                     _logger.LogWarning(xmlEx, "XML parsing with DTD ignore failed.");
                }

                // 2. Fallback: Regex specifically for <Balance> value
                var balanceMatch = System.Text.RegularExpressions.Regex.Match(response, @"<Balance>(.*?)</Balance>", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (balanceMatch.Success && decimal.TryParse(balanceMatch.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var regexBalance))
                {
                    return regexBalance;
                }

                // 3. Last resort: Try Simple Text (First token)
                var parts = response.Split(' ', ',', ';', '\n');
                if (parts.Length > 0 && decimal.TryParse(parts[0], NumberStyles.Any, CultureInfo.InvariantCulture, out var textBalance))
                {
                    return textBalance;
                }
                
                return null; 
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get user balance");
                return null;
            }
        }

        public async Task<List<ExternalCallRecord>> GetCallOverviewAsync(string customerUser, string customerPass)
        {
            var (baseUrl, rUser, rPass) = await GetCredentialsAsync();
            var url = $"{baseUrl}?command=calloverview" +
                      $"&username={rUser}" +
                      $"&password={rPass}" +
                      $"&customer={customerUser}" +
                      $"&customerpassword={customerPass}" +
                      $"&direction=backward" +
                      $"&recordcount=50";

            try
            {
                var response = await _httpClient.GetStringAsync(url);
                _logger.LogInformation("CallOverview Response: {Response}", response);

                var records = new List<ExternalCallRecord>();

                if (string.IsNullOrWhiteSpace(response) || !response.Trim().StartsWith("<"))
                {
                    return records;
                }

                // Parse XML
                try
                {
                    var settings = new System.Xml.XmlReaderSettings { DtdProcessing = System.Xml.DtdProcessing.Ignore };
                    using (var reader = System.Xml.XmlReader.Create(new StringReader(response), settings))
                    {
                        var doc = XDocument.Load(reader);
                        // Adjust element names based on actual API response structure (guessing common standard)
                        // XML usually has a root like <CallHistory> or <Calls> and items <Call> or <Record>
                        var callElements = doc.Descendants("Call").Concat(doc.Descendants("Record")); 

                        foreach (var el in callElements)
                        {
                            var record = new ExternalCallRecord
                            {
                                CallId = el.Element("CallId")?.Value ?? el.Element("id")?.Value ?? "",
                                Date = DateTime.TryParse(el.Element("Date")?.Value ?? el.Element("StartTime")?.Value, out var dt) ? dt : DateTime.MinValue,
                                Source = el.Element("Source")?.Value ?? el.Element("CallerID")?.Value ?? "",
                                Destination = el.Element("Destination")?.Value ?? el.Element("CalledNumber")?.Value ?? "",
                                Duration = int.TryParse(el.Element("Duration")?.Value, out var dur) ? dur : 0,
                                Cost = decimal.TryParse(el.Element("Cost")?.Value ?? el.Element("Price")?.Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var cost) ? cost : 0,
                                Status = el.Element("Status")?.Value ?? (el.Element("Cost") != null ? "Completed" : "Unknown")
                            };
                            records.Add(record);
                        }
                    }
                }
                catch (Exception xmlEx)
                {
                    _logger.LogWarning(xmlEx, "Error parsing CallOverview XML.");
                }

                return records;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get call overview");
                return new List<ExternalCallRecord>();
            }
        }

        public async Task<bool> AddTransactionAsync(string username, decimal amount)
        {
            try
            {
                var (baseUrl, rUser, rPass) = await GetCredentialsAsync();
                var resellerUsername = rUser.Trim();
                var resellerPassword = rPass.Trim();

                // Format amount to use dot separator and 2 decimal places (e.g. 2.50)
                var formattedAmount = amount.ToString("0.00", CultureInfo.InvariantCulture);

                // Construct the API URL
                // Note: API Amount parameter accepts negative for deduction
                var url = $"{baseUrl}?command=settransaction&username={resellerUsername}&password={resellerPassword}&customer={username}&amount={formattedAmount}";

                _logger.LogInformation($"VoIPInfoCenter SetTransaction Request URL: {url.Replace(resellerPassword, "******")}");

                var response = await _httpClient.GetStringAsync(url);
                _logger.LogInformation("VoIPInfoCenter SetTransaction Response: {Response}", response);

                if (string.IsNullOrWhiteSpace(response))
                {
                    return false;
                }

                // Check for success (Usually returns "Success" or specific XML)
                if (response.Contains("<Result>Failed</Result>") || response.StartsWith("Error"))
                {
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding transaction for user {Username}", username);
                return false;
            }
        }

        public async Task<bool> AddPhoneNumberAsync(string username, string phoneNumber)
        {
            return await ManagePhoneNumberAsync(username, phoneNumber, "add");
        }

        public async Task<bool> DeletePhoneNumberAsync(string username, string phoneNumber)
        {
            return await ManagePhoneNumberAsync(username, phoneNumber, "delete");
        }

        private async Task<bool> ManagePhoneNumberAsync(string username, string phoneNumber, string option)
        {
            var (baseUrl, rUser, rPass) = await GetCredentialsAsync();
            rUser = rUser.Trim();
            rPass = rPass.Trim();
            
            // Format phone number to international format if needed
            if (!phoneNumber.StartsWith("+")) phoneNumber = "+" + phoneNumber;

            var url = $"{baseUrl}?command=changeuserinfo" +
                      $"&username={rUser}" +
                      $"&password={rPass}" +
                      $"&customer={Uri.EscapeDataString(username)}" +
                      $"&geocallcli_options={option}" +
                      $"&geocallcli={Uri.EscapeDataString(phoneNumber)}";

            try
            {
                _logger.LogInformation("Managing phone number for {User}: {Option} {Phone}...", username, option, phoneNumber);
                var response = await _httpClient.GetStringAsync(url);
                _logger.LogInformation("ManagePhoneNumber Response: {Response}", response);

                if (response.Contains("<Result>Success</Result>") || response.Contains("Success", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
                
                _logger.LogWarning("ManagePhoneNumber Failed: {Response}", response);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to manage phone number");
                return false;
            }
        }

        public async Task<(bool Success, string Message)> SetCustomerBlockStatusAsync(string username, bool isBlocked)
        {
             var (baseUrl, rUser, rPass) = await GetCredentialsAsync();
             rUser = rUser.Trim();
             rPass = rPass.Trim();
             var blockStr = isBlocked ? "true" : "false";

             var url = $"{baseUrl}?command=changeuserinfo" +
                       $"&username={rUser}" +
                       $"&password={rPass}" +
                       $"&customer={Uri.EscapeDataString(username)}" +
                       $"&customerblocked={blockStr}";

             try
             {
                 _logger.LogInformation("Setting block status for {User} to {Block}...", username, isBlocked);
                 var response = await _httpClient.GetStringAsync(url);
                 _logger.LogInformation("SetCustomerBlockStatus Response: {Response}", response);

                 if (response.Contains("<Result>Success</Result>") || response.Contains("Success", StringComparison.OrdinalIgnoreCase))
                 {
                     return (true, "Block status updated successfully");
                 }
                 
                 return (false, response);
             }
             catch (Exception ex)
             {
                 _logger.LogError(ex, "Failed to block/unblock user");
                 return (false, ex.Message);
             }
        }

        public async Task<bool> ValidateUserAsync(string username, string password)
        {
            var (baseUrl, rUser, rPass) = await GetCredentialsAsync();
            var url = $"{baseUrl}?command=validateuser" +
                      $"&username={rUser.Trim()}" +
                      $"&password={rPass.Trim()}" +
                      $"&customer={Uri.EscapeDataString(username)}" +
                      $"&customerpassword={Uri.EscapeDataString(password)}";

            try
            {
                var response = await _httpClient.GetStringAsync(url);
                _logger.LogInformation("ValidateUser Response: {Response}", response);
                
                return response.Contains("<Result>Success</Result>") || 
                       response.Contains("Valid", StringComparison.OrdinalIgnoreCase) ||
                       response.Contains("Success", StringComparison.OrdinalIgnoreCase);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to validate user");
                return false;
            }
        }

        public async Task<bool> ResetPasswordAsync(string username, string newPassword)
        {
            var (baseUrl, rUser, rPass) = await GetCredentialsAsync();
            var url = $"{baseUrl}?command=resetpassword" +
                      $"&username={rUser.Trim()}" +
                      $"&password={rPass.Trim()}" +
                      $"&customer={Uri.EscapeDataString(username)}" +
                      $"&newcustomerpassword={Uri.EscapeDataString(newPassword)}";

            try
            {
                _logger.LogInformation("Resetting password for {User}...", username);
                var response = await _httpClient.GetStringAsync(url);
                _logger.LogInformation("ResetPassword Response: {Response}", response);

                return response.Contains("<Result>Success</Result>") || response.Contains("Success", StringComparison.OrdinalIgnoreCase);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to reset password");
                return false;
            }
        }
    }
}
