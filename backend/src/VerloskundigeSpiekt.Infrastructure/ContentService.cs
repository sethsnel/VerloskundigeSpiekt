using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using VerloskundigeSpiekt.Application;
using VerloskundigeSpiekt.Domain;

namespace VerloskundigeSpiekt.Infrastructure;

public sealed class ContentService(AppDbContext db, ICurrentUser currentUser) : IContentService
{
    public async Task<IReadOnlyList<PracticePageDto>> ListPagesAsync(Guid practiceId, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken);
        var pages = await db.PracticePages.AsNoTracking().Include(x => x.Sections).Where(x => x.PracticeId == practiceId).OrderBy(x => x.Title).ToListAsync(cancellationToken);
        return pages.Select(ToPage).ToList();
    }

    public async Task<PracticePageDto> GetPageAsync(Guid practiceId, string slug, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken);
        var page = await db.PracticePages.AsNoTracking().Include(x => x.Sections).SingleOrDefaultAsync(x => x.PracticeId == practiceId && x.Slug == NormalizeSlug(slug), cancellationToken) ?? throw NotFound();
        return ToPage(page);
    }

    public async Task<PracticePageDto> UpsertPageAsync(Guid practiceId, string slug, PageRequest request, byte[]? expectedVersion, CancellationToken cancellationToken)
    {
        await RequireAdministratorAsync(practiceId, cancellationToken);
        ValidateJson(request.DocumentJson, 2_000_000);
        var normalizedSlug = NormalizeSlug(slug);
        var page = await db.PracticePages.Include(x => x.Sections).SingleOrDefaultAsync(x => x.PracticeId == practiceId && x.Slug == normalizedSlug, cancellationToken);
        if (page is null)
        {
            page = new PracticePage { Id = Guid.NewGuid(), PracticeId = practiceId, Slug = normalizedSlug, Title = request.Title.Trim(), ExtractedText = ExtractText(request.DocumentJson) };
            page.Sections.Add(new PracticePageSection { Id = Guid.NewGuid(), PracticeId = practiceId, PracticePageId = page.Id, Position = 0, Heading = request.Title.Trim(), DocumentJson = request.DocumentJson, ExtractedText = page.ExtractedText });
            db.Add(page);
        }
        else
        {
            EnsureVersion(page.RowVersion, expectedVersion);
            page.Title = request.Title.Trim();
            page.ExtractedText = ExtractText(request.DocumentJson);
            var section = page.Sections.OrderBy(x => x.Position).FirstOrDefault();
            if (section is null)
            {
                section = new PracticePageSection { Id = Guid.NewGuid(), PracticeId = practiceId, PracticePageId = page.Id, Position = 0 };
                page.Sections.Add(section);
            }
            section.Heading = request.Title.Trim();
            section.DocumentJson = request.DocumentJson;
            section.ExtractedText = page.ExtractedText;
            db.Update(section);
            var version = new PracticePageVersion { Id = Guid.NewGuid(), PracticeId = practiceId, PracticePageId = page.Id, ChangedByUserId = await CurrentUserIdAsync(cancellationToken), VersionNumber = await db.PracticePageVersions.CountAsync(x => x.PracticePageId == page.Id, cancellationToken) + 1, SnapshotJson = request.DocumentJson, CreatedAt = DateTimeOffset.UtcNow };
            db.Add(version);
        }
        await db.SaveChangesAsync(cancellationToken);
        return ToPage(page);
    }

    public async Task<IReadOnlyList<EmailTemplateDto>> ListPublishedTemplatesAsync(Guid practiceId, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken);
        return await db.EmailTemplates.AsNoTracking().Include(x => x.Versions).Where(x => x.PracticeId == practiceId).OrderBy(x => x.Key).SelectMany(x => x.Versions.Where(v => v.Status == TemplateVersionStatus.Published).OrderByDescending(v => v.VersionNumber).Take(1).Select(v => new EmailTemplateDto(x.Id, x.PracticeId, x.Key, x.Name, v.DefinitionJson, v.Status, Convert.ToBase64String(x.RowVersion)))).ToListAsync(cancellationToken);
    }

    public async Task<EmailTemplateDto> GetPublishedTemplateAsync(Guid practiceId, string key, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken);
        var template = await db.EmailTemplates.AsNoTracking().Include(x => x.Versions).SingleOrDefaultAsync(x => x.PracticeId == practiceId && x.Key == key, cancellationToken) ?? throw NotFound();
        var version = template.Versions.Where(x => x.Status == TemplateVersionStatus.Published).OrderByDescending(x => x.VersionNumber).FirstOrDefault() ?? throw NotFound();
        return new EmailTemplateDto(template.Id, template.PracticeId, template.Key, template.Name, version.DefinitionJson, version.Status, Convert.ToBase64String(template.RowVersion));
    }

    public async Task<EmailTemplateDto> UpsertTemplateAsync(Guid practiceId, string key, TemplateRequest request, byte[]? expectedVersion, CancellationToken cancellationToken)
    {
        await RequireAdministratorAsync(practiceId, cancellationToken);
        ValidateJson(request.DefinitionJson, 512_000);
        if (request.DefinitionJson.Contains("patient", StringComparison.OrdinalIgnoreCase) || request.DefinitionJson.Contains("client", StringComparison.OrdinalIgnoreCase)) throw Validation("Template definitions cannot contain resolved patient or client values.");
        var template = await db.EmailTemplates.Include(x => x.Versions).SingleOrDefaultAsync(x => x.PracticeId == practiceId && x.Key == key, cancellationToken);
        if (template is null) { template = new EmailTemplate { Id = Guid.NewGuid(), PracticeId = practiceId, Key = key, Name = request.Name.Trim() }; db.Add(template); }
        else EnsureVersion(template.RowVersion, expectedVersion);
        var version = new EmailTemplateVersion { Id = Guid.NewGuid(), PracticeId = practiceId, EmailTemplateId = template.Id, ChangedByUserId = await CurrentUserIdAsync(cancellationToken), VersionNumber = template.Versions.Count + 1, Status = request.Publish ? TemplateVersionStatus.Published : TemplateVersionStatus.Draft, DefinitionJson = request.DefinitionJson, CreatedAt = DateTimeOffset.UtcNow };
        db.Add(version);
        await db.SaveChangesAsync(cancellationToken);
        return new EmailTemplateDto(template.Id, practiceId, key, template.Name, version.DefinitionJson, version.Status, Convert.ToBase64String(template.RowVersion));
    }

    public async Task<PagedResult<ContactDto>> ListContactsAsync(Guid practiceId, string? cursor, int pageSize, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Contacts.AsNoTracking().Where(x => x.PracticeId == practiceId).OrderBy(x => x.DisplayName).ThenBy(x => x.Id);
        var contacts = await query.Take(pageSize + 1).ToListAsync(cancellationToken);
        var hasNext = contacts.Count > pageSize;
        if (hasNext) contacts.RemoveAt(pageSize);
        return new PagedResult<ContactDto>(contacts.Select(ToContact).ToList(), hasNext ? Convert.ToBase64String(contacts[^1].Id.ToByteArray()) : null);
    }

    public async Task<ContactDto> CreateContactAsync(Guid practiceId, ContactRequest request, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken);
        ValidateContact(request);
        var contact = new Contact { Id = Guid.NewGuid(), PracticeId = practiceId, DisplayName = request.DisplayName.Trim(), Email = request.Email?.Trim(), NormalizedEmail = request.Email?.Trim().ToUpperInvariant(), Telephone = request.Telephone?.Trim(), NormalizedTelephone = request.Telephone?.Trim(), MetadataJson = request.MetadataJson };
        ValidateJson(contact.MetadataJson, 100_000);
        db.Add(contact); await db.SaveChangesAsync(cancellationToken); return ToContact(contact);
    }

    public async Task<ContactDto> UpdateContactAsync(Guid practiceId, Guid contactId, ContactRequest request, byte[]? expectedVersion, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken); ValidateContact(request);
        var contact = await db.Contacts.SingleOrDefaultAsync(x => x.Id == contactId && x.PracticeId == practiceId, cancellationToken) ?? throw NotFound();
        EnsureVersion(contact.RowVersion, expectedVersion); contact.DisplayName = request.DisplayName.Trim(); contact.Email = request.Email?.Trim(); contact.NormalizedEmail = request.Email?.Trim().ToUpperInvariant(); contact.Telephone = request.Telephone?.Trim(); contact.NormalizedTelephone = request.Telephone?.Trim(); contact.MetadataJson = request.MetadataJson; ValidateJson(contact.MetadataJson, 100_000); await db.SaveChangesAsync(cancellationToken); return ToContact(contact);
    }

    public async Task DeleteContactAsync(Guid practiceId, Guid contactId, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken); var contact = await db.Contacts.SingleOrDefaultAsync(x => x.Id == contactId && x.PracticeId == practiceId, cancellationToken) ?? throw NotFound(); db.Remove(contact); await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ArticleDto>> ListArticlesAsync(CancellationToken cancellationToken) => await db.Articles.AsNoTracking().Include(x => x.Sections).Where(x => x.IsPublished).OrderBy(x => x.Position).Select(x => new ArticleDto(x.Id, x.Slug, x.Title, x.Position, x.Sections.OrderBy(s => s.Position).Select(s => s.DocumentJson).FirstOrDefault() ?? "[]")).ToListAsync(cancellationToken);
    public async Task<ArticleDto> GetArticleAsync(string slug, CancellationToken cancellationToken) => await db.Articles.AsNoTracking().Include(x => x.Sections).Where(x => x.IsPublished && x.Slug == slug).Select(x => new ArticleDto(x.Id, x.Slug, x.Title, x.Position, x.Sections.OrderBy(s => s.Position).Select(s => s.DocumentJson).FirstOrDefault() ?? "[]")).SingleOrDefaultAsync(cancellationToken) ?? throw NotFound();

    public async Task<IReadOnlyList<SearchResultDto>> SearchAsync(Guid? practiceId, string query, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length > 200) throw Validation("query is required and must be at most 200 characters.");
        if (practiceId.HasValue) await RequireMemberAsync(practiceId.Value, cancellationToken);
        var articles = await db.Articles.AsNoTracking().Where(x => x.IsPublished && (EF.Functions.ILike(x.Title, $"%{query}%") || x.Sections.Any(s => EF.Functions.ILike(s.ExtractedText!, $"%{query}%")))).Take(25).Select(x => new SearchResultDto("article", x.Id, x.Title, null, x.Slug)).ToListAsync(cancellationToken);
        if (!practiceId.HasValue) return articles;
        var pages = await db.PracticePages.AsNoTracking().Where(x => x.PracticeId == practiceId && (EF.Functions.ILike(x.Title, $"%{query}%") || EF.Functions.ILike(x.ExtractedText!, $"%{query}%"))).Take(25).Select(x => new SearchResultDto("practice-page", x.Id, x.Title, x.PracticeId.ToString(), x.Slug)).ToListAsync(cancellationToken);
        return articles.Concat(pages).ToList();
    }

    public async Task<FileDto> RegisterFileAsync(Guid practiceId, FileRequest request, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken); if (request.SizeBytes is < 0 or > 52_428_800) throw Validation("Files must be at most 50 MiB."); if (string.IsNullOrWhiteSpace(request.StorageObjectName)) throw Validation("storageObjectName is required.");
        var file = new FileMetadata { Id = Guid.NewGuid(), PracticeId = practiceId, FileName = request.FileName.Trim(), ContentType = request.ContentType.Trim(), SizeBytes = request.SizeBytes, StorageObjectName = request.StorageObjectName.Trim() }; db.Add(file); await db.SaveChangesAsync(cancellationToken); return ToFile(file);
    }

    public async Task<IReadOnlyList<FileDto>> ListFilesAsync(Guid practiceId, CancellationToken cancellationToken) { await RequireMemberAsync(practiceId, cancellationToken); var files = await db.FileMetadata.AsNoTracking().Where(x => x.PracticeId == practiceId).OrderBy(x => x.FileName).ToListAsync(cancellationToken); return files.Select(ToFile).ToList(); }

    private async Task<PracticeMember> RequireMemberAsync(Guid practiceId, CancellationToken cancellationToken) { var userId = await CurrentUserIdAsync(cancellationToken); return await db.PracticeMembers.SingleOrDefaultAsync(x => x.PracticeId == practiceId && x.UserId == userId, cancellationToken) ?? throw Forbidden(); }
    private async Task RequireAdministratorAsync(Guid practiceId, CancellationToken cancellationToken) { var member = await RequireMemberAsync(practiceId, cancellationToken); if (member.Role is not (PracticeRole.Administrator or PracticeRole.Owner)) throw Forbidden(); }
    private async Task<Guid> CurrentUserIdAsync(CancellationToken cancellationToken) { if (!currentUser.IsAuthenticated) throw new ApiOperationException(ErrorCodes.NotAuthenticated, "Authentication is required.", StatusCodes.Status401Unauthorized); return (await db.Users.SingleOrDefaultAsync(x => x.ExternalSubject == currentUser.ExternalSubject, cancellationToken) ?? throw Forbidden()).Id; }
    private static PracticePageDto ToPage(PracticePage page) { var section = page.Sections.OrderBy(x => x.Position).FirstOrDefault(); return new PracticePageDto(page.Id, page.PracticeId, page.Slug, page.Title, section?.DocumentJson ?? "[]", page.UpdatedAt, Convert.ToBase64String(page.RowVersion)); }
    private static ContactDto ToContact(Contact contact) => new(contact.Id, contact.PracticeId, contact.DisplayName, contact.Email, contact.Telephone, contact.MetadataJson, Convert.ToBase64String(contact.RowVersion));
    private static FileDto ToFile(FileMetadata file) => new(file.Id, file.PracticeId, file.FileName, file.ContentType, file.SizeBytes, file.StorageObjectName, file.UpdatedAt);
    private static string NormalizeSlug(string value) => value.Trim().ToLowerInvariant();
    private static void ValidateContact(ContactRequest request) { if (string.IsNullOrWhiteSpace(request.DisplayName) || request.DisplayName.Length > 200) throw Validation("displayName is required and must be at most 200 characters."); }
    private static string ExtractText(string json)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            var values = new List<string>();
            CollectStrings(document.RootElement, values);
            return string.Join(' ', values).Trim();
        }
        catch (JsonException) { return string.Empty; }
    }
    private static void CollectStrings(JsonElement element, ICollection<string> values)
    {
        if (element.ValueKind == JsonValueKind.String && element.GetString() is { } value) values.Add(value);
        if (element.ValueKind == JsonValueKind.Object) foreach (var property in element.EnumerateObject()) CollectStrings(property.Value, values);
        if (element.ValueKind == JsonValueKind.Array) foreach (var child in element.EnumerateArray()) CollectStrings(child, values);
    }
    private static void ValidateJson(string value, int maxBytes) { if (string.IsNullOrWhiteSpace(value) || System.Text.Encoding.UTF8.GetByteCount(value) > maxBytes) throw Validation("The JSON document is missing or too large."); try { using var _ = JsonDocument.Parse(value); } catch (JsonException) { throw Validation("The document must contain valid JSON."); } }
    private static void EnsureVersion(byte[] actual, byte[]? expected) { if (expected is not null && !actual.SequenceEqual(expected)) throw new ApiOperationException(ErrorCodes.Conflict, "The resource was changed by another request.", StatusCodes.Status409Conflict); }
    private static ApiOperationException Forbidden() => new(ErrorCodes.Forbidden, "The current user is not allowed to perform this operation.", StatusCodes.Status403Forbidden);
    private static ApiOperationException NotFound() => new(ErrorCodes.NotFound, "The requested resource was not found.", StatusCodes.Status404NotFound);
    private static ApiOperationException Validation(string detail) => new(ErrorCodes.Validation, detail, StatusCodes.Status400BadRequest);
}
