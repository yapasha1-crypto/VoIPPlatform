namespace VoIPPlatform.API.Models
{
    public class ContactNumber
    {
        // معرّف فريد
        public int Id { get; set; }

        // الاتصال مع الحساب والمستخدم
        public int AccountId { get; set; }

        public virtual Account? Account { get; set; }

        public int UserId { get; set; }

        public virtual User? User { get; set; }

        // معلومات جهة الاتصال
        public required string ContactName { get; set; }

        public required string PhoneNumber { get; set; }

        // نوع جهة الاتصال
        public string? ContactType { get; set; } // "Personal", "Business", "Support"

        // ملاحظات
        public string? Notes { get; set; }

        // هل محفوظ
        public bool IsFavorite { get; set; } = false;

        // التواريخ
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
