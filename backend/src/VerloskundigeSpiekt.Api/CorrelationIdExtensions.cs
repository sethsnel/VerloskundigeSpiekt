namespace VerloskundigeSpiekt.Api;

public static class CorrelationIdExtensions
{
    public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder app) => app.Use(async (context, next) =>
    {
        var supplied = context.Request.Headers.TryGetValue("X-Correlation-ID", out var requested) ? requested.ToString() : null;
        var correlationId = IsSafe(supplied) ? supplied! : Guid.NewGuid().ToString("N");
        context.TraceIdentifier = correlationId;
        context.Response.Headers["X-Correlation-ID"] = correlationId;
        await next();
    });

    private static bool IsSafe(string? value) => value is { Length: > 0 and <= 64 }
        && value.All(character => char.IsAsciiLetterOrDigit(character) || character is '-' or '_' or '.');
}
