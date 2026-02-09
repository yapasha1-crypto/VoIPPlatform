namespace VoIPPlatform.API.Services
{
    public class VoiceTradingService : IVoiceTradingService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<VoiceTradingService> _logger;

        public VoiceTradingService(HttpClient httpClient, IConfiguration configuration, ILogger<VoiceTradingService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<SMSResponse> SendSMSAsync(string senderNumber, string recipientNumber, string messageText)
        {
            try
            {
                var username = _configuration["VoiceTrading:Username"];
                var password = _configuration["VoiceTrading:Password"];

                if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                {
                    _logger.LogError("VoiceTrading credentials not configured");
                    return new SMSResponse
                    {
                        Success = false,
                        Message = "خدمة الرسائل غير مكونة",
                        ErrorMessage = "Configuration error"
                    };
                }

                var baseUrl = _configuration["VoiceTrading:ApiUrl"] ?? "https://www.voicetrading.com/myaccount/sendsms.php";
                var url = $"{baseUrl}?" +
                          $"username={Uri.EscapeDataString(username)}" +
                          $"&password={Uri.EscapeDataString(password)}" +
                          $"&from={Uri.EscapeDataString(senderNumber)}" +
                          $"&to={Uri.EscapeDataString(recipientNumber)}" +
                          $"&text={Uri.EscapeDataString(messageText)}";

                _logger.LogInformation("Sending SMS to {RecipientNumber} from {SenderNumber}", recipientNumber, senderNumber);

                var response = await _httpClient.GetAsync(url);
                var responseContent = await response.Content.ReadAsStringAsync();

                // Simple XML check based on documentation
                // Success: <result>1</result><resultstring>success</resultstring>
                // Failure: <result>0</result>...
                
                // Check for Space-Separated Format (e.g., "1 1 success 1 0 none eso2pfmra02964boreunev4qt8")
                if (!responseContent.Trim().StartsWith("<") && responseContent.Contains("success", StringComparison.OrdinalIgnoreCase))
                {
                    var parts = responseContent.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    // Usually the last part is the ID, or near the end.
                    // For "1 1 success 1 0 none [ID]", let's assume the last part is the ID if it's long.
                    var externalId = parts.LastOrDefault() ?? Guid.NewGuid().ToString();

                    _logger.LogInformation("SMS sent successfully (Text Format). ExternalId: {ExternalId}", externalId);

                    return new SMSResponse
                    {
                        Success = true,
                        Message = "تم إرسال الرسالة بنجاح",
                        ExternalId = externalId
                    };
                }

                // XML Check (Legacy/Alternate)
                // Success: <result>1</result><resultstring>success</resultstring>
                if (responseContent.Contains("<result>1</result>") || responseContent.Contains("<resultstring>success</resultstring>"))
                {
                    _logger.LogInformation("SMS sent successfully (XML Format). Response: {Response}", responseContent);

                    return new SMSResponse
                    {
                        Success = true,
                        Message = "تم إرسال الرسالة بنجاح",
                        ExternalId = Guid.NewGuid().ToString() // XML doesn't seem to return an ID, generating one.
                    };
                }
                else
                {
                    _logger.LogWarning("SMS send failed. Response: {Response}", responseContent);
                    
                    // Extract description if possible
                    string errorMsg = "فشل في إرسال الرسالة";
                    if(responseContent.Contains("<description>") && responseContent.Contains("</description>"))
                    {
                        int start = responseContent.IndexOf("<description>") + "<description>".Length;
                        int end = responseContent.IndexOf("</description>");
                        if(end > start)
                        {
                            errorMsg = responseContent.Substring(start, end - start).Trim();
                        }
                    }
                    else if (!responseContent.Trim().StartsWith("<"))
                    {
                        // Plain text error?
                        errorMsg = responseContent;
                    }

                    return new SMSResponse
                    {
                        Success = false,
                        Message = "فشل في إرسال الرسالة",
                        ErrorMessage = errorMsg
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending SMS");

                return new SMSResponse
                {
                    Success = false,
                    Message = "خطأ في إرسال الرسالة",
                    ErrorMessage = ex.Message
                };
            }
        }

        public decimal CalculateSMSCost(string countryCode, int messageLength)
        {
            // SMS Rates - الأسعار حسب الدول
            var rates = new Dictionary<string, decimal>
            {
                { "46", 0.05m },     // السويد
                { "49", 0.07m },     // ألمانيا
                { "44", 0.06m },     // بريطانيا
                { "1", 0.04m },      // أمريكا
                { "default", 0.10m } // السعر الافتراضي
            };

            var baseRate = rates.ContainsKey(countryCode) ? rates[countryCode] : rates["default"];

            // حساب عدد الـ credits:
            // - SMS واحد = 160 حرف
            // - كل 153 حرف إضافي = SMS إضافي
            int creditsNeeded = messageLength <= 160 ? 1 : 1 + (int)Math.Ceiling((messageLength - 160) / 153.0);

            return baseRate * creditsNeeded;
        }

        private string ExtractExternalId(string response)
        {
            // استخراج ID من رد VoiceTrading
            return Guid.NewGuid().ToString();
        }
    }
}