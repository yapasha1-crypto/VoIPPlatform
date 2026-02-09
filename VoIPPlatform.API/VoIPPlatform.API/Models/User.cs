namespace VoIPPlatform.API.Models
{
    public class User
    {
        // معرّف فريد
        public int Id { get; set; }

        // البيانات الأساسية

        public string Role { get; set; } = "Customer"; // Default role

        public required string Username { get; set; }
        public required string Email { get; set; }

        public string? PhoneNumber { get; set; }

        // كلمة المرور المشفرة
        public required string PasswordHash { get; set; }

        // معلومات شخصية
        public required string FirstName { get; set; }

        public required string LastName { get; set; }

        public string FullName => $"{FirstName} {LastName}".Trim();


        // حالة الحساب
        public bool IsEmailVerified { get; set; } = false;

        public bool IsActive { get; set; } = true;

        // التواريخ
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? LastLoginAt { get; set; }

        // الرصيد
        public decimal AccountBalance { get; set; } = 0;

        // ==================== العلاقات (Navigation Properties) ====================

        // حسابات المستخدم
        public virtual ICollection<Account> Accounts { get; set; } = new List<Account>();

        // مكالمات المستخدم
        public virtual ICollection<Call> Calls { get; set; } = new List<Call>();

        // رسائل SMS للمستخدم
        public virtual ICollection<SMS> SMSMessages { get; set; } = new List<SMS>();

        // معاملات مالية للمستخدم
        public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

        // جهات الاتصال للمستخدم
        public virtual ICollection<ContactNumber> ContactNumbers { get; set; } = new List<ContactNumber>();
    }
}
