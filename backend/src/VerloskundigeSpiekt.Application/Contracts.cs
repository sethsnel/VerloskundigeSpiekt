using VerloskundigeSpiekt.Domain;

namespace VerloskundigeSpiekt.Application;

public interface ICurrentUser
{
    Guid? UserId { get; }
    string ExternalSubject { get; }
    string? Email { get; }
    string? NormalizedEmail { get; }
    bool EmailVerified { get; }
    bool IsAuthenticated { get; }
}

public interface IPracticeService
{
    Task<MeDto> GetMeAsync(CancellationToken cancellationToken);
    Task<MeDto> UpdateActivePracticeAsync(Guid? practiceId, CancellationToken cancellationToken);
    Task<IReadOnlyList<PracticeDto>> ListAsync(CancellationToken cancellationToken);
    Task<PracticeDto> GetAsync(Guid practiceId, CancellationToken cancellationToken);
    Task<PracticeDto> CreateAsync(CreatePracticeRequest request, string? idempotencyKey, CancellationToken cancellationToken);
    Task<PracticeDto> UpdateAsync(Guid practiceId, UpdatePracticeRequest request, byte[]? expectedVersion, CancellationToken cancellationToken);
    Task<IReadOnlyList<MemberDto>> ListMembersAsync(Guid practiceId, CancellationToken cancellationToken);
    Task UpdateMemberRoleAsync(Guid practiceId, Guid userId, PracticeRole role, byte[]? expectedVersion, CancellationToken cancellationToken);
    Task RemoveMemberAsync(Guid practiceId, Guid userId, CancellationToken cancellationToken);
    Task TransferOwnershipAsync(Guid practiceId, Guid newOwnerId, CancellationToken cancellationToken);
    Task<IReadOnlyList<InvitationDto>> ListPendingInvitationsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<InvitationDto>> ListPracticeInvitationsAsync(Guid practiceId, CancellationToken cancellationToken);
    Task<InvitationDto> CreateInvitationAsync(Guid practiceId, CreateInvitationRequest request, CancellationToken cancellationToken);
    Task<InvitationDto> RespondToInvitationAsync(Guid invitationId, InvitationResponse response, string? idempotencyKey, CancellationToken cancellationToken);
    Task RevokeInvitationAsync(Guid practiceId, Guid invitationId, CancellationToken cancellationToken);
}

