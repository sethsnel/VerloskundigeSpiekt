using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VerloskundigeSpiekt.Application;

namespace VerloskundigeSpiekt.Api.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class ContentController(IContentService content) : ControllerBase
{
    [Authorize(Policy = "authenticated")]
    [HttpGet("practices/{practiceId:guid}/pages")]
    public Task<IReadOnlyList<PracticePageDto>> Pages(Guid practiceId, CancellationToken cancellationToken) => content.ListPagesAsync(practiceId, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [HttpGet("practices/{practiceId:guid}/pages/{slug}")]
    public Task<PracticePageDto> Page(Guid practiceId, string slug, CancellationToken cancellationToken) => content.GetPageAsync(practiceId, slug, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [HttpPut("practices/{practiceId:guid}/pages/{slug}")]
    public Task<PracticePageDto> UpsertPage(Guid practiceId, string slug, [FromBody] PageRequest request, [FromHeader(Name = "If-Match")] string? version, CancellationToken cancellationToken) => content.UpsertPageAsync(practiceId, slug, request, DecodeVersion(version), cancellationToken);

    [Authorize(Policy = "authenticated")]
    [HttpGet("practices/{practiceId:guid}/templates/published")]
    public Task<IReadOnlyList<EmailTemplateDto>> PublishedTemplates(Guid practiceId, CancellationToken cancellationToken) => content.ListPublishedTemplatesAsync(practiceId, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [HttpGet("practices/{practiceId:guid}/templates/published/{key}")]
    public Task<EmailTemplateDto> PublishedTemplate(Guid practiceId, string key, CancellationToken cancellationToken) => content.GetPublishedTemplateAsync(practiceId, key, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [HttpPut("practices/{practiceId:guid}/templates/{key}")]
    public Task<EmailTemplateDto> UpsertTemplate(Guid practiceId, string key, [FromBody] TemplateRequest request, [FromHeader(Name = "If-Match")] string? version, CancellationToken cancellationToken) => content.UpsertTemplateAsync(practiceId, key, request, DecodeVersion(version), cancellationToken);

    [Authorize(Policy = "authenticated")]
    [HttpGet("practices/{practiceId:guid}/contacts")]
    public Task<PagedResult<ContactDto>> Contacts(Guid practiceId, [FromQuery] string? cursor, [FromQuery] int pageSize = 50, CancellationToken cancellationToken = default) => content.ListContactsAsync(practiceId, cursor, pageSize, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [HttpPost("practices/{practiceId:guid}/contacts")]
    public Task<ContactDto> CreateContact(Guid practiceId, [FromBody] ContactRequest request, CancellationToken cancellationToken) => content.CreateContactAsync(practiceId, request, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [HttpPut("practices/{practiceId:guid}/contacts/{contactId:guid}")]
    public Task<ContactDto> UpdateContact(Guid practiceId, Guid contactId, [FromBody] ContactRequest request, [FromHeader(Name = "If-Match")] string? version, CancellationToken cancellationToken) => content.UpdateContactAsync(practiceId, contactId, request, DecodeVersion(version), cancellationToken);

    [Authorize(Policy = "authenticated")]
    [HttpDelete("practices/{practiceId:guid}/contacts/{contactId:guid}")]
    public async Task<IActionResult> DeleteContact(Guid practiceId, Guid contactId, CancellationToken cancellationToken) { await content.DeleteContactAsync(practiceId, contactId, cancellationToken); return NoContent(); }

    [AllowAnonymous]
    [HttpGet("articles")]
    public Task<IReadOnlyList<ArticleDto>> Articles(CancellationToken cancellationToken) => content.ListArticlesAsync(cancellationToken);

    [AllowAnonymous]
    [HttpGet("articles/{slug}")]
    public Task<ArticleDto> Article(string slug, CancellationToken cancellationToken) => content.GetArticleAsync(slug, cancellationToken);

    [AllowAnonymous]
    [HttpGet("search")]
    public Task<IReadOnlyList<SearchResultDto>> Search([FromQuery] string query, [FromQuery] Guid? practiceId, CancellationToken cancellationToken) => content.SearchAsync(practiceId, query, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [HttpGet("practices/{practiceId:guid}/files")]
    public Task<IReadOnlyList<FileDto>> Files(Guid practiceId, CancellationToken cancellationToken) => content.ListFilesAsync(practiceId, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [HttpPost("practices/{practiceId:guid}/files")]
    public Task<FileDto> RegisterFile(Guid practiceId, [FromBody] FileRequest request, CancellationToken cancellationToken) => content.RegisterFileAsync(practiceId, request, cancellationToken);

    private static byte[]? DecodeVersion(string? value) => string.IsNullOrWhiteSpace(value) ? null : Convert.FromBase64String(value.Trim('"'));
}
