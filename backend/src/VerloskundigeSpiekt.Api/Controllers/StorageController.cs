using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VerloskundigeSpiekt.Application;

namespace VerloskundigeSpiekt.Api.Controllers;

[ApiController]
[Authorize(Policy = "authenticated")]
[Route("api/v1/storage")]
public sealed class StorageController(IContentService content) : ControllerBase
{
    [HttpPut("upload/{token}")]
    [RequestSizeLimit(52_428_800)]
    public async Task<IActionResult> Upload(string token, CancellationToken cancellationToken)
    {
        await content.UploadFileAsync(token, Request.Body, Request.ContentType, Request.ContentLength, cancellationToken); return NoContent();
    }

    [HttpGet("download/{token}")]
    public async Task<IActionResult> Download(string token, CancellationToken cancellationToken)
    {
        var download = await content.DownloadFileAsync(token, cancellationToken); return File(download.Content, download.ContentType, download.FileName, enableRangeProcessing: true);
    }
}
