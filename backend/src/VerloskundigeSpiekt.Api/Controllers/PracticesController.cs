using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VerloskundigeSpiekt.Application;
using VerloskundigeSpiekt.Domain;

namespace VerloskundigeSpiekt.Api.Controllers;

[ApiController]
[Authorize(Policy = "authenticated")]
[Route("api/v1/practices")]
public sealed class PracticesController(IPracticeService practices) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<PracticeDto>> List(CancellationToken cancellationToken) => practices.ListAsync(cancellationToken);

    [HttpPost]
    public Task<PracticeDto> Create([FromBody] CreatePracticeRequest request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey, CancellationToken cancellationToken) => practices.CreateAsync(request, idempotencyKey, cancellationToken);

    [HttpGet("{practiceId:guid}")]
    public Task<PracticeDto> Get(Guid practiceId, CancellationToken cancellationToken) => practices.GetAsync(practiceId, cancellationToken);

    [HttpPut("{practiceId:guid}")]
    public Task<PracticeDto> Update(Guid practiceId, [FromBody] UpdatePracticeRequest request, [FromHeader(Name = "If-Match")] string? version, CancellationToken cancellationToken) => practices.UpdateAsync(practiceId, request, DecodeVersion(version), cancellationToken);

    [HttpGet("{practiceId:guid}/members")]
    public Task<IReadOnlyList<MemberDto>> Members(Guid practiceId, CancellationToken cancellationToken) => practices.ListMembersAsync(practiceId, cancellationToken);

    [HttpPatch("{practiceId:guid}/members/{userId:guid}")]
    public async Task<IActionResult> UpdateMember(Guid practiceId, Guid userId, [FromBody] UpdateMemberRequest request, [FromHeader(Name = "If-Match")] string? version, CancellationToken cancellationToken)
    {
        await practices.UpdateMemberRoleAsync(practiceId, userId, request.Role, DecodeVersion(version), cancellationToken);
        return NoContent();
    }

    [HttpDelete("{practiceId:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid practiceId, Guid userId, CancellationToken cancellationToken)
    {
        await practices.RemoveMemberAsync(practiceId, userId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{practiceId:guid}/ownership-transfer")]
    public async Task<IActionResult> TransferOwnership(Guid practiceId, [FromBody] TransferOwnershipRequest request, CancellationToken cancellationToken)
    {
        await practices.TransferOwnershipAsync(practiceId, request.NewOwnerId, cancellationToken);
        return NoContent();
    }

    [HttpGet("{practiceId:guid}/invitations")]
    public Task<IReadOnlyList<InvitationDto>> Invitations(Guid practiceId, CancellationToken cancellationToken) => practices.ListPracticeInvitationsAsync(practiceId, cancellationToken);

    [HttpPost("{practiceId:guid}/invitations")]
    public Task<InvitationDto> Invite(Guid practiceId, [FromBody] CreateInvitationRequest request, CancellationToken cancellationToken) => practices.CreateInvitationAsync(practiceId, request, cancellationToken);

    [HttpDelete("{practiceId:guid}/invitations/{invitationId:guid}")]
    public async Task<IActionResult> RevokeInvitation(Guid practiceId, Guid invitationId, CancellationToken cancellationToken)
    {
        await practices.RevokeInvitationAsync(practiceId, invitationId, cancellationToken);
        return NoContent();
    }

    private static byte[]? DecodeVersion(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var normalized = value.StartsWith('"') ? value.Trim('"') : value;
        return Convert.FromBase64String(normalized);
    }
}

public sealed record UpdateMemberRequest(PracticeRole Role);
public sealed record TransferOwnershipRequest(Guid NewOwnerId);
