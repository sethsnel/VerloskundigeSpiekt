using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Net.Mail;
using System.Text.RegularExpressions;
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
        var key = RequireIdempotencyKey(idempotencyKey);
        var fingerprint = Fingerprint(new { Name = request.Name.Trim(), Slug = normalizedSlug });
        var ownsTransaction = db.Database.CurrentTransaction is null;
        await using var transaction = ownsTransaction ? await db.Database.BeginTransactionAsync(cancellationToken) : null;
        await LockIdempotencyKeyAsync(user.Id, key, cancellationToken);
        if (await ReplayAsync<PracticeDto>(user.Id, key, "practice.create", fingerprint, cancellationToken) is { } replay) return replay;
        var practiceId = Guid.NewGuid();
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT app_create_practice({practiceId}, {request.Name.Trim()}, {normalizedSlug}, {user.Id})", cancellationToken);
        var preference = await db.UserPreferences.SingleOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
        if (preference is null) db.Add(new UserPreference { UserId = user.Id, ActivePracticeId = practiceId });
        else { preference.ActivePracticeId = practiceId; db.Update(preference); }
        await db.SaveChangesAsync(cancellationToken);
        var created = await db.Practices.AsNoTracking().SingleAsync(x => x.Id == practiceId, cancellationToken);
        var result = new PracticeDto(created.Id, created.Name, created.Slug, PracticeRole.Owner, created.CreatedAt, Convert.ToBase64String(created.RowVersion));
        db.Add(NewIdempotencyRecord(user.Id, key, "practice.create", fingerprint, StatusCodes.Status200OK, result));
        await db.SaveChangesAsync(cancellationToken);
        if (ownsTransaction) await transaction!.CommitAsync(cancellationToken);
        return result;
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
        if (!Enum.IsDefined(role) || role == PracticeRole.Owner)
            throw Validation("Owner can only be assigned through the ownership-transfer workflow.");
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
        await RequireMemberAsync(newOwnerId, practiceId, cancellationToken);
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT app_transfer_practice_ownership({practiceId}, {user.Id}, {newOwnerId})", cancellationToken);
        db.ChangeTracker.Clear();
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
        if (!Enum.IsDefined(request.Role) || request.Role == PracticeRole.Owner)
            throw Validation("Invitations may only grant Member or Administrator roles.");
        var user = await RequireUserAsync(cancellationToken);
        var actor = await RequireMemberAsync(user.Id, practiceId, cancellationToken);
        RequireAdministrator(actor);
        if (string.IsNullOrWhiteSpace(request.Email) || request.Email.Length > 320 || !MailAddress.TryCreate(request.Email, out _)) throw Validation("email must be a valid address of at most 320 characters.");
        var normalized = NormalizeEmail(request.Email);
        if (request.ValidForDays is < 1 or > 30) throw Validation("validForDays must be between 1 and 30.");
        var duplicate = await db.PracticeInvitations.AnyAsync(x => x.PracticeId == practiceId && x.InvitedEmailNormalized == normalized && x.Status == InvitationStatus.Pending && x.ExpiresAt > DateTimeOffset.UtcNow, cancellationToken);
        if (duplicate) throw new ApiOperationException(ErrorCodes.Conflict, "A pending invitation already exists for this email.", StatusCodes.Status409Conflict);
        var invitation = new PracticeInvitation { Id = Guid.NewGuid(), PracticeId = practiceId, InvitedByUserId = user.Id, InvitedEmail = request.Email.Trim(), InvitedEmailNormalized = normalized, Role = request.Role, Status = InvitationStatus.Pending, TokenHash = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)), ExpiresAt = DateTimeOffset.UtcNow.AddDays(request.ValidForDays) };
        db.Add(invitation);
        await db.SaveChangesAsync(cancellationToken);
        return ToInvitation(invitation);
    }

    public async Task<InvitationDto> RespondToInvitationAsync(Guid invitationId, InvitationResponse response, string? idempotencyKey, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        if (!user.EmailVerified || string.IsNullOrWhiteSpace(user.NormalizedEmail)) throw new ApiOperationException(ErrorCodes.InvitationEmailUnverified, "A verified email address is required.", StatusCodes.Status403Forbidden);
        if (!Enum.IsDefined(response)) throw Validation("response must be Accept or Decline.");
        var key = RequireIdempotencyKey(idempotencyKey);
        var fingerprint = Fingerprint(new { InvitationId = invitationId, Response = response.ToString() });
        var ownsTransaction = db.Database.CurrentTransaction is null;
        await using var transaction = ownsTransaction ? await db.Database.BeginTransactionAsync(cancellationToken) : null;
        await LockIdempotencyKeyAsync(user.Id, key, cancellationToken);
        if (await ReplayAsync<InvitationDto>(user.Id, key, "invitation.respond", fingerprint, cancellationToken) is { } replay) return replay;
        var desiredStatus = response == InvitationResponse.Accept ? "Accepted" : "Declined";
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT app_respond_to_invitation({invitationId}, {user.Id}, {desiredStatus})", cancellationToken);
        var invitation = await db.PracticeInvitations.AsNoTracking().SingleOrDefaultAsync(x => x.Id == invitationId, cancellationToken) ?? throw NotFound();
        var result = ToInvitation(invitation);
        db.Add(NewIdempotencyRecord(user.Id, key, "invitation.respond", fingerprint, StatusCodes.Status200OK, result));
        await db.SaveChangesAsync(cancellationToken);
        if (ownsTransaction) await transaction!.CommitAsync(cancellationToken);
        return result;
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
    private static void EnsureVersion(byte[] actual, byte[]? expected) { if (expected is null) throw new ApiOperationException(ErrorCodes.PreconditionRequired, "If-Match is required for updates.", StatusCodes.Status428PreconditionRequired); if (!actual.SequenceEqual(expected)) throw new ApiOperationException(ErrorCodes.Conflict, "The resource was changed by another request.", StatusCodes.Status409Conflict); }
    private static void ValidatePractice(string name, string slug) { if (string.IsNullOrWhiteSpace(name) || name.Length > 200) throw Validation("Name is required and must be at most 200 characters."); if (string.IsNullOrWhiteSpace(slug) || slug.Length > 100 || !Regex.IsMatch(slug, "^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.CultureInvariant)) throw Validation("Slug must contain at most 100 lowercase letters, digits, and single hyphens."); }
    private static string NormalizeSlug(string value) => value.Trim().ToLowerInvariant();
    private static string NormalizeEmail(string value) => value.Trim().ToUpperInvariant();
    private static MeDto ToMe(User user, Guid? activePracticeId) => new(user.Id, user.ExternalSubject, user.Email, user.DisplayName, user.EmailVerified, activePracticeId);
    private static InvitationDto ToInvitation(PracticeInvitation invitation) => new(invitation.Id, invitation.PracticeId, invitation.InvitedEmail, invitation.Role, invitation.Status, invitation.ExpiresAt, Convert.ToBase64String(invitation.RowVersion));

    private static string RequireIdempotencyKey(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > 128 || value.Any(character => !char.IsAsciiLetterOrDigit(character) && character is not ('-' or '_' or '.')))
            throw Validation("Idempotency-Key is required and must contain at most 128 letters, digits, '.', '_' or '-'.");
        return value;
    }

    private static string Fingerprint<T>(T value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value)))).ToLowerInvariant();

    private async Task LockIdempotencyKeyAsync(Guid userId, string key, CancellationToken cancellationToken) =>
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({$"{userId:N}:{key}"}, 0))", cancellationToken);

    private async Task<T?> ReplayAsync<T>(Guid userId, string key, string operation, string fingerprint, CancellationToken cancellationToken) where T : class
    {
        var existing = await db.IdempotencyRecords.SingleOrDefaultAsync(x => x.UserId == userId && x.Key == key, cancellationToken);
        if (existing is null) return null;
        if (existing.ExpiresAt <= DateTimeOffset.UtcNow) { db.Remove(existing); await db.SaveChangesAsync(cancellationToken); return null; }
        if (existing.Operation != operation || existing.RequestFingerprint != fingerprint)
            throw new ApiOperationException(ErrorCodes.IdempotencyConflict, "The idempotency key was already used for a different request.", StatusCodes.Status409Conflict);
        return JsonSerializer.Deserialize<T>(existing.ResponseJson) ?? throw new InvalidOperationException("Stored idempotency response is invalid.");
    }

    private static IdempotencyRecord NewIdempotencyRecord<T>(Guid userId, string key, string operation, string fingerprint, int status, T response) => new()
    {
        UserId = userId,
        Key = key,
        Operation = operation,
        RequestFingerprint = fingerprint,
        ResponseStatus = status,
        ResponseJson = JsonSerializer.Serialize(response),
        CreatedAt = DateTimeOffset.UtcNow,
        ExpiresAt = DateTimeOffset.UtcNow.AddHours(24),
    };
}
