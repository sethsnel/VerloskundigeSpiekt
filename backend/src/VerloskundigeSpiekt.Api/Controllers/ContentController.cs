using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VerloskundigeSpiekt.Application;
using Microsoft.AspNetCore.RateLimiting;

namespace VerloskundigeSpiekt.Api.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class ContentController(IContentService content) : ControllerBase
{
    [Authorize(Policy = "authenticated")]
    [Authorize(Policy = AuthorizationPolicies.PracticeMember)]
    [HttpGet("practices/{practiceId:guid}/pages")]
    public Task<IReadOnlyList<PracticePageDto>> Pages(Guid practiceId, CancellationToken cancellationToken) => content.ListPagesAsync(practiceId, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [Authorize(Policy = AuthorizationPolicies.PracticeMember)]
    [HttpGet("practices/{practiceId:guid}/pages/{slug}")]
    public async Task<ActionResult<PracticePageDto>> Page(Guid practiceId, string slug, CancellationToken cancellationToken) { var result = await content.GetPageAsync(practiceId, slug, cancellationToken); ConcurrencyHeaders.SetETag(Response, result.Version); return result; }

    [Authorize(Policy = "authenticated")]
    [Authorize(Policy = AuthorizationPolicies.PracticeAdministrator)]
    [HttpPost("practices/{practiceId:guid}/pages/{slug}")]
    public async Task<ActionResult<PracticePageDto>> CreatePage(Guid practiceId, string slug, [FromBody] PageRequest request, CancellationToken cancellationToken) { var result = await content.CreatePageAsync(practiceId, slug, request, false, cancellationToken); ConcurrencyHeaders.SetETag(Response, result.Version); return CreatedAtAction(nameof(Page), new { practiceId, slug }, result); }

    [Authorize(Policy = AuthorizationPolicies.PracticeAdministrator)]
    [HttpPut("practices/{practiceId:guid}/pages/{slug}/seed")]
    public async Task<ActionResult<PracticePageDto>> SeedPage(Guid practiceId, string slug, [FromBody] PageRequest request, CancellationToken cancellationToken) { var result = await content.CreatePageAsync(practiceId, slug, request, true, cancellationToken); ConcurrencyHeaders.SetETag(Response, result.Version); return result; }

    [Authorize(Policy = AuthorizationPolicies.PracticeAdministrator)]
    [HttpPut("practices/{practiceId:guid}/pages/{slug}")]
    public async Task<ActionResult<PracticePageDto>> UpdatePage(Guid practiceId, string slug, [FromBody] PageRequest request, [FromHeader(Name = "If-Match")] string? version, CancellationToken cancellationToken) { var result = await content.UpdatePageAsync(practiceId, slug, request, ConcurrencyHeaders.DecodeIfMatch(version), cancellationToken); ConcurrencyHeaders.SetETag(Response, result.Version); return result; }

    [Authorize(Policy = AuthorizationPolicies.PracticeAdministrator)]
    [HttpDelete("practices/{practiceId:guid}/pages/{slug}")]
    public async Task<IActionResult> DeletePage(Guid practiceId, string slug, [FromHeader(Name = "If-Match")] string? version, CancellationToken cancellationToken) { await content.DeletePageAsync(practiceId, slug, ConcurrencyHeaders.DecodeIfMatch(version), cancellationToken); return NoContent(); }

    [Authorize(Policy = AuthorizationPolicies.PracticeMember)]
    [HttpGet("practices/{practiceId:guid}/pages/{slug}/versions")]
    public Task<IReadOnlyList<PageVersionDto>> PageVersions(Guid practiceId, string slug, CancellationToken cancellationToken) => content.ListPageVersionsAsync(practiceId, slug, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [Authorize(Policy = AuthorizationPolicies.PracticeMember)]
    [EnableRateLimiting("extension-templates")]
    [HttpGet("practices/{practiceId:guid}/templates/published")]
    public Task<IReadOnlyList<EmailTemplateDto>> PublishedTemplates(Guid practiceId, CancellationToken cancellationToken) => content.ListPublishedTemplatesAsync(practiceId, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [Authorize(Policy = AuthorizationPolicies.PracticeMember)]
    [EnableRateLimiting("extension-templates")]
    [HttpGet("practices/{practiceId:guid}/templates/published/{key}")]
    public async Task<ActionResult<EmailTemplateDto>> PublishedTemplate(Guid practiceId, string key, CancellationToken cancellationToken) { var result = await content.GetPublishedTemplateAsync(practiceId, key, cancellationToken); ConcurrencyHeaders.SetETag(Response, result.Version); return result; }

    [Authorize(Policy = "authenticated")]
    [Authorize(Policy = AuthorizationPolicies.PracticeAdministrator)]
    [HttpPut("practices/{practiceId:guid}/templates/{key}")]
    public async Task<ActionResult<EmailTemplateDto>> UpsertTemplate(Guid practiceId, string key, [FromBody] TemplateRequest request, [FromHeader(Name = "If-Match")] string? version, CancellationToken cancellationToken) { var result = await content.UpsertTemplateAsync(practiceId, key, request, ConcurrencyHeaders.DecodeIfMatch(version), cancellationToken); ConcurrencyHeaders.SetETag(Response, result.Version); return result; }

    [Authorize(Policy = "authenticated")]
    [Authorize(Policy = AuthorizationPolicies.PracticeMember)]
    [HttpGet("practices/{practiceId:guid}/contacts")]
    public Task<PagedResult<ContactDto>> Contacts(Guid practiceId, [FromQuery] string? cursor, [FromQuery] int pageSize = 50, CancellationToken cancellationToken = default) => content.ListContactsAsync(practiceId, cursor, pageSize, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [Authorize(Policy = AuthorizationPolicies.PracticeMember)]
    [HttpPost("practices/{practiceId:guid}/contacts")]
    public Task<ContactDto> CreateContact(Guid practiceId, [FromBody] ContactRequest request, CancellationToken cancellationToken) => content.CreateContactAsync(practiceId, request, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [Authorize(Policy = AuthorizationPolicies.PracticeMember)]
    [HttpPut("practices/{practiceId:guid}/contacts/{contactId:guid}")]
    public async Task<ActionResult<ContactDto>> UpdateContact(Guid practiceId, Guid contactId, [FromBody] ContactRequest request, [FromHeader(Name = "If-Match")] string? version, CancellationToken cancellationToken) { var result = await content.UpdateContactAsync(practiceId, contactId, request, ConcurrencyHeaders.DecodeIfMatch(version), cancellationToken); ConcurrencyHeaders.SetETag(Response, result.Version); return result; }

    [Authorize(Policy = "authenticated")]
    [Authorize(Policy = AuthorizationPolicies.PracticeMember)]
    [HttpDelete("practices/{practiceId:guid}/contacts/{contactId:guid}")]
    public async Task<IActionResult> DeleteContact(Guid practiceId, Guid contactId, CancellationToken cancellationToken) { await content.DeleteContactAsync(practiceId, contactId, cancellationToken); return NoContent(); }

    [AllowAnonymous]
    [HttpGet("articles")]
    public Task<IReadOnlyList<ArticleDto>> Articles(CancellationToken cancellationToken) => content.ListArticlesAsync(cancellationToken);

    [AllowAnonymous]
    [HttpGet("articles/{slug}")]
    public async Task<ActionResult<ArticleDto>> Article(string slug, CancellationToken cancellationToken) { var result = await content.GetArticleAsync(slug, cancellationToken); ConcurrencyHeaders.SetETag(Response, result.Version); return result; }

    [Authorize(Policy = AuthorizationPolicies.GlobalAdministrator)]
    [HttpPost("articles")]
    public async Task<ActionResult<ArticleDto>> CreateArticle([FromBody] ArticleRequest request, CancellationToken cancellationToken) { var result = await content.CreateArticleAsync(request, cancellationToken); ConcurrencyHeaders.SetETag(Response, result.Version); return CreatedAtAction(nameof(Article), new { slug = result.Slug }, result); }

    [Authorize(Policy = AuthorizationPolicies.GlobalAdministrator)]
    [HttpPut("articles/{articleId:guid}")]
    public async Task<ActionResult<ArticleDto>> UpdateArticle(Guid articleId, [FromBody] ArticleRequest request, [FromHeader(Name = "If-Match")] string? version, CancellationToken cancellationToken) { var result = await content.UpdateArticleAsync(articleId, request, ConcurrencyHeaders.DecodeIfMatch(version), cancellationToken); ConcurrencyHeaders.SetETag(Response, result.Version); return result; }

    [Authorize(Policy = AuthorizationPolicies.GlobalAdministrator)]
    [HttpDelete("articles/{articleId:guid}")]
    public async Task<IActionResult> DeleteArticle(Guid articleId, [FromHeader(Name = "If-Match")] string? version, CancellationToken cancellationToken) { await content.DeleteArticleAsync(articleId, ConcurrencyHeaders.DecodeIfMatch(version), cancellationToken); return NoContent(); }

    [AllowAnonymous]
    [HttpGet("tags")]
    public Task<IReadOnlyList<TagDto>> Tags(CancellationToken cancellationToken) => content.ListTagsAsync(cancellationToken);

    [Authorize(Policy = AuthorizationPolicies.GlobalAdministrator)]
    [HttpPost("tags")]
    public Task<TagDto> CreateTag([FromBody] TagRequest request, CancellationToken cancellationToken) => content.CreateTagAsync(request, cancellationToken);

    [Authorize(Policy = AuthorizationPolicies.GlobalAdministrator)]
    [HttpPut("tags/{tagId:guid}")]
    public Task<TagDto> UpdateTag(Guid tagId, [FromBody] TagRequest request, [FromHeader(Name = "If-Match")] string? version, CancellationToken cancellationToken) => content.UpdateTagAsync(tagId, request, ConcurrencyHeaders.DecodeIfMatch(version), cancellationToken);

    [AllowAnonymous]
    [EnableRateLimiting("search")]
    [HttpGet("search")]
    public Task<SearchResponseDto> Search([FromQuery] string query, [FromQuery] Guid? practiceId, [FromQuery] string? cursor, [FromQuery] int pageSize = 25, [FromQuery] string? kind = null, CancellationToken cancellationToken = default) => content.SearchAsync(practiceId, query, cursor, pageSize, kind, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [Authorize(Policy = AuthorizationPolicies.PracticeMember)]
    [HttpGet("practices/{practiceId:guid}/files")]
    public Task<IReadOnlyList<FileDto>> Files(Guid practiceId, CancellationToken cancellationToken) => content.ListFilesAsync(practiceId, cancellationToken);

    [Authorize(Policy = "authenticated")]
    [Authorize(Policy = AuthorizationPolicies.PracticeMember)]
    [HttpPost("practices/{practiceId:guid}/files/upload-authorization")]
    public Task<FileAccessDto> AuthorizeFileUpload(Guid practiceId, [FromBody] FileUploadRequest request, CancellationToken cancellationToken) => content.AuthorizeFileUploadAsync(practiceId, request, cancellationToken);

    [Authorize(Policy = AuthorizationPolicies.PracticeMember)]
    [HttpGet("practices/{practiceId:guid}/files/{fileId:guid}/download-authorization")]
    public Task<FileAccessDto> AuthorizeFileDownload(Guid practiceId, Guid fileId, CancellationToken cancellationToken) => content.AuthorizeFileDownloadAsync(practiceId, fileId, cancellationToken);

    [Authorize(Policy = AuthorizationPolicies.PracticeMember)]
    [HttpDelete("practices/{practiceId:guid}/files/{fileId:guid}")]
    public async Task<IActionResult> DeleteFile(Guid practiceId, Guid fileId, CancellationToken cancellationToken) { await content.DeleteFileAsync(practiceId, fileId, cancellationToken); return NoContent(); }

}
