using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Events;
using System.Security.Claims;
using System.Text;
using VoIPPlatform.API.Middleware;
using VoIPPlatform.API.Models;
using VoIPPlatform.API.Services;
using VoIPPlatform.API.Services.Auth;

var builder = WebApplication.CreateBuilder(args);

// ============================================
// 1. تكوين Serilog (قبل أي شيء)
// ============================================

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File(
        "logs/app-.txt",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

try
{
    Log.Information("🚀 تطبيق VoIPPlatform قيد الإطلاق...");

    builder.Host.UseSerilog();

    // ============================================
    // 2. إضافة Services
    // ============================================

    builder.Services.AddDbContext<VoIPDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
    );

    // ✅ JWT Token Service
    builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

    // ✅ SMS & Call Services
    builder.Services.AddHttpClient<IVoiceTradingService, VoiceTradingService>();

    // STOPPED: VoIPProvider (External) - Switching to Local SIP Provider
    // builder.Services.AddHttpClient<IVoIPInfoCenterService, VoIPInfoCenterService>();
    builder.Services.AddScoped<IVoIPInfoCenterService, SipVoIPService>();
    builder.Services.AddScoped<IEmailService, EmailService>();

    // ✅ Phase 5: Hierarchy & Channel Management Services
    builder.Services.AddScoped<IChannelManager, ChannelManager>();
    builder.Services.AddScoped<IHierarchyService, HierarchyService>();

    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        });

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
    });

    builder.Services.AddEndpointsApiExplorer();

    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "VoIPPlatform API",
            Version = "v1",
            Description = "API للمنصة الشاملة لخدمات VoIP"
        });

        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "أدخل 'Bearer' متبوعًا بمسافة ثم رمز JWT الخاص بك"
        });

        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                new string[] { }
            }
        });
    });

    // ============================================
    // JWT Authentication
    // ============================================

    var jwtSettings = builder.Configuration.GetSection("Jwt");
    var secretKey = jwtSettings["Secret"] ?? throw new InvalidOperationException("❌ JWT Secret not configured in appsettings.json");
    var issuer = jwtSettings["Issuer"] ?? "VoIPPlatform";
    var audience = jwtSettings["Audience"] ?? "VoIPPlatformUsers";

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = "Bearer";
        options.DefaultChallengeScheme = "Bearer";
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = ClaimTypes.Role
        };
    });

    builder.Services.AddAuthorization();
    builder.Services.AddMemoryCache();
    builder.Services.AddHttpClient();

    // ============================================
    // 3. بناء التطبيق
    // ============================================

    var app = builder.Build();

    // ============================================
    // 3.1 Auto-Migrate Database
    // ============================================
    using (var scope = app.Services.CreateScope())
    {
        try
        {
            var db = scope.ServiceProvider.GetRequiredService<VoIPDbContext>();
            db.Database.Migrate();
            Log.Information("✅ Database migrated successfully.");
        }
        catch (Exception ex)
        {
            Log.Error(ex, "❌ Failed to migrate database.");
        }
    }

    // ============================================
    // 4. تكوين Middleware
    // ============================================

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "VoIPPlatform API v1");
            options.RoutePrefix = "swagger"; // Changed: Swagger at /swagger, Frontend at /
        });
    }

    // ============================================
    // FRONTEND DECOUPLED - Static file serving disabled
    // ============================================
    // app.Use(async (context, next) =>
    // {
    //     context.Response.Headers.Remove("Content-Security-Policy");
    //     context.Response.Headers.Append("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
    //     await next();
    // });

    // app.UseDefaultFiles(); // Serves index.html by default
    // app.UseStaticFiles();  // Serves static files from wwwroot

    app.UseHttpsRedirection();
    app.UseCors("AllowAll");

    // ⭐ Global Exception Handler (قبل authentication)
    app.UseMiddleware<GlobalExceptionHandler>();

    // ⭐ Security Headers
    if (!app.Environment.IsDevelopment())
    {
        app.UseMiddleware<SecurityHeadersMiddleware>();
    }

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    // ============================================
    // 5. تشغيل التطبيق
    // ============================================

    Log.Information("✅ التطبيق جاهز للاستقبال");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "❌ التطبيق توقف بسبب خطأ غير متوقع");
}
finally
{
    Log.CloseAndFlush();
}