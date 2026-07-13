using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VerloskundigeSpiekt.Application;

namespace VerloskundigeSpiekt.Api.Controllers;

[ApiController]
[Authorize(Policy = "authenticated")]
[Route("api/v1/invitations")]
public sealed class InvitationsController(IPracticeService practices) : ControllerBase
{
    [HttpGet("pending")]
    public Task<IReadOnlyList<InvitationDto>> Pending(CancellationToken cancellationToken) => practices.ListPendingInvitationsAsync(cancellationToken);

    [HttpPost("{invitationId:guid}/response")]
    public Task<InvitationDto> Respond(Guid invitationId, [FromBody] InvitationResponseRequest request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey, CancellationToken cancellationToken) => practices.RespondToInvitationAsync(invitationId, request.Response, idempotencyKey, cancellationToken);
}

public sealed record InvitationResponseRequest(InvitationResponse Response);
