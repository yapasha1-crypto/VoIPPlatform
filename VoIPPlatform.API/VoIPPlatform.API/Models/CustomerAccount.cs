namespace VoIPPlatform.API.Models
{
    public class CustomerAccount
    {
        public int Id { get; set; }

        public int? ResellerId { get; set; }

        // ربط مع حساب VoIPInfoCenter
        public required string VoipUsername { get; set; }
        public required string VoipPassword { get; set; }

        // معلومات العميل المحلية
        public required string FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }

        // رصيد محلي عندك (غير عن رصيد مزود الـ VoIP)
        public decimal LocalBalance { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
