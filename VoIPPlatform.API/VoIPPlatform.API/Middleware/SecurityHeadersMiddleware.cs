namespace VoIPPlatform.API.Middleware
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // منع تضمين الموقع في إطار (Prevent Clickjacking)
            context.Response.Headers.Append("X-Frame-Options", "DENY");

            // منع المتصفح من تخمين نوع الملف (MIME Sniffing)
            context.Response.Headers.Append("X-Content-Type-Options", "nosniff");

            // تفعيل حماية XSS للمتصفحات القديمة
            context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");

            // إجبار المتصفح على استخدام HTTPS فقط (HSTS)
            // Strict-Transport-Security: max-age=31536000; includeSubDomains
            // يتم تطبيقه عادة عبر app.UseHsts() لكن يمكن إضافته هنا أيضاً للتحكم الكامل

            // سياسة أمن المحتوى (Basic CSP)
            // السماح بـ unsafe-inline و unsafe-eval للتطوير (Vite/React Development)
            context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; connect-src 'self' https: ws:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';");

            // التحكم في Referrer Policy
            context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

            await _next(context);
        }
    }
}
