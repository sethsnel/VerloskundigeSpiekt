using Microsoft.EntityFrameworkCore;
using VerloskundigeSpiekt.Domain;
using NpgsqlTypes;

namespace VerloskundigeSpiekt.Infrastructure;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Practice> Practices => Set<Practice>();
    public DbSet<PracticeMember> PracticeMembers => Set<PracticeMember>();
    public DbSet<PracticeInvitation> PracticeInvitations => Set<PracticeInvitation>();
    public DbSet<UserPreference> UserPreferences => Set<UserPreference>();
    public DbSet<PracticePage> PracticePages => Set<PracticePage>();
    public DbSet<PracticePageSection> PracticePageSections => Set<PracticePageSection>();
    public DbSet<PracticePageVersion> PracticePageVersions => Set<PracticePageVersion>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();
    public DbSet<EmailTemplateVersion> EmailTemplateVersions => Set<EmailTemplateVersion>();
    public DbSet<EmailTemplateKey> EmailTemplateKeys => Set<EmailTemplateKey>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<Article> Articles => Set<Article>();
    public DbSet<ArticleSection> ArticleSections => Set<ArticleSection>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<ArticleTag> ArticleTags => Set<ArticleTag>();
    public DbSet<FileMetadata> FileMetadata => Set<FileMetadata>();
    public DbSet<MigrationAlias> MigrationAliases => Set<MigrationAlias>();
    public DbSet<MigrationRun> MigrationRuns => Set<MigrationRun>();
    public DbSet<MigrationRecordState> MigrationRecordStates => Set<MigrationRecordState>();
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("public");
        ConfigureAudited<User>(modelBuilder);
        ConfigureAudited<Practice>(modelBuilder);
        ConfigureAudited<PracticeInvitation>(modelBuilder);
        ConfigureAudited<PracticePage>(modelBuilder);
        ConfigureAudited<PracticePageSection>(modelBuilder);
        ConfigureAudited<EmailTemplate>(modelBuilder);
        ConfigureAudited<Contact>(modelBuilder);
        ConfigureAudited<Article>(modelBuilder);
        ConfigureAudited<ArticleSection>(modelBuilder);
        ConfigureAudited<Tag>(modelBuilder);
        ConfigureAudited<FileMetadata>(modelBuilder);

        modelBuilder.Entity<MigrationAlias>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SourceSystem).HasMaxLength(50).IsRequired();
            entity.Property(x => x.SourceDocumentId).HasMaxLength(500).IsRequired();
            entity.Property(x => x.TargetType).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Checksum).HasMaxLength(128).IsRequired();
            entity.HasIndex(x => new { x.SourceSystem, x.SourceDocumentId }).IsUnique();
        });
        modelBuilder.Entity<MigrationRun>(entity =>
        {
            entity.HasKey(x => x.RunId);
            entity.Property(x => x.SourceChecksum).HasMaxLength(128).IsRequired();
            entity.Property(x => x.ChecksumAlgorithm).HasMaxLength(64).IsRequired();
            entity.Property(x => x.ToolVersion).HasMaxLength(32).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(32).IsRequired();
            entity.HasIndex(x => new { x.SourceChecksum, x.ChecksumAlgorithm }).IsUnique();
        });
        modelBuilder.Entity<MigrationRecordState>(entity =>
        {
            entity.HasKey(x => new { x.MigrationRunId, x.SourceDocumentId });
            entity.Property(x => x.SourceDocumentId).HasMaxLength(600).IsRequired();
            entity.Property(x => x.TargetType).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Checksum).HasMaxLength(128).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(32).IsRequired();
            entity.Property(x => x.ErrorCode).HasMaxLength(100);
            entity.Property(x => x.ErrorMetadataJson).HasColumnType("jsonb");
            entity.HasOne(x => x.Run).WithMany(x => x.Records).HasForeignKey(x => x.MigrationRunId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(x => new { x.MigrationRunId, x.Status });
        });
        modelBuilder.Entity<IdempotencyRecord>(entity =>
        {
            entity.HasKey(x => new { x.UserId, x.Key });
            entity.Property(x => x.Key).HasMaxLength(128).IsRequired();
            entity.Property(x => x.Operation).HasMaxLength(100).IsRequired();
            entity.Property(x => x.RequestFingerprint).HasMaxLength(64).IsRequired();
            entity.Property(x => x.ResponseJson).HasColumnType("jsonb").IsRequired();
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(x => x.ExpiresAt);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ExternalSubject).HasMaxLength(255).IsRequired();
            entity.HasIndex(x => x.ExternalSubject).IsUnique();
            entity.HasIndex(x => x.NormalizedEmail);
        });

        modelBuilder.Entity<Practice>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(100).IsRequired();
            entity.HasIndex(x => x.Slug).IsUnique();
        });

        modelBuilder.Entity<PracticeMember>(entity =>
        {
            entity.HasKey(x => new { x.PracticeId, x.UserId });
            entity.Property(x => x.Role).HasConversion<string>().HasMaxLength(32);
            entity.HasIndex(x => x.UserId);
            entity.HasIndex(x => new { x.UserId, x.PracticeId });
            entity.HasOne(x => x.Practice).WithMany(x => x.Members).HasForeignKey(x => x.PracticeId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.User).WithMany(x => x.PracticeMembers).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PracticeInvitation>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.InvitedEmailNormalized).HasMaxLength(320).IsRequired();
            entity.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            entity.Property(x => x.Role).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            entity.HasIndex(x => new { x.PracticeId, x.InvitedEmailNormalized }).HasFilter("status = 'Pending'").IsUnique();
            entity.HasIndex(x => new { x.InvitedEmailNormalized, x.Status });
            entity.HasOne(x => x.Practice).WithMany(x => x.Invitations).HasForeignKey(x => x.PracticeId).OnDelete(DeleteBehavior.Cascade);
            entity.ToTable("practice_invitations", table => table.HasCheckConstraint("ck_practice_invitations_expiry", "expires_at > created_at"));
        });

        modelBuilder.Entity<UserPreference>(entity =>
        {
            entity.HasKey(x => x.UserId);
            entity.HasOne(x => x.User).WithOne().HasForeignKey<UserPreference>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PracticePage>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasAlternateKey(x => new { x.PracticeId, x.Id });
            entity.HasIndex(x => new { x.PracticeId, x.Slug }).IsUnique();
            entity.Property<NpgsqlTsVector>("SearchVector").HasColumnType("tsvector").HasComputedColumnSql("to_tsvector('dutch', coalesce(title, '') || ' ' || coalesce(extracted_text, ''))", stored: true);
            entity.HasIndex("SearchVector").HasMethod("GIN");
            entity.HasOne(x => x.Practice).WithMany(x => x.Pages).HasForeignKey(x => x.PracticeId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<PracticePageSection>(entity =>
        {
            entity.HasKey(x => x.Id);
            // Sections are owned by the page aggregate; the page ETag and advisory
            // lock serialize the complete ordered-section update.
            entity.Property(x => x.RowVersion).IsConcurrencyToken(false);
            entity.HasIndex(x => new { x.PracticeId, x.PracticePageId, x.Position }).IsUnique();
            entity.Property(x => x.DocumentJson).HasColumnType("jsonb");
            entity.HasOne(x => x.Page).WithMany(x => x.Sections).HasForeignKey(x => new { x.PracticeId, x.PracticePageId }).HasPrincipalKey(x => new { x.PracticeId, x.Id }).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<PracticePageVersion>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.PracticeId, x.PracticePageId, x.VersionNumber }).IsUnique();
            entity.Property(x => x.SnapshotJson).HasColumnType("jsonb");
            entity.HasOne(x => x.Page).WithMany(x => x.Versions).HasForeignKey(x => new { x.PracticeId, x.PracticePageId }).HasPrincipalKey(x => new { x.PracticeId, x.Id }).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<EmailTemplate>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasAlternateKey(x => new { x.PracticeId, x.Id });
            entity.HasIndex(x => new { x.PracticeId, x.Key }).IsUnique();
            entity.HasOne(x => x.Practice).WithMany(x => x.EmailTemplates).HasForeignKey(x => x.PracticeId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<EmailTemplateVersion>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.PracticeId, x.EmailTemplateId, x.VersionNumber }).IsUnique();
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.DefinitionJson).HasColumnType("jsonb");
            entity.HasOne(x => x.Template).WithMany(x => x.Versions).HasForeignKey(x => new { x.PracticeId, x.EmailTemplateId }).HasPrincipalKey(x => new { x.PracticeId, x.Id }).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<EmailTemplateKey>(entity => { entity.HasKey(x => x.Id); entity.HasIndex(x => x.Key).IsUnique(); });
        modelBuilder.Entity<Contact>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.PracticeId, x.NormalizedEmail });
            entity.HasIndex(x => new { x.PracticeId, x.DisplayName });
            entity.HasOne(x => x.Practice).WithMany(x => x.Contacts).HasForeignKey(x => x.PracticeId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(x => x.MetadataJson).HasColumnType("jsonb");
        });
        modelBuilder.Entity<Article>(entity => { entity.HasKey(x => x.Id); entity.HasIndex(x => x.Slug).IsUnique(); entity.Property(x => x.HeaderUrl).HasMaxLength(2048); entity.Property<NpgsqlTsVector>("SearchVector").HasColumnType("tsvector").HasComputedColumnSql("to_tsvector('dutch', coalesce(title, '') || ' ' || coalesce(extracted_text, ''))", stored: true); entity.HasIndex("SearchVector").HasMethod("GIN"); });
        modelBuilder.Entity<ArticleSection>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.ArticleId, x.Position }).IsUnique();
            entity.HasOne(x => x.Article).WithMany(x => x.Sections).HasForeignKey(x => x.ArticleId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(x => x.DocumentJson).HasColumnType("jsonb");
        });
        modelBuilder.Entity<Tag>(entity => { entity.HasKey(x => x.Id); entity.Property(x => x.Name).HasMaxLength(100).IsRequired(); entity.HasIndex(x => x.Name).IsUnique(); });
        modelBuilder.Entity<ArticleTag>(entity =>
        {
            entity.HasKey(x => new { x.ArticleId, x.TagId });
            entity.HasOne(x => x.Article).WithMany(x => x.ArticleTags).HasForeignKey(x => x.ArticleId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Tag).WithMany(x => x.ArticleTags).HasForeignKey(x => x.TagId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<FileMetadata>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.PracticeId, x.StorageObjectName }).IsUnique();
            entity.ToTable("file_metadata", table => table.HasCheckConstraint("ck_file_metadata_size", "size_bytes >= 0 AND size_bytes <= 52428800"));
            entity.HasOne(x => x.Practice).WithMany(x => x.Files).HasForeignKey(x => x.PracticeId).OnDelete(DeleteBehavior.Cascade);
        });

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            entityType.SetTableName(ToSnakeCase(entityType.GetTableName() ?? entityType.DisplayName()));
            foreach (var property in entityType.GetProperties()) property.SetColumnName(ToSnakeCase(property.Name));
        }
    }

    private static void ConfigureAudited<TEntity>(ModelBuilder modelBuilder) where TEntity : AuditedEntity
    {
        modelBuilder.Entity<TEntity>(entity =>
        {
            entity.Property(x => x.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();
            entity.Property(x => x.UpdatedAt).HasColumnType("timestamp with time zone").IsRequired();
            entity.Property(x => x.RowVersion).IsConcurrencyToken().IsRequired();
        });
    }

    private static string ToSnakeCase(string value)
    {
        var builder = new System.Text.StringBuilder(value.Length + 8);
        for (var index = 0; index < value.Length; index++)
        {
            var character = value[index];
            if (char.IsUpper(character) && index > 0) builder.Append('_');
            builder.Append(char.ToLowerInvariant(character));
        }
        return builder.ToString();
    }

    public override int SaveChanges()
    {
        ApplyAuditValues();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditValues();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyAuditValues()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditedEntity audited)
            {
                if (entry.State == EntityState.Added)
                {
                    audited.CreatedAt = now;
                    audited.RowVersion = Guid.NewGuid().ToByteArray();
                }
                if (entry.State is EntityState.Added or EntityState.Modified)
                {
                    audited.UpdatedAt = now;
                    audited.RowVersion = Guid.NewGuid().ToByteArray();
                }
            }
            else if (entry.Entity is PracticeMember member && entry.State is EntityState.Added or EntityState.Modified)
            {
                if (entry.State == EntityState.Added) member.CreatedAt = now;
                member.UpdatedAt = now;
                member.RowVersion = Guid.NewGuid().ToByteArray();
            }
            else if (entry.Entity is UserPreference preference && entry.State is EntityState.Added or EntityState.Modified)
            {
                preference.UpdatedAt = now;
            }
        }
    }
}
