namespace VoIPPlatform.API.Middleware;

using Microsoft.AspNetCore.Http;
using VoIPPlatform.API.Exceptions;

public class GlobalExceptionHandler
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(RequestDelegate next, ILogger<GlobalExceptionHandler> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse();

        switch (exception)
        {
            case BadRequestException ex:
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                response.StatusCode = StatusCodes.Status400BadRequest;
                response.Message = ex.MessageAr;
                response.MessageEn = ex.Message;
                response.Success = false;
                break;

            case UnauthorizedException ex:
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                response.StatusCode = StatusCodes.Status401Unauthorized;
                response.Message = ex.MessageAr;
                response.MessageEn = ex.Message;
                response.Success = false;
                break;

            case NotFoundException ex:
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                response.StatusCode = StatusCodes.Status404NotFound;
                response.Message = ex.MessageAr;
                response.MessageEn = ex.Message;
                response.Success = false;
                break;

            case ForbiddenException ex:
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                response.StatusCode = StatusCodes.Status403Forbidden;
                response.Message = ex.MessageAr;
                response.MessageEn = ex.Message;
                response.Success = false;
                break;

            default:
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                response.StatusCode = StatusCodes.Status500InternalServerError;
                response.Message = "حدث خطأ داخلي";
                response.MessageEn = "An internal server error occurred";
                response.Success = false;
                break;
        }

        return context.Response.WriteAsJsonAsync(response);
    }

    public class ErrorResponse
    {
        public bool Success { get; set; }
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public string MessageEn { get; set; } = string.Empty;
    }
}