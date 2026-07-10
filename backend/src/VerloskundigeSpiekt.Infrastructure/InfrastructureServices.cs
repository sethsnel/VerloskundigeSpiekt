using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using VerloskundigeSpiekt.Application;
using VerloskundigeSpiekt.Domain;

namespace VerloskundigeSpiekt.Infrastructure;

public sealed class PracticeService(AppDbContext db, ICurrentUser currentUser) : IPracticeService
{
    public async Task<MeDto> GetMeAsync(CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        var preference = await db.UserPreferences.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
        return ToMe(user, preference?.ActivePracticeId);
    }

    public async Task<MeDto> UpdateActivePracticeAsync(Guid? practiceId, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        if (practiceId.HasValue && !await IsMemberAsync(user.Id, practiceId.Value, cancellationToken))
            throw new ApiOperationException(ErrorCodes.Forbidden, "The selected practice is not accessible to the current user.", StatusCodes.Status403Forbidden);

        var preference = await db.UserPreferences.SingleOrDefaultAsync(x => x.UserId == user.Id, cancellationToken)
            ?? new UserPreference { UserId = user.Id };
        preference.ActivePracticeId = practiceId;
        if (db.Entry(preference).State == EntityState.Detached) db.Add(preference);
        else db.Update(preference);
        await db.SaveChangesAsync(cancellationToken);
        return ToMe(user, preference.ActivePracticeId);
    }

    public async Task<IReadOnlyList<PracticeDto>> ListAsync(CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        return await db.PracticeMembers.AsNoTracking().Where(x => x.UserId == user.Id).OrderBy(x => x.Practice.Name)
            .Select(x => new PracticeDto(x.PracticeId, x.Practice.Name, x.Practice.Slug, x.Role, x.Practice.CreatedAt, Convert.ToBase64String(x.Practice.RowVersion))).ToListAsync(cancellationToken);
    }

    public async Task<PracticeDto> GetAsync(Guid practiceId, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        var member = await RequireMemberAsync(user.Id, practiceId, cancellationToken);
        return new PracticeDto(member.PracticeId, member.Practice.Name, member.Practice.Slug, member.Role, member.Practice.CreatedAt, Convert.ToBase64String(member.Practice.RowVersion));
    }

    public async Task<PracticeDto> CreateAsync(CreatePracticeRequest request, string? idempotencyKey, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        ValidatePractice(request.Name, request.Slug);
        var normalizedSlug = NormalizeSlug(request.Slug);
        if (!string.IsNullOrWhiteSpace(idempotencyKey))
        {
            var existing = await db.PracticeMembers.Include(x => x.Practice).SingleOrDefaultAsync(x => x.UserId == user.Id && x.Role == PracticeRole.Owner && x.Practice.Slug == normalizedSlug, cancellationToken);
            if (existing is not null)
            {
                if (!string.Equals(existing.Practice.Name, request.Name.Trim(), StringComparison.Ordinal)) throw new ApiOperationException(ErrorCodes.IdempotencyConflict, "The idempotency key matches a different practice request.", StatusCodes.Status409Conflict);
                return new PracticeDto(existing.PracticeId, existing.Practice.Name, existing.Practice.Slug, existing.Role, existing.Practice.CreatedAt, Convert.ToBase64String(existing.Practice.RowVersion));
            }
        }
        var ownsTransaction = db.Database.CurrentTransaction is null;
        await using var transaction = ownsTransaction ? await db.Database.BeginTransactionAsync(cancellationToken) : null;
        var practice = new Practice { Id = Guid.NewGuid(), Name = request.Name.Trim(), Slug = normalizedSlug };
        var member = new PracticeMember { PracticeId = practice.Id, UserId = user.Id, Role = PracticeRole.Owner };
        db.Add(practice);
        db.Add(member);
        var preference = await db.UserPreferences.SingleOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
        if (preference is null) db.Add(new UserPreference { UserId = user.Id, ActivePracticeId = practice.Id });
        else { preference.ActivePracticeId = practice.Id; db.Update(preference); }
        await db.SaveChangesAsync(cancellationToken);
        if (ownsTransaction) await transaction!.CommitAsync(cancellationToken);
        return new PracticeDto(practice.Id, practice.Name, practice.Slug, member.Role, practice.CreatedAt, Convert.ToBase64String(practice.RowVersion));
    }

