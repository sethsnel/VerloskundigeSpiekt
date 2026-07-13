using System.Text.Json;
using System.Net.Mail;
using System.Text.RegularExpressions;
using System.Text;
using NpgsqlTypes;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using VerloskundigeSpiekt.Application;
using VerloskundigeSpiekt.Domain;

namespace VerloskundigeSpiekt.Infrastructure;

public sealed class ContentService(AppDbContext db, ICurrentUser currentUser, IObjectStorage storage, IOptions<StorageOptions> storageOptions) : IContentService
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

    public async Task<PracticePageDto> CreatePageAsync(Guid practiceId, string slug, PageRequest request, bool idempotentSeed, CancellationToken cancellationToken)
    {
        await RequireAdministratorAsync(practiceId, cancellationToken);
        var sections = ValidatePageRequest(slug, request); var normalizedSlug = NormalizeSlug(slug);
        var existing = await db.PracticePages.AsNoTracking().Include(x => x.Sections).SingleOrDefaultAsync(x => x.PracticeId == practiceId && x.Slug == normalizedSlug, cancellationToken);
        if (existing is not null)
        {
            if (idempotentSeed && PageMatches(existing, request.Title.Trim(), sections)) return ToPage(existing);
            throw new ApiOperationException(ErrorCodes.Conflict, "A page with this slug already exists.", StatusCodes.Status409Conflict);
        }
        var page = new PracticePage { Id = Guid.NewGuid(), PracticeId = practiceId, Slug = normalizedSlug, Title = request.Title.Trim() };
        ApplySections(page, sections); db.Add(page);
        db.Add(new PracticePageVersion { Id = Guid.NewGuid(), PracticeId = practiceId, PracticePageId = page.Id, ChangedByUserId = await CurrentUserIdAsync(cancellationToken), VersionNumber = 1, SnapshotJson = Snapshot(page.Title, sections), CreatedAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync(cancellationToken);
        return ToPage(page);
    }

    public async Task<PracticePageDto> UpdatePageAsync(Guid practiceId, string slug, PageRequest request, byte[]? expectedVersion, CancellationToken cancellationToken)
    {
        await RequireAdministratorAsync(practiceId, cancellationToken); var sections = ValidatePageRequest(slug, request); var normalizedSlug = NormalizeSlug(slug);
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({$"page:{practiceId:N}:{normalizedSlug}"}, 0))", cancellationToken);
        var page = await db.PracticePages.Include(x => x.Sections).SingleOrDefaultAsync(x => x.PracticeId == practiceId && x.Slug == normalizedSlug, cancellationToken) ?? throw NotFound();
        EnsureVersion(page.RowVersion, expectedVersion);
        await db.PracticePageSections.Where(section => section.PracticePageId == page.Id && section.PracticeId == practiceId).ExecuteDeleteAsync(cancellationToken);
        foreach (var existingSection in page.Sections.ToList()) db.Entry(existingSection).State = EntityState.Detached;
        page.Sections.Clear(); page.Title = request.Title.Trim(); ApplySections(page, sections);
        foreach (var newSection in page.Sections) db.Entry(newSection).State = EntityState.Added;
        var currentVersion = await db.PracticePageVersions.Where(version => version.PracticePageId == page.Id).MaxAsync(version => (int?)version.VersionNumber, cancellationToken);
        var nextVersion = (currentVersion ?? 0) + 1;
        db.Add(new PracticePageVersion { Id = Guid.NewGuid(), PracticeId = practiceId, PracticePageId = page.Id, ChangedByUserId = await CurrentUserIdAsync(cancellationToken), VersionNumber = nextVersion, SnapshotJson = Snapshot(page.Title, sections), CreatedAt = DateTimeOffset.UtcNow });
        try { await db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { throw new ApiOperationException(ErrorCodes.Conflict, "The page or its sections changed concurrently.", StatusCodes.Status409Conflict); }
        return ToPage(page);
    }

    public async Task DeletePageAsync(Guid practiceId, string slug, byte[]? expectedVersion, CancellationToken cancellationToken)
    {
        await RequireAdministratorAsync(practiceId, cancellationToken); var page = await db.PracticePages.SingleOrDefaultAsync(x => x.PracticeId == practiceId && x.Slug == NormalizeSlug(slug), cancellationToken) ?? throw NotFound();
        EnsureVersion(page.RowVersion, expectedVersion); db.Remove(page); await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PageVersionDto>> ListPageVersionsAsync(Guid practiceId, string slug, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken); var pageId = await db.PracticePages.Where(x => x.PracticeId == practiceId && x.Slug == NormalizeSlug(slug)).Select(x => (Guid?)x.Id).SingleOrDefaultAsync(cancellationToken) ?? throw NotFound();
        return await db.PracticePageVersions.AsNoTracking().Where(x => x.PracticePageId == pageId).OrderByDescending(x => x.VersionNumber).Select(x => new PageVersionDto(x.Id, x.VersionNumber, x.SnapshotJson, x.CreatedAt, x.ChangedByUserId)).ToListAsync(cancellationToken);
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
        if (string.IsNullOrWhiteSpace(key) || key.Length > 100 || !Regex.IsMatch(key, "^[a-zA-Z0-9._-]+$", RegexOptions.CultureInvariant)) throw Validation("template key has an invalid format.");
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 200) throw Validation("name is required and must be at most 200 characters.");
        if (request.Status is not (TemplateVersionStatus.Draft or TemplateVersionStatus.Published)) throw Validation("status must be Draft or Published.");
        await ValidateTemplateDefinitionAsync(request.DefinitionJson, cancellationToken);
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({$"template:{practiceId:N}:{key}"}, 0))", cancellationToken);
        var template = await db.EmailTemplates.Include(x => x.Versions).SingleOrDefaultAsync(x => x.PracticeId == practiceId && x.Key == key, cancellationToken);
        if (template is null) { template = new EmailTemplate { Id = Guid.NewGuid(), PracticeId = practiceId, Key = key, Name = request.Name.Trim() }; db.Add(template); }
        else EnsureVersion(template.RowVersion, expectedVersion);
        var nextVersion = (await db.EmailTemplateVersions.Where(version => version.EmailTemplateId == template.Id).MaxAsync(version => (int?)version.VersionNumber, cancellationToken) ?? 0) + 1;
        var version = new EmailTemplateVersion { Id = Guid.NewGuid(), PracticeId = practiceId, EmailTemplateId = template.Id, ChangedByUserId = await CurrentUserIdAsync(cancellationToken), VersionNumber = nextVersion, Status = request.Status, DefinitionJson = request.DefinitionJson, CreatedAt = DateTimeOffset.UtcNow };
        db.Add(version);
        await db.SaveChangesAsync(cancellationToken);
        return new EmailTemplateDto(template.Id, practiceId, key, template.Name, version.DefinitionJson, version.Status, Convert.ToBase64String(template.RowVersion));
    }

    public async Task<PagedResult<ContactDto>> ListContactsAsync(Guid practiceId, string? cursor, int pageSize, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken);
        pageSize = Math.Clamp(pageSize, 1, 100);
        IQueryable<Contact> query = db.Contacts.AsNoTracking().Where(x => x.PracticeId == practiceId);
        if (!string.IsNullOrWhiteSpace(cursor))
        {
            var decoded = DecodeContactCursor(cursor);
            query = db.Contacts.FromSqlInterpolated($"SELECT * FROM contacts WHERE practice_id = {practiceId} AND (display_name, id) > ({decoded.DisplayName}, {decoded.Id})").AsNoTracking();
        }
        var orderedQuery = query.OrderBy(x => x.DisplayName).ThenBy(x => x.Id);
        var contacts = await orderedQuery.Take(pageSize + 1).ToListAsync(cancellationToken);
        var hasNext = contacts.Count > pageSize;
        if (hasNext) contacts.RemoveAt(pageSize);
        return new PagedResult<ContactDto>(contacts.Select(ToContact).ToList(), hasNext ? EncodeContactCursor(contacts[^1]) : null);
    }

    public async Task<ContactDto> CreateContactAsync(Guid practiceId, ContactRequest request, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken);
        ValidateContact(request);
        var contact = new Contact { Id = Guid.NewGuid(), PracticeId = practiceId, DisplayName = request.DisplayName.Trim(), Email = request.Email?.Trim(), NormalizedEmail = request.Email?.Trim().ToUpperInvariant(), Telephone = request.Telephone?.Trim(), NormalizedTelephone = NormalizeTelephone(request.Telephone), MetadataJson = request.MetadataJson };
        ValidateJson(contact.MetadataJson, 100_000, JsonValueKind.Object);
        db.Add(contact); await db.SaveChangesAsync(cancellationToken); return ToContact(contact);
    }

    public async Task<ContactDto> UpdateContactAsync(Guid practiceId, Guid contactId, ContactRequest request, byte[]? expectedVersion, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken); ValidateContact(request);
        var contact = await db.Contacts.SingleOrDefaultAsync(x => x.Id == contactId && x.PracticeId == practiceId, cancellationToken) ?? throw NotFound();
        EnsureVersion(contact.RowVersion, expectedVersion); contact.DisplayName = request.DisplayName.Trim(); contact.Email = request.Email?.Trim(); contact.NormalizedEmail = request.Email?.Trim().ToUpperInvariant(); contact.Telephone = request.Telephone?.Trim(); contact.NormalizedTelephone = NormalizeTelephone(request.Telephone); contact.MetadataJson = request.MetadataJson; ValidateJson(contact.MetadataJson, 100_000, JsonValueKind.Object); await db.SaveChangesAsync(cancellationToken); return ToContact(contact);
    }

    public async Task DeleteContactAsync(Guid practiceId, Guid contactId, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken); var contact = await db.Contacts.SingleOrDefaultAsync(x => x.Id == contactId && x.PracticeId == practiceId, cancellationToken) ?? throw NotFound(); db.Remove(contact); await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ArticleDto>> ListArticlesAsync(CancellationToken cancellationToken) => (await db.Articles.AsNoTracking().Include(x => x.Sections).Include(x => x.ArticleTags).Where(x => x.IsPublished).OrderBy(x => x.Position).ToListAsync(cancellationToken)).Select(ToArticle).ToList();
    public async Task<ArticleDto> GetArticleAsync(string slug, CancellationToken cancellationToken) => ToArticle(await db.Articles.AsNoTracking().Include(x => x.Sections).Include(x => x.ArticleTags).SingleOrDefaultAsync(x => x.IsPublished && x.Slug == slug, cancellationToken) ?? throw NotFound());

    public async Task<ArticleDto> CreateArticleAsync(ArticleRequest request, CancellationToken cancellationToken)
    {
        await RequireGlobalAdministratorAsync(cancellationToken); ValidateArticle(request); var article = new Article { Id = Guid.NewGuid(), Slug = NormalizeSlug(request.Slug), Title = request.Title.Trim(), Position = request.Position, HeaderUrl = request.HeaderUrl?.Trim(), IsPublished = request.IsPublished };
        ApplyArticleSections(article, request.Sections); await ApplyArticleTagsAsync(article, request.TagIds ?? [], cancellationToken); db.Add(article); await db.SaveChangesAsync(cancellationToken); return ToArticle(article);
    }

    public async Task<ArticleDto> UpdateArticleAsync(Guid articleId, ArticleRequest request, byte[]? expectedVersion, CancellationToken cancellationToken)
    {
        await RequireGlobalAdministratorAsync(cancellationToken); ValidateArticle(request); await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({$"article:{articleId:N}"}, 0))", cancellationToken);
        var article = await db.Articles.Include(x => x.Sections).Include(x => x.ArticleTags).SingleOrDefaultAsync(x => x.Id == articleId, cancellationToken) ?? throw NotFound(); EnsureVersion(article.RowVersion, expectedVersion);
        await db.ArticleSections.Where(section => section.ArticleId == articleId).ExecuteDeleteAsync(cancellationToken); await db.ArticleTags.Where(tag => tag.ArticleId == articleId).ExecuteDeleteAsync(cancellationToken);
        foreach (var section in article.Sections.ToList()) db.Entry(section).State = EntityState.Detached; foreach (var tag in article.ArticleTags.ToList()) db.Entry(tag).State = EntityState.Detached; article.Sections.Clear(); article.ArticleTags.Clear();
        article.Slug = NormalizeSlug(request.Slug); article.Title = request.Title.Trim(); article.Position = request.Position; article.HeaderUrl = request.HeaderUrl?.Trim(); article.IsPublished = request.IsPublished;
        ApplyArticleSections(article, request.Sections);
        foreach (var section in article.Sections) db.Entry(section).State = EntityState.Added;
        await ApplyArticleTagsAsync(article, request.TagIds ?? [], cancellationToken);
        foreach (var tag in article.ArticleTags) db.Entry(tag).State = EntityState.Added;
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ApiOperationException(ErrorCodes.Conflict, "The article changed concurrently.", StatusCodes.Status409Conflict);
        }
        return ToArticle(article);
    }

    public async Task DeleteArticleAsync(Guid articleId, byte[]? expectedVersion, CancellationToken cancellationToken)
    {
        await RequireGlobalAdministratorAsync(cancellationToken); var article = await db.Articles.SingleOrDefaultAsync(x => x.Id == articleId, cancellationToken) ?? throw NotFound(); EnsureVersion(article.RowVersion, expectedVersion); db.Remove(article); await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TagDto>> ListTagsAsync(CancellationToken cancellationToken) => (await db.Tags.AsNoTracking().Include(tag => tag.ArticleTags).OrderBy(tag => tag.Name).ToListAsync(cancellationToken)).Select(ToTag).ToList();
    public async Task<TagDto> CreateTagAsync(TagRequest request, CancellationToken cancellationToken) { await RequireGlobalAdministratorAsync(cancellationToken); ValidateTag(request); var tag = new Tag { Id = Guid.NewGuid(), Name = request.Name.Trim() }; db.Add(tag); await db.SaveChangesAsync(cancellationToken); return ToTag(tag); }
    public async Task<TagDto> UpdateTagAsync(Guid tagId, TagRequest request, byte[]? expectedVersion, CancellationToken cancellationToken) { await RequireGlobalAdministratorAsync(cancellationToken); ValidateTag(request); var tag = await db.Tags.Include(x => x.ArticleTags).SingleOrDefaultAsync(x => x.Id == tagId, cancellationToken) ?? throw NotFound(); EnsureVersion(tag.RowVersion, expectedVersion); tag.Name = request.Name.Trim(); await db.SaveChangesAsync(cancellationToken); return ToTag(tag); }

    public async Task<SearchResponseDto> SearchAsync(Guid? practiceId, string query, string? cursor, int pageSize, string? kind, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length > 200) throw Validation("query is required and must be at most 200 characters.");
        if (kind is not (null or "article" or "practice-page")) throw Validation("kind must be article or practice-page.");
        pageSize = Math.Clamp(pageSize, 1, 100);
        if (practiceId.HasValue) await RequireMemberAsync(practiceId.Value, cancellationToken);
        var normalizedQuery = query.Trim(); var matches = new List<SearchResultDto>();
        if (kind is null or "article")
        {
            var articles = await db.Articles.AsNoTracking().Where(article => article.IsPublished && EF.Property<NpgsqlTsVector>(article, "SearchVector").Matches(EF.Functions.PlainToTsQuery("dutch", normalizedQuery)))
                .Select(article => new { article.Id, article.Title, article.Slug, article.ExtractedText, Rank = EF.Property<NpgsqlTsVector>(article, "SearchVector").Rank(EF.Functions.PlainToTsQuery("dutch", normalizedQuery)) }).Take(1000).ToListAsync(cancellationToken);
            matches.AddRange(articles.Select(article => new SearchResultDto("article", article.Id, article.Title, null, Snippet(article.ExtractedText, article.Slug), article.Rank)));
        }
        if (practiceId.HasValue && kind is (null or "practice-page"))
        {
            var pages = await db.PracticePages.AsNoTracking().Where(page => page.PracticeId == practiceId && EF.Property<NpgsqlTsVector>(page, "SearchVector").Matches(EF.Functions.PlainToTsQuery("dutch", normalizedQuery)))
                .Select(page => new { page.Id, page.Title, page.Slug, page.ExtractedText, page.PracticeId, Rank = EF.Property<NpgsqlTsVector>(page, "SearchVector").Rank(EF.Functions.PlainToTsQuery("dutch", normalizedQuery)) }).Take(1000).ToListAsync(cancellationToken);
            matches.AddRange(pages.Select(page => new SearchResultDto("practice-page", page.Id, page.Title, page.PracticeId.ToString(), Snippet(page.ExtractedText, page.Slug), page.Rank)));
        }
        var ordered = matches.OrderByDescending(result => result.Rank).ThenBy(result => result.Title, StringComparer.Ordinal).ThenBy(result => result.Kind, StringComparer.Ordinal).ThenBy(result => result.Id).ToList();
        if (!string.IsNullOrWhiteSpace(cursor)) { var decoded = DecodeSearchCursor(cursor); ordered = ordered.SkipWhile(item => !SearchAfter(item, decoded)).ToList(); }
        var facets = matches.GroupBy(result => result.Kind).ToDictionary(group => group.Key, group => group.Count(), StringComparer.Ordinal);
        var hasNext = ordered.Count > pageSize; var items = ordered.Take(pageSize).ToList();
        return new SearchResponseDto(items, hasNext ? EncodeSearchCursor(items[^1]) : null, facets);
    }

    public async Task<FileAccessDto> AuthorizeFileUploadAsync(Guid practiceId, FileUploadRequest request, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken); ValidateFile(request); var fileId = Guid.NewGuid(); var safeName = Regex.Replace(request.FileName.Trim(), "[^a-zA-Z0-9._-]", "_");
        var file = new FileMetadata { Id = fileId, PracticeId = practiceId, FileName = request.FileName.Trim(), ContentType = request.ContentType.Trim().ToLowerInvariant(), SizeBytes = request.SizeBytes, StorageObjectName = $"practices/{practiceId:N}/{fileId:N}/{safeName}" };
        db.Add(file); await db.SaveChangesAsync(cancellationToken); var expiresAt = DateTimeOffset.UtcNow.AddSeconds(storageOptions.Value.SignedUrlLifetimeSeconds); var token = CreateFileToken("upload", file, expiresAt);
        return new FileAccessDto(ToFile(file), $"/api/v1/storage/upload/{Uri.EscapeDataString(token)}", expiresAt);
    }

    public async Task<FileAccessDto> AuthorizeFileDownloadAsync(Guid practiceId, Guid fileId, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken); var file = await db.FileMetadata.AsNoTracking().SingleOrDefaultAsync(item => item.Id == fileId && item.PracticeId == practiceId, cancellationToken) ?? throw NotFound();
        if (!await storage.ExistsAsync(file.StorageObjectName, cancellationToken)) throw NotFound(); var expiresAt = DateTimeOffset.UtcNow.AddSeconds(storageOptions.Value.SignedUrlLifetimeSeconds); var token = CreateFileToken("download", file, expiresAt);
        return new FileAccessDto(ToFile(file), $"/api/v1/storage/download/{Uri.EscapeDataString(token)}", expiresAt);
    }

    public async Task UploadFileAsync(string token, Stream content, string? contentType, long? contentLength, CancellationToken cancellationToken)
    {
        var claims = ValidateFileToken(token, "upload"); await RequireMemberAsync(claims.PracticeId, cancellationToken); var file = await db.FileMetadata.SingleOrDefaultAsync(item => item.Id == claims.FileId && item.PracticeId == claims.PracticeId && item.StorageObjectName == claims.ObjectName, cancellationToken) ?? throw NotFound();
        if (!string.Equals(contentType?.Split(';')[0].Trim(), file.ContentType, StringComparison.OrdinalIgnoreCase) || contentLength != file.SizeBytes) throw Validation("Upload content type or size does not match its authorization.");
        try { await storage.WriteAsync(file.StorageObjectName, content, file.SizeBytes, cancellationToken); }
        catch (InvalidDataException) { throw Validation("Upload size does not match its authorization."); }
    }

    public async Task<FileDownloadDto> DownloadFileAsync(string token, CancellationToken cancellationToken)
    {
        var claims = ValidateFileToken(token, "download"); await RequireMemberAsync(claims.PracticeId, cancellationToken); var file = await db.FileMetadata.AsNoTracking().SingleOrDefaultAsync(item => item.Id == claims.FileId && item.PracticeId == claims.PracticeId && item.StorageObjectName == claims.ObjectName, cancellationToken) ?? throw NotFound();
        if (!await storage.ExistsAsync(file.StorageObjectName, cancellationToken)) throw NotFound(); return new FileDownloadDto(await storage.OpenReadAsync(file.StorageObjectName, cancellationToken), file.ContentType, file.FileName);
    }

    public async Task DeleteFileAsync(Guid practiceId, Guid fileId, CancellationToken cancellationToken)
    {
        await RequireMemberAsync(practiceId, cancellationToken); var file = await db.FileMetadata.SingleOrDefaultAsync(item => item.Id == fileId && item.PracticeId == practiceId, cancellationToken) ?? throw NotFound(); await storage.DeleteAsync(file.StorageObjectName, cancellationToken); db.Remove(file); await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<FileDto>> ListFilesAsync(Guid practiceId, CancellationToken cancellationToken) { await RequireMemberAsync(practiceId, cancellationToken); var files = await db.FileMetadata.AsNoTracking().Where(x => x.PracticeId == practiceId).OrderBy(x => x.FileName).ToListAsync(cancellationToken); return files.Select(ToFile).ToList(); }

    private async Task<PracticeMember> RequireMemberAsync(Guid practiceId, CancellationToken cancellationToken) { var userId = await CurrentUserIdAsync(cancellationToken); return await db.PracticeMembers.SingleOrDefaultAsync(x => x.PracticeId == practiceId && x.UserId == userId, cancellationToken) ?? throw Forbidden(); }
    private async Task RequireAdministratorAsync(Guid practiceId, CancellationToken cancellationToken) { var member = await RequireMemberAsync(practiceId, cancellationToken); if (member.Role is not (PracticeRole.Administrator or PracticeRole.Owner)) throw Forbidden(); }
    private async Task RequireGlobalAdministratorAsync(CancellationToken cancellationToken) { if (!await db.Users.AnyAsync(user => user.ExternalSubject == currentUser.ExternalSubject && user.IsGlobalAdministrator, cancellationToken)) throw Forbidden(); }
    private async Task<Guid> CurrentUserIdAsync(CancellationToken cancellationToken) { if (!currentUser.IsAuthenticated) throw new ApiOperationException(ErrorCodes.NotAuthenticated, "Authentication is required.", StatusCodes.Status401Unauthorized); return (await db.Users.SingleOrDefaultAsync(x => x.ExternalSubject == currentUser.ExternalSubject, cancellationToken) ?? throw Forbidden()).Id; }
    private static PracticePageDto ToPage(PracticePage page) { var sections = page.Sections.OrderBy(x => x.Position).Select(x => new PageSectionDto(x.Id, x.Position, x.Heading, x.DocumentJson)).ToList(); return new PracticePageDto(page.Id, page.PracticeId, page.Slug, page.Title, sections.FirstOrDefault()?.DocumentJson ?? "[]", sections, page.UpdatedAt, Convert.ToBase64String(page.RowVersion)); }
    private static ArticleDto ToArticle(Article article) { var sections = article.Sections.OrderBy(x => x.Position).Select(x => new PageSectionDto(x.Id, x.Position, x.Heading, x.DocumentJson)).ToList(); return new ArticleDto(article.Id, article.Slug, article.Title, article.Position, article.HeaderUrl, article.IsPublished, sections.FirstOrDefault()?.DocumentJson ?? "[]", sections, article.ArticleTags.Select(tag => tag.TagId).Order().ToList(), Convert.ToBase64String(article.RowVersion)); }
    private static TagDto ToTag(Tag tag) => new(tag.Id, tag.Name, tag.ArticleTags.Select(item => item.ArticleId).Order().ToList(), Convert.ToBase64String(tag.RowVersion));
    private static ContactDto ToContact(Contact contact) => new(contact.Id, contact.PracticeId, contact.DisplayName, contact.Email, contact.Telephone, contact.MetadataJson, Convert.ToBase64String(contact.RowVersion));
    private static FileDto ToFile(FileMetadata file) => new(file.Id, file.PracticeId, file.FileName, file.ContentType, file.SizeBytes, file.StorageObjectName, file.UpdatedAt);
    private static void ValidateFile(FileUploadRequest request) { if (request.SizeBytes is < 1 or > 52_428_800) throw Validation("Files must be between 1 byte and 50 MiB."); if (string.IsNullOrWhiteSpace(request.FileName) || request.FileName.Length > 255 || Path.GetFileName(request.FileName) != request.FileName) throw Validation("fileName is invalid."); if (string.IsNullOrWhiteSpace(request.ContentType) || request.ContentType.Length > 255 || !Regex.IsMatch(request.ContentType, "^[a-zA-Z0-9!#$&^_.+-]+/[a-zA-Z0-9!#$&^_.+-]+$", RegexOptions.CultureInvariant)) throw Validation("contentType is invalid."); }
    private static void ValidateArticle(ArticleRequest request) { if (string.IsNullOrWhiteSpace(request.Slug) || request.Slug.Length > 100 || !Regex.IsMatch(request.Slug, "^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.CultureInvariant)) throw Validation("article slug is invalid."); if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Length > 200) throw Validation("article title is invalid."); if (request.Position < 0) throw Validation("article position cannot be negative."); if (!string.IsNullOrWhiteSpace(request.HeaderUrl) && (!Uri.TryCreate(request.HeaderUrl, UriKind.Absolute, out var header) || header.Scheme != Uri.UriSchemeHttps)) throw Validation("headerUrl must be an absolute HTTPS URL."); if (request.Sections.Count is < 1 or > 100) throw Validation("An article must contain between 1 and 100 sections."); foreach (var section in request.Sections) ValidateJson(section.DocumentJson, 2_000_000, JsonValueKind.Array); }
    private static void ValidateTag(TagRequest request) { if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 100) throw Validation("tag name is required and must be at most 100 characters."); }
    private static void ApplyArticleSections(Article article, IReadOnlyList<PageSectionRequest> requests) { for (var position = 0; position < requests.Count; position++) { var request = requests[position]; article.Sections.Add(new ArticleSection { Id = Guid.NewGuid(), ArticleId = article.Id, Position = position, Heading = request.Heading.Trim(), DocumentJson = request.DocumentJson, ExtractedText = ExtractText(request.DocumentJson) }); } article.ExtractedText = string.Join(' ', article.Sections.Select(section => section.ExtractedText)).Trim(); }
    private async Task ApplyArticleTagsAsync(Article article, IReadOnlyList<Guid> tagIds, CancellationToken cancellationToken) { var unique = tagIds.Distinct().ToList(); if (unique.Count != tagIds.Count || await db.Tags.CountAsync(tag => unique.Contains(tag.Id), cancellationToken) != unique.Count) throw Validation("One or more article tags are invalid."); foreach (var tagId in unique) article.ArticleTags.Add(new ArticleTag { ArticleId = article.Id, TagId = tagId }); }
    private sealed record FileToken(string Operation, Guid PracticeId, Guid FileId, string ObjectName, long ExpiresAt);
    private string CreateFileToken(string operation, FileMetadata file, DateTimeOffset expiresAt)
    {
        var payload = EncodeOpaque(new FileToken(operation, file.PracticeId, file.Id, file.StorageObjectName, expiresAt.ToUnixTimeSeconds())); var signature = HMACSHA256.HashData(Encoding.UTF8.GetBytes(storageOptions.Value.SigningKey), Encoding.UTF8.GetBytes(payload)); return $"{payload}.{Convert.ToHexString(signature).ToLowerInvariant()}";
    }
    private FileToken ValidateFileToken(string token, string operation)
    {
        var parts = token.Split('.', 2); if (parts.Length != 2) throw Forbidden(); byte[] supplied;
        try { supplied = Convert.FromHexString(parts[1]); } catch (FormatException) { throw Forbidden(); }
        var expected = HMACSHA256.HashData(Encoding.UTF8.GetBytes(storageOptions.Value.SigningKey), Encoding.UTF8.GetBytes(parts[0]));
        if (!CryptographicOperations.FixedTimeEquals(supplied, expected)) throw Forbidden(); var claims = DecodeOpaque<FileToken>(parts[0], "file token is malformed.");
        if (claims.Operation != operation || claims.ExpiresAt <= DateTimeOffset.UtcNow.ToUnixTimeSeconds() || !claims.ObjectName.StartsWith($"practices/{claims.PracticeId:N}/{claims.FileId:N}/", StringComparison.Ordinal)) throw Forbidden(); return claims;
    }
    private static string NormalizeSlug(string value) => value.Trim().ToLowerInvariant();
    private static IReadOnlyList<PageSectionRequest> ValidatePageRequest(string slug, PageRequest request)
    {
        if (string.IsNullOrWhiteSpace(slug) || slug.Length > 100 || !Regex.IsMatch(slug, "^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.CultureInvariant)) throw Validation("slug has an invalid format.");
        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Length > 200) throw Validation("title is required and must be at most 200 characters.");
        var sections = request.Sections is { Count: > 0 } ? request.Sections : request.DocumentJson is not null ? [new PageSectionRequest(request.Title.Trim(), request.DocumentJson)] : [];
        if (sections.Count is < 1 or > 100) throw Validation("A page must contain between 1 and 100 sections.");
        foreach (var section in sections) { if (section.Heading.Length > 200) throw Validation("section headings must be at most 200 characters."); ValidateJson(section.DocumentJson, 2_000_000, JsonValueKind.Array); }
        return sections;
    }
    private static void ApplySections(PracticePage page, IReadOnlyList<PageSectionRequest> requests)
    {
        var existing = page.Sections.OrderBy(section => section.Position).ToList();
        for (var position = 0; position < requests.Count; position++)
        {
            var request = requests[position]; var section = position < existing.Count ? existing[position] : new PracticePageSection { Id = Guid.NewGuid(), PracticeId = page.PracticeId, PracticePageId = page.Id };
            if (position >= existing.Count) page.Sections.Add(section);
            section.Position = position; section.Heading = request.Heading.Trim(); section.DocumentJson = request.DocumentJson; section.ExtractedText = ExtractText(request.DocumentJson);
        }
        foreach (var extra in existing.Skip(requests.Count)) page.Sections.Remove(extra);
        page.ExtractedText = string.Join(' ', requests.Select(request => ExtractText(request.DocumentJson))).Trim();
    }
    private static bool PageMatches(PracticePage page, string title, IReadOnlyList<PageSectionRequest> requests)
    {
        var persisted = page.Sections.OrderBy(section => section.Position).ToList();
        return page.Title == title && persisted.Count == requests.Count && persisted.Zip(requests).All(pair => pair.First.Heading == pair.Second.Heading.Trim() && JsonEquivalent(pair.First.DocumentJson, pair.Second.DocumentJson));
    }
    private static bool JsonEquivalent(string left, string right) => JsonElement.DeepEquals(JsonSerializer.Deserialize<JsonElement>(left), JsonSerializer.Deserialize<JsonElement>(right));
    private static string Snapshot(string title, IReadOnlyList<PageSectionRequest> sections) => JsonSerializer.Serialize(new { title, sections = sections.Select((section, position) => new { position, heading = section.Heading.Trim(), document = JsonSerializer.Deserialize<JsonElement>(section.DocumentJson) }) });
    private async Task ValidateTemplateDefinitionAsync(string value, CancellationToken cancellationToken)
    {
        ValidateJson(value, 512_000, JsonValueKind.Object); using var document = JsonDocument.Parse(value, new JsonDocumentOptions { MaxDepth = 32 }); var root = document.RootElement;
        if (!root.TryGetProperty("version", out var version) || version.ValueKind != JsonValueKind.Number || version.GetInt32() != 1) throw Validation("Template definition version must be 1.");
        var allowedRootProperties = new HashSet<string>(StringComparer.Ordinal) { "version", "subject", "body" };
        if (root.EnumerateObject().Any(property => !allowedRootProperties.Contains(property.Name))) throw Validation("Template definition contains unsupported properties.");
        var placeholders = new HashSet<string>(StringComparer.Ordinal);
        ValidateSegments(root, "subject", placeholders); ValidateSegments(root, "body", placeholders);
        var allowedKeys = await db.EmailTemplateKeys.AsNoTracking().Where(item => placeholders.Contains(item.Key)).Select(item => item.Key).ToListAsync(cancellationToken);
        var unknown = placeholders.Except(allowedKeys, StringComparer.Ordinal).ToList();
        if (unknown.Count > 0) throw Validation($"Unknown template placeholder: {unknown[0]}.");
    }
    private static void ValidateSegments(JsonElement root, string propertyName, HashSet<string> placeholders)
    {
        if (!root.TryGetProperty(propertyName, out var segments) || segments.ValueKind != JsonValueKind.Array || segments.GetArrayLength() is < 1 or > 500) throw Validation($"Template {propertyName} must be a non-empty segment array.");
        foreach (var segment in segments.EnumerateArray())
        {
            if (segment.ValueKind != JsonValueKind.Object || !segment.TryGetProperty("type", out var type) || type.ValueKind != JsonValueKind.String) throw Validation("Every template segment requires a type.");
            var typeValue = type.GetString(); var properties = segment.EnumerateObject().Select(property => property.Name).ToHashSet(StringComparer.Ordinal);
            if (typeValue == "text")
            {
                if (!properties.SetEquals(["type", "value"]) || !segment.TryGetProperty("value", out var text) || text.ValueKind != JsonValueKind.String || text.GetString() is not { Length: <= 2000 } textValue || textValue.Contains("SYNTHETIC_EXTERNAL_VALUE_", StringComparison.Ordinal)) throw Validation("Template text segments are invalid or contain resolved external values.");
            }
            else if (typeValue == "placeholder")
            {
                if (!properties.SetEquals(["type", "key"]) || !segment.TryGetProperty("key", out var key) || key.ValueKind != JsonValueKind.String || key.GetString() is not { Length: > 0 and <= 100 } keyValue) throw Validation("Template placeholder segments are invalid.");
                placeholders.Add(keyValue);
            }
            else throw Validation("Template segment type must be text or placeholder.");
        }
    }
    private static void ValidateContact(ContactRequest request) { if (string.IsNullOrWhiteSpace(request.DisplayName) || request.DisplayName.Length > 200) throw Validation("displayName is required and must be at most 200 characters."); if (!string.IsNullOrWhiteSpace(request.Email) && (request.Email.Length > 320 || !MailAddress.TryCreate(request.Email, out _))) throw Validation("email is invalid."); if (!string.IsNullOrWhiteSpace(request.Telephone) && !Regex.IsMatch(request.Telephone, "^[+0-9() .-]{3,40}$", RegexOptions.CultureInvariant)) throw Validation("telephone is invalid."); }
    private static string? NormalizeTelephone(string? value) => string.IsNullOrWhiteSpace(value) ? null : string.Concat(value.Where(character => char.IsAsciiDigit(character) || character == '+'));
    private sealed record ContactCursor(string DisplayName, Guid Id);
    private sealed record SearchCursor(float Rank, string Title, string Kind, Guid Id);
    private static string EncodeContactCursor(Contact contact) => Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new ContactCursor(contact.DisplayName, contact.Id)))).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    private static ContactCursor DecodeContactCursor(string value)
    {
        try
        {
            var base64 = value.Replace('-', '+').Replace('_', '/'); base64 = base64.PadRight(base64.Length + ((4 - base64.Length % 4) % 4), '=');
            var cursor = JsonSerializer.Deserialize<ContactCursor>(Encoding.UTF8.GetString(Convert.FromBase64String(base64)));
            return cursor is { DisplayName.Length: <= 200 } && cursor.Id != Guid.Empty ? cursor : throw new FormatException();
        }
        catch (Exception exception) when (exception is FormatException or JsonException) { throw Validation("cursor is malformed."); }
    }
    private static string EncodeSearchCursor(SearchResultDto result) => EncodeOpaque(new SearchCursor(result.Rank, result.Title, result.Kind, result.Id));
    private static SearchCursor DecodeSearchCursor(string value) => DecodeOpaque<SearchCursor>(value, "search cursor is malformed.");
    private static bool SearchAfter(SearchResultDto item, SearchCursor cursor) => item.Rank < cursor.Rank || (item.Rank.Equals(cursor.Rank) && (string.CompareOrdinal(item.Title, cursor.Title) > 0 || (item.Title == cursor.Title && (string.CompareOrdinal(item.Kind, cursor.Kind) > 0 || (item.Kind == cursor.Kind && item.Id.CompareTo(cursor.Id) > 0)))));
    private static string EncodeOpaque<T>(T value) => Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value))).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    private static T DecodeOpaque<T>(string value, string error)
    {
        try { var base64 = value.Replace('-', '+').Replace('_', '/'); base64 = base64.PadRight(base64.Length + ((4 - base64.Length % 4) % 4), '='); return JsonSerializer.Deserialize<T>(Encoding.UTF8.GetString(Convert.FromBase64String(base64))) ?? throw new FormatException(); }
        catch (Exception exception) when (exception is FormatException or JsonException) { throw Validation(error); }
    }
    private static string Snippet(string? text, string fallback) => string.IsNullOrWhiteSpace(text) ? fallback : text.Length <= 240 ? text : text[..240];
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
    private static void ValidateJson(string value, int maxBytes, JsonValueKind expectedRoot) { if (string.IsNullOrWhiteSpace(value) || System.Text.Encoding.UTF8.GetByteCount(value) > maxBytes) throw Validation("The JSON document is missing or too large."); try { using var document = JsonDocument.Parse(value, new JsonDocumentOptions { MaxDepth = 64 }); if (document.RootElement.ValueKind != expectedRoot) throw Validation($"The JSON document root must be {expectedRoot}."); } catch (JsonException) { throw Validation("The document must contain valid JSON with a maximum depth of 64."); } }
    private static void EnsureVersion(byte[] actual, byte[]? expected) { if (expected is null) throw new ApiOperationException(ErrorCodes.PreconditionRequired, "If-Match is required for updates.", StatusCodes.Status428PreconditionRequired); if (!actual.SequenceEqual(expected)) throw new ApiOperationException(ErrorCodes.Conflict, "The resource was changed by another request.", StatusCodes.Status409Conflict); }
    private static ApiOperationException Forbidden() => new(ErrorCodes.Forbidden, "The current user is not allowed to perform this operation.", StatusCodes.Status403Forbidden);
    private static ApiOperationException NotFound() => new(ErrorCodes.NotFound, "The requested resource was not found.", StatusCodes.Status404NotFound);
    private static ApiOperationException Validation(string detail) => new(ErrorCodes.Validation, detail, StatusCodes.Status400BadRequest);
}