public interface IContentService
{
    Task<IReadOnlyList<PracticePageDto>> ListPagesAsync(Guid practiceId, CancellationToken cancellationToken);
    Task<PracticePageDto> GetPageAsync(Guid practiceId, string slug, CancellationToken cancellationToken);
    Task<PracticePageDto> CreatePageAsync(Guid practiceId, string slug, PageRequest request, bool idempotentSeed, CancellationToken cancellationToken);
    Task<PracticePageDto> UpdatePageAsync(Guid practiceId, string slug, PageRequest request, byte[]? expectedVersion, CancellationToken cancellationToken);
    Task DeletePageAsync(Guid practiceId, string slug, byte[]? expectedVersion, CancellationToken cancellationToken);
    Task<IReadOnlyList<PageVersionDto>> ListPageVersionsAsync(Guid practiceId, string slug, CancellationToken cancellationToken);
    Task<IReadOnlyList<EmailTemplateDto>> ListPublishedTemplatesAsync(Guid practiceId, CancellationToken cancellationToken);
    Task<EmailTemplateDto> GetPublishedTemplateAsync(Guid practiceId, string key, CancellationToken cancellationToken);
    Task<EmailTemplateDto> UpsertTemplateAsync(Guid practiceId, string key, TemplateRequest request, byte[]? expectedVersion, CancellationToken cancellationToken);
    Task<PagedResult<ContactDto>> ListContactsAsync(Guid practiceId, string? cursor, int pageSize, CancellationToken cancellationToken);
    Task<ContactDto> CreateContactAsync(Guid practiceId, ContactRequest request, CancellationToken cancellationToken);
    Task<ContactDto> UpdateContactAsync(Guid practiceId, Guid contactId, ContactRequest request, byte[]? expectedVersion, CancellationToken cancellationToken);
    Task DeleteContactAsync(Guid practiceId, Guid contactId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ArticleDto>> ListArticlesAsync(CancellationToken cancellationToken);
    Task<ArticleDto> GetArticleAsync(string slug, CancellationToken cancellationToken);
    Task<ArticleDto> CreateArticleAsync(ArticleRequest request, CancellationToken cancellationToken);
    Task<ArticleDto> UpdateArticleAsync(Guid articleId, ArticleRequest request, byte[]? expectedVersion, CancellationToken cancellationToken);
    Task DeleteArticleAsync(Guid articleId, byte[]? expectedVersion, CancellationToken cancellationToken);
    Task<IReadOnlyList<TagDto>> ListTagsAsync(CancellationToken cancellationToken);
    Task<TagDto> CreateTagAsync(TagRequest request, CancellationToken cancellationToken);
    Task<TagDto> UpdateTagAsync(Guid tagId, TagRequest request, byte[]? expectedVersion, CancellationToken cancellationToken);
    Task<SearchResponseDto> SearchAsync(Guid? practiceId, string query, string? cursor, int pageSize, string? kind, CancellationToken cancellationToken);
    Task<FileAccessDto> AuthorizeFileUploadAsync(Guid practiceId, FileUploadRequest request, CancellationToken cancellationToken);
    Task<FileAccessDto> AuthorizeFileDownloadAsync(Guid practiceId, Guid fileId, CancellationToken cancellationToken);
    Task UploadFileAsync(string token, Stream content, string? contentType, long? contentLength, CancellationToken cancellationToken);
    Task<FileDownloadDto> DownloadFileAsync(string token, CancellationToken cancellationToken);
    Task DeleteFileAsync(Guid practiceId, Guid fileId, CancellationToken cancellationToken);
    Task<IReadOnlyList<FileDto>> ListFilesAsync(Guid practiceId, CancellationToken cancellationToken);
}

public sealed record MeDto(Guid Id, string ExternalSubject, string? Email, string? DisplayName, bool EmailVerified, Guid? ActivePracticeId);
public sealed record PracticeDto(Guid Id, string Name, string Slug, PracticeRole Role, DateTimeOffset CreatedAt, string Version);
public sealed record MemberDto(Guid UserId, string? Email, string? DisplayName, PracticeRole Role, string Version);
public sealed record InvitationDto(Guid Id, Guid PracticeId, string Email, PracticeRole Role, InvitationStatus Status, DateTimeOffset ExpiresAt, string Version);
public sealed record CreatePracticeRequest(string Name, string Slug);
public sealed record UpdatePracticeRequest(string Name, string Slug);
public sealed record CreateInvitationRequest(string Email, PracticeRole Role, int ValidForDays = 7);
public enum InvitationResponse { Accept, Decline }
public sealed record PracticePageDto(Guid Id, Guid PracticeId, string Slug, string Title, string DocumentJson, IReadOnlyList<PageSectionDto> Sections, DateTimeOffset UpdatedAt, string Version);
public sealed record PageSectionDto(Guid Id, int Position, string Heading, string DocumentJson);
public sealed record PageSectionRequest(string Heading, string DocumentJson);
public sealed record PageRequest(string Title, string? DocumentJson = null, IReadOnlyList<PageSectionRequest>? Sections = null);
public sealed record PageVersionDto(Guid Id, int VersionNumber, string SnapshotJson, DateTimeOffset CreatedAt, Guid ChangedByUserId);
public sealed record EmailTemplateDto(Guid Id, Guid PracticeId, string Key, string Name, string DefinitionJson, TemplateVersionStatus Status, string Version);
public sealed record TemplateRequest(string Name, string DefinitionJson, TemplateVersionStatus Status = TemplateVersionStatus.Draft);
public sealed record ContactDto(Guid Id, Guid PracticeId, string DisplayName, string? Email, string? Telephone, string MetadataJson, string Version);
public sealed record ContactRequest(string DisplayName, string? Email, string? Telephone, string MetadataJson = "{}");
public sealed record ArticleDto(Guid Id, string Slug, string Title, int Position, string? HeaderUrl, bool IsPublished, string DocumentJson, IReadOnlyList<PageSectionDto> Sections, IReadOnlyList<Guid> TagIds, string Version);
public sealed record ArticleRequest(string Slug, string Title, int Position, string? HeaderUrl, bool IsPublished, IReadOnlyList<PageSectionRequest> Sections, IReadOnlyList<Guid>? TagIds = null);
public sealed record TagDto(Guid Id, string Name, IReadOnlyList<Guid> ArticleIds, string Version);
public sealed record TagRequest(string Name);
public sealed record SearchResultDto(string Kind, Guid Id, string Title, string? PracticeId, string Snippet, float Rank);
public sealed record SearchResponseDto(IReadOnlyList<SearchResultDto> Items, string? NextCursor, IReadOnlyDictionary<string, int> Facets);
public sealed record FileDto(Guid Id, Guid PracticeId, string FileName, string ContentType, long SizeBytes, string StorageObjectName, DateTimeOffset UpdatedAt);
public sealed record FileUploadRequest(string FileName, string ContentType, long SizeBytes);
public sealed record FileAccessDto(FileDto File, string Url, DateTimeOffset ExpiresAt);
public sealed record FileDownloadDto(Stream Content, string ContentType, string FileName);
public sealed record PagedResult<T>(IReadOnlyList<T> Items, string? NextCursor);

public sealed record ApiError(string Code, string Detail);
public sealed class ApiOperationException(string code, string detail, int statusCode) : Exception(detail)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;
}

public static class ErrorCodes
{
    public const string NotAuthenticated = "auth.not_authenticated";
    public const string Forbidden = "auth.forbidden";
    public const string NotFound = "resource.not_found";
    public const string Validation = "request.validation_failed";
    public const string Conflict = "resource.conflict";
    public const string InvitationEmailUnverified = "invitation.email_not_verified";
    public const string InvitationState = "invitation.invalid_state";
    public const string OnlyOwner = "practice.only_owner";
    public const string IdempotencyConflict = "request.idempotency_conflict";
    public const string PreconditionRequired = "request.precondition_required";
    public const string MalformedPrecondition = "request.precondition_malformed";
    public const string RequestTooLarge = "request.body_too_large";
}