    public async Task<PracticeDto> UpdateAsync(Guid practiceId, UpdatePracticeRequest request, byte[]? expectedVersion, CancellationToken cancellationToken)
    {
        ValidatePractice(request.Name, request.Slug);
        var user = await RequireUserAsync(cancellationToken);
        var member = await RequireMemberAsync(user.Id, practiceId, cancellationToken);
        RequireAdministrator(member);
        EnsureVersion(member.Practice.RowVersion, expectedVersion);
        member.Practice.Name = request.Name.Trim();
        member.Practice.Slug = NormalizeSlug(request.Slug);
        await db.SaveChangesAsync(cancellationToken);
        return new PracticeDto(practiceId, member.Practice.Name, member.Practice.Slug, member.Role, member.Practice.CreatedAt, Convert.ToBase64String(member.Practice.RowVersion));
    }

    public async Task<IReadOnlyList<MemberDto>> ListMembersAsync(Guid practiceId, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        await RequireMemberAsync(user.Id, practiceId, cancellationToken);
        return await db.PracticeMembers.AsNoTracking().Where(x => x.PracticeId == practiceId).OrderBy(x => x.User.DisplayName).Select(x => new MemberDto(x.UserId, x.User.Email, x.User.DisplayName, x.Role, Convert.ToBase64String(x.RowVersion))).ToListAsync(cancellationToken);
    }

