using Microsoft.EntityFrameworkCore;
namespace VoIPPlatform.API.Models
{
    public class VoIPDbContext : DbContext
    {
        public VoIPDbContext(DbContextOptions<VoIPDbContext> options) : base(options)
        {
        }
        // ==================== جداول البيانات ====================
        public DbSet<User> Users { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Call> Calls { get; set; }
        public DbSet<SMS> SMS { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<ContactNumber> ContactNumbers { get; set; }
        public DbSet<VoIPProvider> VoIPProviders { get; set; }
        public DbSet<CustomerAccount> CustomerAccounts { get; set; }
        public DbSet<Tariff> Tariffs { get; set; }
        public DbSet<Rate> Rates { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<CallRecord> CallRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ==================== User Relations ====================

            // User -> Accounts (One to Many)
            modelBuilder.Entity<Account>()
                .HasOne(a => a.User)
                .WithMany(u => u.Accounts)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // User -> Calls (One to Many)
            modelBuilder.Entity<Call>()
                .HasOne(c => c.User)
                .WithMany(u => u.Calls)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // User -> SMS (One to Many)
            modelBuilder.Entity<SMS>()
                .HasOne(s => s.User)
                .WithMany(u => u.SMSMessages)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // User -> Transactions (One to Many)
            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Account)
                .WithMany(a => a.Transactions)
                .HasForeignKey(t => t.AccountId)
                .OnDelete(DeleteBehavior.NoAction);

            // User -> ContactNumber (One to Many)
            modelBuilder.Entity<ContactNumber>()
                .HasOne(cn => cn.User)
                .WithMany(u => u.ContactNumbers)
                .HasForeignKey(cn => cn.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // User -> CallRecords (One to Many)
            modelBuilder.Entity<CallRecord>()
                .HasOne(cr => cr.User)
                .WithMany()
                .HasForeignKey(cr => cr.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // ==================== Account Relations ====================

            // Account -> Calls (One to Many)
            modelBuilder.Entity<Call>()
                .HasOne(c => c.Account)
                .WithMany(a => a.Calls)
                .HasForeignKey(c => c.AccountId)
                .OnDelete(DeleteBehavior.NoAction);

            // Account -> SMS (One to Many)
            modelBuilder.Entity<SMS>()
                .HasOne(s => s.Account)
                .WithMany(a => a.SMSMessages)
                .HasForeignKey(s => s.AccountId)
                .OnDelete(DeleteBehavior.NoAction);

            // Account -> Reports (One to Many)
            modelBuilder.Entity<Report>()
                .HasOne(r => r.Account)
                .WithMany(a => a.Reports)
                .HasForeignKey(r => r.AccountId)
                .OnDelete(DeleteBehavior.NoAction);

            // Account -> Invoices (One to Many)
            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.Account)
                .WithMany()
                .HasForeignKey(i => i.AccountId)
                .OnDelete(DeleteBehavior.Cascade);

            // AuditLog -> User (One to Many, Optional)
            modelBuilder.Entity<AuditLog>()
                .HasOne(al => al.User)
                .WithMany()
                .HasForeignKey(al => al.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // ==================== Indexes & Unique Constraints ====================

            // تعريف الحقول الفريدة
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Account>()
                .HasIndex(a => a.VirtualPhoneNumber)
                .IsUnique();

            // ==================== Decimal Precision ====================

            // User Decimal Fields
            modelBuilder.Entity<User>()
                .Property(u => u.AccountBalance)
                .HasPrecision(18, 2);

            // Account Decimal Fields
            modelBuilder.Entity<Account>()
                .Property(a => a.Balance)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Account>()
                .Property(a => a.MonthlyUsage)
                .HasPrecision(18, 2);

            // Call Decimal Fields
            modelBuilder.Entity<Call>()
                .Property(c => c.Cost)
                .HasPrecision(18, 2);

            // SMS Decimal Fields
            modelBuilder.Entity<SMS>()
                .Property(s => s.Cost)
                .HasPrecision(18, 2);

            // Transaction Decimal Fields
            modelBuilder.Entity<Transaction>()
                .Property(t => t.Amount)
                .HasPrecision(18, 2);

            // Report Decimal Fields
            modelBuilder.Entity<Report>()
                .Property(r => r.TotalCallCost)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Report>()
                .Property(r => r.TotalSMSCost)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Report>()
                .Property(r => r.TotalRevenue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Report>()
                .Property(r => r.StartingBalance)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Report>()
                .Property(r => r.EndingBalance)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Report>()
                .Property(r => r.TotalDeducted)
                .HasPrecision(18, 2);

            // CallRecord Decimal Fields
            modelBuilder.Entity<CallRecord>()
                .Property(cr => cr.Cost)
                .HasPrecision(18, 2);

            // Tariff & Rate Configuration
            modelBuilder.Entity<Rate>()
                .Property(r => r.Price)
                .HasPrecision(18, 5); // Higher precision for per-minute rates

            modelBuilder.Entity<Tariff>()
                .HasMany(t => t.Rates)
                .WithOne(r => r.Tariff)
                .HasForeignKey(r => r.TariffId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

}