namespace VoIPPlatform.API.Exceptions
{
    /// <summary>
    /// استثناء الطلب السيء
    /// </summary>
    public class BadRequestException : Exception
    {
        public string MessageAr { get; set; }

        public BadRequestException(string message, string messageAr)
            : base(message)
        {
            MessageAr = messageAr;
        }
    }

    /// <summary>
    /// استثناء عدم التفويض
    /// </summary>
    public class UnauthorizedException : Exception
    {
        public string MessageAr { get; set; }

        public UnauthorizedException(string message, string messageAr)
            : base(message)
        {
            MessageAr = messageAr;
        }
    }

    /// <summary>
    /// استثناء عدم وجود المورد
    /// </summary>
    public class NotFoundException : Exception
    {
        public string MessageAr { get; set; }

        public NotFoundException(string message, string messageAr = "المورد غير موجود")
            : base(message)
        {
            MessageAr = messageAr;
        }
    }

    /// <summary>
    /// استثناء الموارد المحظورة
    /// </summary>
    public class ForbiddenException : Exception
    {
        public string MessageAr { get; set; }

        public ForbiddenException(string message, string messageAr)
            : base(message)
        {
            MessageAr = messageAr;
        }
    }
}
