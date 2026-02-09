namespace VoIPPlatform.API.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; set; }
    public string MessageAr { get; set; }
    public string MessageEn { get; set; }

    public AppException(string messageEn, string messageAr, int statusCode = 500)
        : base(messageEn)
    {
        MessageEn = messageEn;
        MessageAr = messageAr;
        StatusCode = statusCode;
    }
}

