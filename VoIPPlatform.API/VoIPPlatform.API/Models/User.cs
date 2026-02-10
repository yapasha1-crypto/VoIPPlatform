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

        // ==================== Hierarchy & Multi-Tenant Fields (Phase 5) ====================

        // Parent-Child Hierarchy (Self-Referencing)
        // NULL for Admin/Reseller, Set for Company/User
        public int? ParentUserId { get; set; }

        // Direct Reseller Reference (Denormalized for Performance)
        // NULL for Admin, Set for Reseller/Company/User
        public int? ResellerId { get; set; }

        // ==================== Channel Management (Phase 5) ====================

        // Maximum Concurrent Calls (Channel Capacity)
        // Default: 1 for Users, 10+ for Companies/SIP Trunks
        public int MaxConcurrentCalls { get; set; } = 1;

        // Current Active Calls (Real-time Counter)
        // Incremented on call start, decremented on call end
        public int ActiveCalls { get; set; } = 0;

        // ==================== Billing Configuration (Phase 5) ====================

        // Billing Type: "PerUsage" (per minute) or "PerChannel" (monthly per channel)
        public string BillingType { get; set; } = "PerUsage";

        // Monthly Cost per Channel (For "PerChannel" billing)
        // Example: $10.00 per channel/month for Companies
        public decimal ChannelRate { get; set; } = 10.00m;

        // ==================== العلاقات (Navigation Properties) ====================

        // Parent User (for Hierarchy)
        public virtual User? ParentUser { get; set; }

        // Reseller (Denormalized Reference)
        public virtual User? Reseller { get; set; }

        // Child Users (Companies under Reseller, Users under Company)
        public virtual ICollection<User> ChildUsers { get; set; } = new List<User>();

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
