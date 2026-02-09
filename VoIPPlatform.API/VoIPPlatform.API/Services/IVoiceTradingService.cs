namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Interface لخدمة إرسال الرسائل النصية عبر VoiceTrading
    /// </summary>
    public interface IVoiceTradingService
    {
        /// <summary>
        /// إرسال رسالة نصية
        /// </summary>
        Task<SMSResponse> SendSMSAsync(string senderNumber, string recipientNumber, string messageText);

        /// <summary>
        /// حساب تكلفة الرسالة النصية حسب الدولة وطول الرسالة
        /// </summary>
        decimal CalculateSMSCost(string countryCode, int messageLength);
    }

    /// <summary>
    /// رد من خدمة VoiceTrading عند إرسال SMS
    /// </summary>
    public class SMSResponse
    {
        /// <summary>
        /// هل تم إرسال الرسالة بنجاح؟
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// رسالة نصية عن النتيجة
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// معرّف الرسالة الخارجي من VoiceTrading
        /// </summary>
        public string ExternalId { get; set; }

        /// <summary>
        /// رسالة الخطأ (إذا فشلت العملية)
        /// </summary>
        public string ErrorMessage { get; set; }
    }
}

