using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using VerloskundigeSpiekt.Application;
using VerloskundigeSpiekt.Domain;
using VerloskundigeSpiekt.Infrastructure;

namespace VerloskundigeSpiekt.Api;

public static class AuthorizationPolicies
{
    public const string PracticeMember = "practice-member";
    public const string PracticeAdministrator = "practice-administrator";
    public const string PracticeOwner = "practice-owner";
    public const string GlobalAdministrator = "global-administrator";
}

public sealed record PracticeRoleRequirement(PracticeRole MinimumRole) : IAuthorizationRequirement;
public sealed class GlobalAdministratorRequirement : IAuthorizationRequirement;

public sealed class PracticeRoleAuthorizationHandler(AppDbContext db, ICurrentUser currentUser) : AuthorizationHandler<PracticeRoleRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PracticeRoleRequirement requirement)
    {
        if (!currentUser.IsAuthenticated || context.Resource is not HttpContext httpContext || !Guid.TryParse(httpContext.Request.RouteValues["practiceId"]?.ToString(), out var practiceId)) return;
        var role = await db.PracticeMembers.Where(member => member.PracticeId == practiceId && member.User.ExternalSubject == currentUser.ExternalSubject).Select(member => (PracticeRole?)member.Role).SingleOrDefaultAsync(httpContext.RequestAborted);
        if (role.HasValue && role.Value >= requirement.MinimumRole) context.Succeed(requirement);
    }
}

public sealed class GlobalAdministratorAuthorizationHandler(AppDbContext db, ICurrentUser currentUser) : AuthorizationHandler<GlobalAdministratorRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, GlobalAdministratorRequirement requirement)
    {
        if (currentUser.IsAuthenticated && await db.Users.AnyAsync(user => user.ExternalSubject == currentUser.ExternalSubject && user.IsGlobalAdministrator)) context.Succeed(requirement);
    }
}
