namespace VerloskundigeSpiekt.Domain;

public enum PracticeRole { Member, Administrator, Owner }
public enum InvitationStatus { Pending, Accepted, Declined, Revoked, Expired }
public enum TemplateVersionStatus { Draft, Published, Archived }

public abstract class AuditedEntity
{
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

public sealed class User : AuditedEntity
{
    public Guid Id { get; set; }
    public string ExternalSubject { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? NormalizedEmail { get; set; }
    public string? DisplayName { get; set; }
    public bool EmailVerified { get; set; }
    public bool IsGlobalAdministrator { get; set; }
    public ICollection<PracticeMember> PracticeMembers { get; set; } = [];
}

public sealed class Practice : AuditedEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public ICollection<PracticeMember> Members { get; set; } = [];
    public ICollection<PracticeInvitation> Invitations { get; set; } = [];
    public ICollection<PracticePage> Pages { get; set; } = [];
    public ICollection<EmailTemplate> EmailTemplates { get; set; } = [];
    public ICollection<Contact> Contacts { get; set; } = [];
    public ICollection<FileMetadata> Files { get; set; } = [];
}

public sealed class PracticeMember
{
    public Guid PracticeId { get; set; }
    public Guid UserId { get; set; }
    public PracticeRole Role { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public Practice Practice { get; set; } = null!;
    public User User { get; set; } = null!;
}

public sealed class PracticeInvitation : AuditedEntity
{
    public Guid Id { get; set; }
    public Guid PracticeId { get; set; }
    public Guid InvitedByUserId { get; set; }
    public Guid? AcceptedByUserId { get; set; }
    public string InvitedEmail { get; set; } = string.Empty;
    public string InvitedEmailNormalized { get; set; } = string.Empty;
    public PracticeRole Role { get; set; }
    public InvitationStatus Status { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RespondedAt { get; set; }
    public Practice Practice { get; set; } = null!;
}

public sealed class UserPreference
{
    public Guid UserId { get; set; }
    public Guid? ActivePracticeId { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public User User { get; set; } = null!;
}

public sealed class PracticePage : AuditedEntity
{
    public Guid Id { get; set; }
    public Guid PracticeId { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? ExtractedText { get; set; }
    public Practice Practice { get; set; } = null!;
    public ICollection<PracticePageSection> Sections { get; set; } = [];
    public ICollection<PracticePageVersion> Versions { get; set; } = [];
}

public sealed class PracticePageSection : AuditedEntity
{
    public Guid Id { get; set; }
    public Guid PracticeId { get; set; }
    public Guid PracticePageId { get; set; }
    public int Position { get; set; }
    public string Heading { get; set; } = string.Empty;
    public string DocumentJson { get; set; } = "[]";
    public string? ExtractedText { get; set; }
    public PracticePage Page { get; set; } = null!;
}

public sealed class PracticePageVersion
{
    public Guid Id { get; set; }
    public Guid PracticeId { get; set; }
    public Guid PracticePageId { get; set; }
    public Guid ChangedByUserId { get; set; }
    public int VersionNumber { get; set; }
    public string SnapshotJson { get; set; } = "{}";
    public DateTimeOffset CreatedAt { get; set; }
    public PracticePage Page { get; set; } = null!;
}

public sealed class EmailTemplate : AuditedEntity
{
    public Guid Id { get; set; }
    public Guid PracticeId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Practice Practice { get; set; } = null!;
    public ICollection<EmailTemplateVersion> Versions { get; set; } = [];
}

public sealed class EmailTemplateVersion
{
    public Guid Id { get; set; }
    public Guid PracticeId { get; set; }
    public Guid EmailTemplateId { get; set; }
    public Guid ChangedByUserId { get; set; }
    public int VersionNumber { get; set; }
    public TemplateVersionStatus Status { get; set; }
    public string DefinitionJson { get; set; } = "{}";
    public DateTimeOffset CreatedAt { get; set; }
    public EmailTemplate Template { get; set; } = null!;
}

public sealed class EmailTemplateKey
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool Required { get; set; }
}

public sealed class Contact : AuditedEntity
{
    public Guid Id { get; set; }
    public Guid PracticeId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? NormalizedEmail { get; set; }
    public string? Telephone { get; set; }
    public string? NormalizedTelephone { get; set; }
    public string MetadataJson { get; set; } = "{}";
    public Practice Practice { get; set; } = null!;
}

public sealed class Article : AuditedEntity
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public int Position { get; set; }
    public ICollection<ArticleSection> Sections { get; set; } = [];
}

public sealed class ArticleSection : AuditedEntity
{
    public Guid Id { get; set; }
    public Guid ArticleId { get; set; }
    public int Position { get; set; }
    public string Heading { get; set; } = string.Empty;
    public string DocumentJson { get; set; } = "[]";
    public string? ExtractedText { get; set; }
    public Article Article { get; set; } = null!;
}

public sealed class FileMetadata : AuditedEntity
{
    public Guid Id { get; set; }
    public Guid PracticeId { get; set; }
    public string StorageObjectName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public long SizeBytes { get; set; }
    public string? ETag { get; set; }
    public Practice Practice { get; set; } = null!;
}

public sealed class MigrationAlias
{
    public Guid Id { get; set; }
    public string SourceSystem { get; set; } = "firestore";
    public string SourceDocumentId { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public Guid TargetId { get; set; }
    public Guid MigrationRunId { get; set; }
    public string Checksum { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
