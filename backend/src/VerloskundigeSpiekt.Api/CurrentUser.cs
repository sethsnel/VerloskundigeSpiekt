using System.Security.Claims;
using VerloskundigeSpiekt.Application;

namespace VerloskundigeSpiekt.Api;

public sealed class HttpCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal Principal => accessor.HttpContext?.User ?? new ClaimsPrincipal();
    public Guid? UserId => Guid.TryParse(Principal.FindFirstValue("local_user_id"), out var value) ? value : null;
    public string ExternalSubject => Principal.FindFirstValue("sub") ?? string.Empty;
    public string? Email => Principal.FindFirstValue("email");
    public string? NormalizedEmail => Email?.Trim().ToUpperInvariant();
    public bool EmailVerified => bool.TryParse(Principal.FindFirstValue("email_verified"), out var verified) && verified;
    public bool IsAuthenticated => Principal.Identity?.IsAuthenticated == true;
}
