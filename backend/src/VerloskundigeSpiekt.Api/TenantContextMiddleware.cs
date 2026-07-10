using Microsoft.EntityFrameworkCore;
using VerloskundigeSpiekt.Infrastructure;

namespace VerloskundigeSpiekt.Api;

public sealed class TenantContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        await using var transaction = await db.Database.BeginTransactionAsync(context.RequestAborted);
        var subject = context.User.FindFirst("sub")?.Value ?? string.Empty;
        var email = context.User.FindFirst("email")?.Value ?? string.Empty;
        await db.Database.ExecuteSqlInterpolatedAsync($"select set_config('app.external_subject', {subject}, true), set_config('app.user_email', {email}, true)", context.RequestAborted);
        try
        {
            await next(context);
            await transaction.CommitAsync(context.RequestAborted);
        }
        catch
        {
            await transaction.RollbackAsync(CancellationToken.None);
            throw;
        }
    }
}
