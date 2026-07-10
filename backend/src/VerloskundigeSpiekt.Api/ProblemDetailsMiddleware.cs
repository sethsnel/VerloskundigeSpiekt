using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using VerloskundigeSpiekt.Application;

namespace VerloskundigeSpiekt.Api;

public sealed partial class ProblemDetailsMiddleware(RequestDelegate next, ILogger<ProblemDetailsMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ApiOperationException exception)
        {
            context.Response.StatusCode = exception.StatusCode;
            await WriteAsync(context, exception.StatusCode, exception.Code, exception.Message);
        }
        catch (Exception exception)
        {
            var traceId = Activity.Current?.Id ?? context.TraceIdentifier;
            LogUnhandled(logger, exception, traceId);
            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await WriteAsync(context, context.Response.StatusCode, "server.unhandled", "An unexpected error occurred.");
            }
        }
    }

    [LoggerMessage(EventId = 1000, Level = LogLevel.Error, Message = "Unhandled request failure {TraceId}")]
    private static partial void LogUnhandled(ILogger logger, Exception exception, string traceId);

    private static async Task WriteAsync(HttpContext context, int statusCode, string code, string detail)
    {
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(new ProblemDetails { Status = statusCode, Title = "Request failed", Detail = detail, Type = $"https://verloskundigespiekt.nl/problems/{code}", Instance = context.Request.Path, Extensions = { ["code"] = code, ["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier } });
    }
}