    public async Task UpdateMemberRoleAsync(Guid practiceId, Guid userId, PracticeRole role, byte[]? expectedVersion, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        var actor = await RequireMemberAsync(user.Id, practiceId, cancellationToken);
        RequireAdministrator(actor);
        var target = await RequireMemberAsync(userId, practiceId, cancellationToken);
        if (target.Role == PracticeRole.Owner && role != PracticeRole.Owner && !await HasAnotherOwnerAsync(practiceId, userId, cancellationToken))
            throw new ApiOperationException(ErrorCodes.OnlyOwner, "A practice must always have an owner.", StatusCodes.Status409Conflict);
        EnsureVersion(target.RowVersion, expectedVersion);
        target.Role = role;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveMemberAsync(Guid practiceId, Guid userId, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        var actor = await RequireMemberAsync(user.Id, practiceId, cancellationToken);
        RequireAdministrator(actor);
        var target = await RequireMemberAsync(userId, practiceId, cancellationToken);
        if (target.Role == PracticeRole.Owner && !await HasAnotherOwnerAsync(practiceId, userId, cancellationToken))
            throw new ApiOperationException(ErrorCodes.OnlyOwner, "The only owner cannot be removed.", StatusCodes.Status409Conflict);
        db.Remove(target);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task TransferOwnershipAsync(Guid practiceId, Guid newOwnerId, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        var actor = await RequireMemberAsync(user.Id, practiceId, cancellationToken);
        if (actor.Role != PracticeRole.Owner) throw Forbidden();
        var ownsTransaction = db.Database.CurrentTransaction is null;
        await using var transaction = ownsTransaction ? await db.Database.BeginTransactionAsync(cancellationToken) : null;
        var newOwner = await RequireMemberAsync(newOwnerId, practiceId, cancellationToken);
        actor.Role = PracticeRole.Administrator;
        newOwner.Role = PracticeRole.Owner;
        await db.SaveChangesAsync(cancellationToken);
        if (ownsTransaction) await transaction!.CommitAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<InvitationDto>> ListPendingInvitationsAsync(CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        if (!user.EmailVerified || string.IsNullOrWhiteSpace(user.NormalizedEmail))
            throw new ApiOperationException(ErrorCodes.InvitationEmailUnverified, "A verified email address is required.", StatusCodes.Status403Forbidden);
        return await db.PracticeInvitations.AsNoTracking().Where(x => x.InvitedEmailNormalized == user.NormalizedEmail && x.Status == InvitationStatus.Pending && x.ExpiresAt > DateTimeOffset.UtcNow)
            .OrderBy(x => x.CreatedAt).Select(x => ToInvitation(x)).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<InvitationDto>> ListPracticeInvitationsAsync(Guid practiceId, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        var actor = await RequireMemberAsync(user.Id, practiceId, cancellationToken);
        RequireAdministrator(actor);
        return await db.PracticeInvitations.AsNoTracking().Where(x => x.PracticeId == practiceId).OrderByDescending(x => x.CreatedAt).Select(x => ToInvitation(x)).ToListAsync(cancellationToken);
    }

    public async Task<InvitationDto> CreateInvitationAsync(Guid practiceId, CreateInvitationRequest request, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        var actor = await RequireMemberAsync(user.Id, practiceId, cancellationToken);
        RequireAdministrator(actor);
        var normalized = NormalizeEmail(request.Email);
        if (request.ValidForDays is < 1 or > 30) throw Validation("validForDays must be between 1 and 30.");
        var duplicate = await db.PracticeInvitations.AnyAsync(x => x.PracticeId == practiceId && x.InvitedEmailNormalized == normalized && x.Status == InvitationStatus.Pending && x.ExpiresAt > DateTimeOffset.UtcNow, cancellationToken);
        if (duplicate) throw new ApiOperationException(ErrorCodes.Conflict, "A pending invitation already exists for this email.", StatusCodes.Status409Conflict);
        var invitation = new PracticeInvitation { Id = Guid.NewGuid(), PracticeId = practiceId, InvitedByUserId = user.Id, InvitedEmail = request.Email.Trim(), InvitedEmailNormalized = normalized, Role = request.Role, Status = InvitationStatus.Pending, TokenHash = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)), ExpiresAt = DateTimeOffset.UtcNow.AddDays(request.ValidForDays) };
        db.Add(invitation);
        await db.SaveChangesAsync(cancellationToken);
        return ToInvitation(invitation);
    }

    public async Task<InvitationDto> RespondToInvitationAsync(Guid invitationId, InvitationResponse response, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        if (!user.EmailVerified || string.IsNullOrWhiteSpace(user.NormalizedEmail)) throw new ApiOperationException(ErrorCodes.InvitationEmailUnverified, "A verified email address is required.", StatusCodes.Status403Forbidden);
        var ownsTransaction = db.Database.CurrentTransaction is null;
        await using var transaction = ownsTransaction ? await db.Database.BeginTransactionAsync(cancellationToken) : null;
        var invitation = await db.PracticeInvitations.SingleOrDefaultAsync(x => x.Id == invitationId, cancellationToken) ?? throw NotFound();
        if (invitation.InvitedEmailNormalized != user.NormalizedEmail) throw Forbidden();
        if (invitation.Status != InvitationStatus.Pending || invitation.ExpiresAt <= DateTimeOffset.UtcNow) throw new ApiOperationException(ErrorCodes.InvitationState, "The invitation is no longer pending.", StatusCodes.Status409Conflict);
        invitation.Status = response == InvitationResponse.Accept ? InvitationStatus.Accepted : InvitationStatus.Declined;
        invitation.RespondedAt = DateTimeOffset.UtcNow;
        if (response == InvitationResponse.Accept)
        {
            invitation.AcceptedByUserId = user.Id;
            var exists = await db.PracticeMembers.AnyAsync(x => x.PracticeId == invitation.PracticeId && x.UserId == user.Id, cancellationToken);
            if (!exists) db.Add(new PracticeMember { PracticeId = invitation.PracticeId, UserId = user.Id, Role = invitation.Role });
        }
        await db.SaveChangesAsync(cancellationToken);
        if (ownsTransaction) await transaction!.CommitAsync(cancellationToken);
        return ToInvitation(invitation);
    }

    public async Task RevokeInvitationAsync(Guid practiceId, Guid invitationId, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        var actor = await RequireMemberAsync(user.Id, practiceId, cancellationToken);
        RequireAdministrator(actor);
        var invitation = await db.PracticeInvitations.SingleOrDefaultAsync(x => x.Id == invitationId && x.PracticeId == practiceId, cancellationToken) ?? throw NotFound();
        if (invitation.Status == InvitationStatus.Pending) { invitation.Status = InvitationStatus.Revoked; invitation.RespondedAt = DateTimeOffset.UtcNow; await db.SaveChangesAsync(cancellationToken); }
    }

    private async Task<User> RequireUserAsync(CancellationToken cancellationToken)
    {
        if (!currentUser.IsAuthenticated || string.IsNullOrWhiteSpace(currentUser.ExternalSubject)) throw new ApiOperationException(ErrorCodes.NotAuthenticated, "Authentication is required.", StatusCodes.Status401Unauthorized);
        var user = await db.Users.SingleOrDefaultAsync(x => x.ExternalSubject == currentUser.ExternalSubject, cancellationToken);
        if (user is not null)
        {
            user.Email = currentUser.Email ?? user.Email;
            user.NormalizedEmail = currentUser.NormalizedEmail ?? user.NormalizedEmail;
            user.EmailVerified = currentUser.EmailVerified;
            await db.SaveChangesAsync(cancellationToken);
            return user;
        }
        user = new User { Id = Guid.NewGuid(), ExternalSubject = currentUser.ExternalSubject, Email = currentUser.Email, NormalizedEmail = currentUser.NormalizedEmail, EmailVerified = currentUser.EmailVerified };
        db.Add(user);
        await db.SaveChangesAsync(cancellationToken);
        return user;
    }

    private async Task<PracticeMember> RequireMemberAsync(Guid userId, Guid practiceId, CancellationToken cancellationToken) =>
        await db.PracticeMembers.Include(x => x.Practice).SingleOrDefaultAsync(x => x.UserId == userId && x.PracticeId == practiceId, cancellationToken) ?? throw NotFound();

    private Task<bool> IsMemberAsync(Guid userId, Guid practiceId, CancellationToken cancellationToken) => db.PracticeMembers.AnyAsync(x => x.UserId == userId && x.PracticeId == practiceId, cancellationToken);
    private Task<bool> HasAnotherOwnerAsync(Guid practiceId, Guid excludedUserId, CancellationToken cancellationToken) => db.PracticeMembers.AnyAsync(x => x.PracticeId == practiceId && x.UserId != excludedUserId && x.Role == PracticeRole.Owner, cancellationToken);
    private static void RequireAdministrator(PracticeMember member) { if (member.Role is not (PracticeRole.Administrator or PracticeRole.Owner)) throw Forbidden(); }
    private static ApiOperationException Forbidden() => new(ErrorCodes.Forbidden, "The current user is not allowed to perform this operation.", StatusCodes.Status403Forbidden);
    private static ApiOperationException NotFound() => new(ErrorCodes.NotFound, "The requested resource was not found.", StatusCodes.Status404NotFound);
    private static ApiOperationException Validation(string detail) => new(ErrorCodes.Validation, detail, StatusCodes.Status400BadRequest);
    private static void EnsureVersion(byte[] actual, byte[]? expected) { if (expected is not null && !actual.SequenceEqual(expected)) throw new ApiOperationException(ErrorCodes.Conflict, "The resource was changed by another request.", StatusCodes.Status409Conflict); }
    private static void ValidatePractice(string name, string slug) { if (string.IsNullOrWhiteSpace(name) || name.Length > 200) throw Validation("Name is required and must be at most 200 characters."); if (string.IsNullOrWhiteSpace(slug) || slug.Length > 100) throw Validation("Slug is required and must be at most 100 characters."); }
    private static string NormalizeSlug(string value) => value.Trim().ToLowerInvariant();
    private static string NormalizeEmail(string value) => value.Trim().ToUpperInvariant();
    private static MeDto ToMe(User user, Guid? activePracticeId) => new(user.Id, user.ExternalSubject, user.Email, user.DisplayName, user.EmailVerified, activePracticeId);
    private static InvitationDto ToInvitation(PracticeInvitation invitation) => new(invitation.Id, invitation.PracticeId, invitation.InvitedEmail, invitation.Role, invitation.Status, invitation.ExpiresAt, Convert.ToBase64String(invitation.RowVersion));
}
