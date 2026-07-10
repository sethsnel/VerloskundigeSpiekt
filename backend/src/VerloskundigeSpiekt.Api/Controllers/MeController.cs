using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VerloskundigeSpiekt.Application;

namespace VerloskundigeSpiekt.Api.Controllers;

[ApiController]
[Authorize(Policy = "authenticated")]
[Route("api/v1/me")]
public sealed class MeController(IPracticeService practices) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<MeDto>(StatusCodes.Status200OK)]
    public Task<MeDto> Get(CancellationToken cancellationToken) => practices.GetMeAsync(cancellationToken);

    [HttpGet("preferences/active-practice")]
    public async Task<ActionResult<Guid?>> GetActivePractice(CancellationToken cancellationToken)
    {
        var me = await practices.GetMeAsync(cancellationToken);
        return Ok(me.ActivePracticeId);
    }

    [HttpPut("preferences/active-practice")]
    public async Task<MeDto> SetActivePractice([FromBody] ActivePracticeRequest request, CancellationToken cancellationToken) => await practices.UpdateActivePracticeAsync(request.PracticeId, cancellationToken);
}

public sealed record ActivePracticeRequest(Guid? PracticeId);
