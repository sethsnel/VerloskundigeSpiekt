using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Diagnostics;
using System.Text.Json;
using System.Text;
using Microsoft.Extensions.Options;
using Testcontainers.PostgreSql;
using VerloskundigeSpiekt.Infrastructure;
using VerloskundigeSpiekt.Application;
using VerloskundigeSpiekt.Domain;
using Xunit;

namespace VerloskundigeSpiekt.IntegrationTests;

public sealed class PostgreSqlSecurityFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer container = new PostgreSqlBuilder().WithImage("postgres:17.5-bookworm")
        .WithDatabase("verloskundigespiekt").WithUsername("postgres").WithPassword("postgres").Build();

    public string RuntimeConnectionString { get; private set; } = string.Empty;
    public string MigratorConnectionString { get; private set; } = string.Empty;

    public async Task InitializeAsync()
    {
        await container.StartAsync();
        await using (var admin = new NpgsqlConnection(container.GetConnectionString()))
        {
            await admin.OpenAsync();
            await new NpgsqlCommand("""
                CREATE ROLE vs_migrator LOGIN PASSWORD 'migrator' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
                CREATE ROLE vs_api LOGIN PASSWORD 'runtime' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
                ALTER DATABASE verloskundigespiekt OWNER TO vs_migrator;
                ALTER SCHEMA public OWNER TO vs_migrator;
                GRANT CONNECT ON DATABASE verloskundigespiekt TO vs_migrator, vs_api;
                GRANT USAGE ON SCHEMA public TO vs_api;
                """, admin).ExecuteNonQueryAsync();
        }

        var builder = new NpgsqlConnectionStringBuilder(container.GetConnectionString()) { Username = "vs_migrator", Password = "migrator" };
        MigratorConnectionString = builder.ConnectionString;
        await using (var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(MigratorConnectionString).Options))
            await db.Database.MigrateAsync();

        await using (var migrator = new NpgsqlConnection(MigratorConnectionString))
        {
            await migrator.OpenAsync();
            var grantsPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "database", "roles.sql"));
            await new NpgsqlCommand(await File.ReadAllTextAsync(grantsPath), migrator).ExecuteNonQueryAsync();
        }

        builder.Username = "vs_api"; builder.Password = "runtime";
        RuntimeConnectionString = builder.ConnectionString;
    }

    public Task DisposeAsync() => container.DisposeAsync().AsTask();
}

[CollectionDefinition(nameof(PostgreSqlSecurityTestGroup))]
public sealed class PostgreSqlSecurityTestGroup : ICollectionFixture<PostgreSqlSecurityFixture>;

[Collection(nameof(PostgreSqlSecurityTestGroup))]
public sealed class DatabaseSecurityTests(PostgreSqlSecurityFixture fixture)
{
    private static readonly Guid UserA = Guid.Parse("10000000-0000-0000-0000-000000000001");
    private static readonly Guid UserB = Guid.Parse("10000000-0000-0000-0000-000000000002");
    private static readonly Guid PracticeA = Guid.Parse("20000000-0000-0000-0000-000000000001");
    private readonly IObjectStorage objectStorage = new TestObjectStorage();
    private int storageLifetimeSeconds = 300;

    [Fact]
    public async Task RuntimeRoleCannotSelfEnrollOrReadAnotherPractice()
    {
        await SeedAsync();
        await using var connection = new NpgsqlConnection(fixture.RuntimeConnectionString);
        await connection.OpenAsync();

        foreach (var role in new[] { "Member", "Administrator", "Owner" })
        {
            await using var transaction = await connection.BeginTransactionAsync();
            await SetIdentityAsync(connection, transaction, "subject-b", "b@example.test");
            var command = new NpgsqlCommand("INSERT INTO practice_members(practice_id,user_id,role,created_at,updated_at,row_version) VALUES($1,$2,$3,now(),now(),uuid_send(gen_random_uuid()))", connection, transaction);
            command.Parameters.AddWithValue(PracticeA); command.Parameters.AddWithValue(UserB); command.Parameters.AddWithValue(role);
            var action = async () => await command.ExecuteNonQueryAsync();
            await action.Should().ThrowAsync<PostgresException>().Where(error => error.SqlState == PostgresErrorCodes.InsufficientPrivilege);
            await transaction.RollbackAsync();
        }

        await using var readTransaction = await connection.BeginTransactionAsync();
        await SetIdentityAsync(connection, readTransaction, "subject-b", "b@example.test");
        var visible = (long)(await new NpgsqlCommand("SELECT count(*) FROM practices", connection, readTransaction).ExecuteScalarAsync())!;
        visible.Should().Be(0);
    }

    [Fact]
    public async Task RuntimeRoleCanOnlyCreateInitialOwnerThroughScopedFunction()
    {
        await SeedUsersAsync();
        await using var connection = new NpgsqlConnection(fixture.RuntimeConnectionString);
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        await SetIdentityAsync(connection, transaction, "subject-b", "b@example.test");
        var practiceId = Guid.NewGuid();
        var command = new NpgsqlCommand("SELECT app_create_practice($1,$2,$3,$4)", connection, transaction);
        command.Parameters.AddWithValue(practiceId); command.Parameters.AddWithValue("Scoped practice"); command.Parameters.AddWithValue($"scoped-{practiceId:N}"); command.Parameters.AddWithValue(UserB);
        await command.ExecuteNonQueryAsync();
        var role = (string?)await new NpgsqlCommand("SELECT role FROM practice_members WHERE practice_id=$1 AND user_id=$2", connection, transaction) { Parameters = { new() { Value = practiceId }, new() { Value = UserB } } }.ExecuteScalarAsync();
        role.Should().Be("Owner");
        await transaction.RollbackAsync();
    }

    [Fact]
    public async Task OwnershipTransferIsAtomicAndRestrictedToTheAuthenticatedOwner()
    {
        await SeedAsync();
        await using (var migrator = new NpgsqlConnection(fixture.MigratorConnectionString))
        {
            await migrator.OpenAsync();
            var addMember = new NpgsqlCommand("INSERT INTO practice_members(practice_id,user_id,role,created_at,updated_at,row_version) VALUES($1,$2,'Member',now(),now(),uuid_send(gen_random_uuid())) ON CONFLICT(practice_id,user_id) DO UPDATE SET role='Member'", migrator);
            addMember.Parameters.AddWithValue(PracticeA); addMember.Parameters.AddWithValue(UserB);
            await addMember.ExecuteNonQueryAsync();
        }

        await using var runtime = new NpgsqlConnection(fixture.RuntimeConnectionString);
        await runtime.OpenAsync();
        await using (var unauthorized = await runtime.BeginTransactionAsync())
        {
            await SetIdentityAsync(runtime, unauthorized, "subject-b", "b@example.test");
            var transfer = new NpgsqlCommand("SELECT app_transfer_practice_ownership($1,$2,$3)", runtime, unauthorized);
            transfer.Parameters.AddWithValue(PracticeA); transfer.Parameters.AddWithValue(UserB); transfer.Parameters.AddWithValue(UserA);
            var action = async () => await transfer.ExecuteNonQueryAsync();
            await action.Should().ThrowAsync<PostgresException>().Where(error => error.SqlState == PostgresErrorCodes.InsufficientPrivilege);
            await unauthorized.RollbackAsync();
        }

        await using (var authorized = await runtime.BeginTransactionAsync())
        {
            await SetIdentityAsync(runtime, authorized, "subject-a", "a@example.test");
            var transfer = new NpgsqlCommand("SELECT app_transfer_practice_ownership($1,$2,$3)", runtime, authorized);
            transfer.Parameters.AddWithValue(PracticeA); transfer.Parameters.AddWithValue(UserA); transfer.Parameters.AddWithValue(UserB);
            await transfer.ExecuteNonQueryAsync();
            await authorized.CommitAsync();
        }

        await using var verify = new NpgsqlConnection(fixture.MigratorConnectionString);
        await verify.OpenAsync();
        var roles = new NpgsqlCommand("SELECT user_id,role FROM practice_members WHERE practice_id=$1 ORDER BY user_id", verify);
        roles.Parameters.AddWithValue(PracticeA);
        await using var reader = await roles.ExecuteReaderAsync();
        var actual = new Dictionary<Guid, string>();
        while (await reader.ReadAsync()) actual[reader.GetGuid(0)] = reader.GetString(1);
        actual[UserA].Should().Be("Administrator");
        actual[UserB].Should().Be("Owner");
    }

    [Fact]
    public async Task CompositeForeignKeysRejectCrossPracticeChildrenAndDocumentsUseJsonb()
    {
        await SeedUsersAsync();
        await using var connection = new NpgsqlConnection(fixture.MigratorConnectionString); await connection.OpenAsync();
        var practiceOne = Guid.NewGuid(); var practiceTwo = Guid.NewGuid(); var page = Guid.NewGuid(); var template = Guid.NewGuid();
        foreach (var (id, slug) in new[] { (practiceOne, $"one-{practiceOne:N}"), (practiceTwo, $"two-{practiceTwo:N}") })
        {
            var insertPractice = new NpgsqlCommand("INSERT INTO practices(id,name,slug,created_at,updated_at,row_version) VALUES($1,'Tenant FK',$2,now(),now(),uuid_send(gen_random_uuid()))", connection);
            insertPractice.Parameters.AddWithValue(id); insertPractice.Parameters.AddWithValue(slug); await insertPractice.ExecuteNonQueryAsync();
        }
        var pageRow = new NpgsqlCommand("INSERT INTO practice_pages(id,practice_id,slug,title,created_at,updated_at,row_version) VALUES($1,$2,'page','Page',now(),now(),uuid_send(gen_random_uuid()))", connection);
        pageRow.Parameters.AddWithValue(page); pageRow.Parameters.AddWithValue(practiceOne); await pageRow.ExecuteNonQueryAsync();
        var templateRow = new NpgsqlCommand("INSERT INTO email_templates(id,practice_id,key,name,created_at,updated_at,row_version) VALUES($1,$2,'key','Template',now(),now(),uuid_send(gen_random_uuid()))", connection);
        templateRow.Parameters.AddWithValue(template); templateRow.Parameters.AddWithValue(practiceOne); await templateRow.ExecuteNonQueryAsync();

        foreach (var sql in new[] {
            "INSERT INTO practice_page_sections(id,practice_id,practice_page_id,position,heading,document_json,created_at,updated_at,row_version) VALUES(gen_random_uuid(),$1,$2,0,'','[]',now(),now(),uuid_send(gen_random_uuid()))",
            "INSERT INTO practice_page_versions(id,practice_id,practice_page_id,changed_by_user_id,version_number,snapshot_json,created_at) VALUES(gen_random_uuid(),$1,$2,$3,1,'{}',now())",
            "INSERT INTO email_template_versions(id,practice_id,email_template_id,changed_by_user_id,version_number,status,definition_json,created_at) VALUES(gen_random_uuid(),$1,$4,$3,1,'Draft','{}',now())" })
        {
            var invalid = new NpgsqlCommand(sql, connection); invalid.Parameters.AddWithValue(practiceTwo); invalid.Parameters.AddWithValue(page); invalid.Parameters.AddWithValue(UserA); invalid.Parameters.AddWithValue(template);
            var action = async () => await invalid.ExecuteNonQueryAsync();
            await action.Should().ThrowAsync<PostgresException>().Where(error => error.SqlState == PostgresErrorCodes.ForeignKeyViolation);
        }

        var jsonbColumns = (long)(await new NpgsqlCommand("SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND data_type='jsonb' AND (table_name,column_name) IN (('practice_page_sections','document_json'),('practice_page_versions','snapshot_json'),('email_template_versions','definition_json'),('contacts','metadata_json'),('article_sections','document_json'))", connection).ExecuteScalarAsync())!;
        jsonbColumns.Should().Be(5);
    }

    [Fact]
    public async Task RuntimeGrantsAreExplicitAndRuntimeNeverOwnsOrBypassesRls()
    {
        await using var connection = new NpgsqlConnection(fixture.MigratorConnectionString); await connection.OpenAsync();
        async Task<bool> Privilege(string table, string privilege) => (bool)(await new NpgsqlCommand($"SELECT has_table_privilege('vs_api','public.{table}','{privilege}')", connection).ExecuteScalarAsync())!;
        (await Privilege("articles", "SELECT")).Should().BeTrue();
        (await Privilege("article_sections", "SELECT")).Should().BeTrue();
        (await Privilege("articles", "INSERT")).Should().BeTrue();
        (await Privilege("practices", "INSERT")).Should().BeFalse();
        (await Privilege("practice_members", "INSERT")).Should().BeFalse();
        (await Privilege("migration_aliases", "SELECT")).Should().BeFalse();
        (await Privilege("email_template_keys", "SELECT")).Should().BeTrue();
        var attributes = new NpgsqlCommand("SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname='vs_api'", connection);
        await using var reader = await attributes.ExecuteReaderAsync(); await reader.ReadAsync(); reader.GetBoolean(0).Should().BeFalse(); reader.GetBoolean(1).Should().BeFalse();
    }

    [Fact]
    public async Task RuntimePoolExhaustionIsBoundedAndRecoversAfterAConnectionReturns()
    {
        var builder = new NpgsqlConnectionStringBuilder(fixture.RuntimeConnectionString) { MaxPoolSize = 2, Timeout = 1, ApplicationName = $"pool-test-{Guid.NewGuid():N}" };
        await using var first = new NpgsqlConnection(builder.ConnectionString);
        await using var second = new NpgsqlConnection(builder.ConnectionString);
        await first.OpenAsync(); await second.OpenAsync();
        await using var exhausted = new NpgsqlConnection(builder.ConnectionString);
        var action = async () => await exhausted.OpenAsync();
        await action.Should().ThrowAsync<NpgsqlException>();
        await first.CloseAsync();
        await exhausted.OpenAsync();
        exhausted.State.Should().Be(System.Data.ConnectionState.Open);
        NpgsqlConnection.ClearPool(exhausted);
    }

    [Fact]
    public async Task InviteeResponseIsScopedDeterministicAndRejectsInvalidStates()
    {
        await SeedAsync();
        var accepted = await InsertInvitationAsync("Pending", DateTimeOffset.UtcNow.AddDays(1));
        await using var connection = new NpgsqlConnection(fixture.RuntimeConnectionString); await connection.OpenAsync();

        await using (var transaction = await connection.BeginTransactionAsync())
        {
            await SetIdentityAsync(connection, transaction, "subject-b", "b@example.test");
            var directMutation = new NpgsqlCommand("UPDATE practice_invitations SET status='Accepted' WHERE id=$1", connection, transaction); directMutation.Parameters.AddWithValue(accepted);
            (await directMutation.ExecuteNonQueryAsync()).Should().Be(0);
            await transaction.RollbackAsync();
        }

        await RespondAsync(connection, accepted, "Accepted");
        await RespondAsync(connection, accepted, "Accepted");
        var declined = await InsertInvitationAsync("Pending", DateTimeOffset.UtcNow.AddDays(1));
        await RespondAsync(connection, declined, "Declined");
        var revoked = await InsertInvitationAsync("Revoked", DateTimeOffset.UtcNow.AddDays(1));
        var expired = await InsertInvitationAsync("Pending", DateTimeOffset.UtcNow.AddMinutes(-1));
        foreach (var invitation in new[] { revoked, expired })
        {
            var action = async () => await RespondAsync(connection, invitation, "Accepted");
            await action.Should().ThrowAsync<PostgresException>().Where(error => error.SqlState == PostgresErrorCodes.CheckViolation);
        }

        await using var readTransaction = await connection.BeginTransactionAsync(); await SetIdentityAsync(connection, readTransaction, "subject-b", "b@example.test");
        var role = (string?)await new NpgsqlCommand("SELECT role FROM practice_members WHERE practice_id=$1 AND user_id=$2", connection, readTransaction) { Parameters = { new() { Value = PracticeA }, new() { Value = UserB } } }.ExecuteScalarAsync();
        role.Should().Be("Member");
    }

    [Fact]
    public async Task MigrationToolRerunIsStateIdempotentAndValidatorDetectsCorruption()
    {
        var repositoryRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", ".."));
        var toolDirectory = Path.Combine(repositoryRoot, "tools", "migration-firestore-postgres");
        var tempDirectory = Path.Combine(Path.GetTempPath(), $"vs-migration-{Guid.NewGuid():N}"); Directory.CreateDirectory(tempDirectory);
        var sourcePath = Path.Combine(tempDirectory, "source.json"); var manifestPath = Path.Combine(tempDirectory, "manifest.json"); var reportPath = Path.Combine(tempDirectory, "target.json");
        var slug = $"migration-{Guid.NewGuid():N}";
        await File.WriteAllTextAsync(sourcePath, """
          {"users":[{"id":"migration-user","data":{"email":"migration@example.test","displayName":"Migration User","emailVerified":true}}],
           "practices":[{"id":"practice-one","data":{"name":"Migration test","slug":"__SLUG__"},"subcollections":{
             "members":[{"id":"membership","data":{"userId":"migration-user","role":"owner"}}],
             "contacts":[{"id":"contact-one","data":{"displayName":"Contact","email":"contact@example.test","metadata":{"kind":"synthetic"}}}],
             "files":[{"id":"file-one","data":{"fileName":"file.txt","contentType":"text/plain","sizeBytes":1,"storageObjectName":"legacy/file.txt"}}],
             "templates":[{"id":"welcome","data":{"name":"Welcome","key":"welcome","definition":{"version":1,"subject":[{"type":"text","value":"Hello"}],"body":[{"type":"placeholder","key":"patient.firstName"}]}}}],
             "articles":[{"id":"private-page","data":{"name":"Private page","notes":{"first":{"name":"First","text":"private text"}}}}]}}],
           "userState":[{"id":"migration-user","data":{"activePracticeId":"practice-one"}}],
           "articles":[{"id":"public-article","data":{"name":"Public article","tagIds":["clinical"],"notes":{"first":{"name":"First","text":"public text"}}}}],
           "tags":[{"id":"clinical","data":{"name":"Clinical"}}],"menu":[{"id":"articles","data":{"public-article":"Public article"}}]}
          """.Replace("__SLUG__", slug, StringComparison.Ordinal));

        var databaseUrl = ToPostgresUrl(fixture.MigratorConnectionString);
        (await RunToolAsync(toolDirectory, "transform", "--input", sourcePath, "--output", manifestPath)).Should().Be(0);
        using var manifest = JsonDocument.Parse(await File.ReadAllTextAsync(manifestPath));
        var targetId = manifest.RootElement.GetProperty("records").EnumerateArray().Single(record => record.GetProperty("targetType").GetString() == "practice").GetProperty("targetId").GetGuid();
        (await RunToolExitCodeAsync(toolDirectory, "import", "--input", manifestPath, "--database-url", databaseUrl, "--inject-failure", "after-domain-writes")).Should().NotBe(0);
        (await RunToolAsync(toolDirectory, "import", "--input", manifestPath, "--database-url", databaseUrl)).Should().Be(0);
        byte[] firstVersion; DateTimeOffset firstUpdated;
        await using (var connection = new NpgsqlConnection(fixture.MigratorConnectionString))
        {
            await connection.OpenAsync(); var query = new NpgsqlCommand("SELECT row_version,updated_at FROM practices WHERE id=$1", connection); query.Parameters.AddWithValue(targetId);
            await using var reader = await query.ExecuteReaderAsync(); await reader.ReadAsync(); firstVersion = reader.GetFieldValue<byte[]>(0); firstUpdated = reader.GetFieldValue<DateTimeOffset>(1);
        }
        (await RunToolAsync(toolDirectory, "import", "--input", manifestPath, "--database-url", databaseUrl)).Should().Be(0);
        await using (var connection = new NpgsqlConnection(fixture.MigratorConnectionString))
        {
            await connection.OpenAsync(); var query = new NpgsqlCommand("SELECT row_version,updated_at FROM practices WHERE id=$1", connection); query.Parameters.AddWithValue(targetId);
            await using var reader = await query.ExecuteReaderAsync(); await reader.ReadAsync(); reader.GetFieldValue<byte[]>(0).Should().Equal(firstVersion); reader.GetFieldValue<DateTimeOffset>(1).Should().Be(firstUpdated); await reader.DisposeAsync();
        }
        (await RunToolAsync(toolDirectory, "validate-target", "--input", manifestPath, "--database-url", databaseUrl, "--output", reportPath)).Should().Be(0);
        (await RunToolAsync(toolDirectory, "rebuild-search", "--database-url", databaseUrl)).Should().Be(0);
        await using (var connection = new NpgsqlConnection(fixture.MigratorConnectionString)) { await connection.OpenAsync(); var delete = new NpgsqlCommand("DELETE FROM practices WHERE id=$1", connection); delete.Parameters.AddWithValue(targetId); await delete.ExecuteNonQueryAsync(); }
        (await RunToolAsync(toolDirectory, "validate-target", "--input", manifestPath, "--database-url", databaseUrl, "--output", reportPath)).Should().Be(2);
        using var report = JsonDocument.Parse(await File.ReadAllTextAsync(reportPath)); report.RootElement.GetProperty("reconciled").GetBoolean().Should().BeFalse();
        Directory.Delete(tempDirectory, true);
    }

    [Fact]
    public async Task PracticeCreationIdempotencyReplaysAndConflictsByFingerprint()
    {
        await SeedUsersAsync(); var key = Guid.NewGuid().ToString("N"); var slug = $"idem-{Guid.NewGuid():N}";
        var calls = await Task.WhenAll(CreatePracticeAsUserBAsync(key, "Idempotent practice", slug), CreatePracticeAsUserBAsync(key, "Idempotent practice", slug));
        calls[0].Id.Should().Be(calls[1].Id); calls[0].Version.Should().Be(calls[1].Version);
        var changed = async () => await CreatePracticeAsUserBAsync(key, "Changed request", slug);
        await changed.Should().ThrowAsync<ApiOperationException>().Where(error => error.Code == ErrorCodes.IdempotencyConflict);
        await using var connection = new NpgsqlConnection(fixture.MigratorConnectionString); await connection.OpenAsync();
        var command = new NpgsqlCommand("SELECT count(*) FROM practices WHERE slug=$1", connection); command.Parameters.AddWithValue(slug);
        ((long)(await command.ExecuteScalarAsync())!).Should().Be(1);
    }

    [Fact]
    public async Task WikiCreateSeedHistorySectionsConcurrencyAndDeleteAreComplete()
    {
        await SeedAsync(); var slug = $"wiki-{Guid.NewGuid():N}";
        var initial = new PageRequest("Initial", Sections: [new("First", "[{\"type\":\"paragraph\"}]")]);
        var created = await ExecuteContentAsync(service => service.CreatePageAsync(PracticeA, slug, initial, false, CancellationToken.None));
        created.Sections.Should().HaveCount(1);
        var seeded = await ExecuteContentAsync(service => service.CreatePageAsync(PracticeA, slug, initial, true, CancellationToken.None)); seeded.Id.Should().Be(created.Id);
        var versions = await ExecuteContentAsync(service => service.ListPageVersionsAsync(PracticeA, slug, CancellationToken.None)); versions.Select(version => version.VersionNumber).Should().Equal(1);

        var update = new PageRequest("Updated", Sections: [new("One", "[]"), new("Two", "[{\"text\":\"second\"}]")]);
        var updated = await ExecuteContentAsync(service => service.UpdatePageAsync(PracticeA, slug, update, Convert.FromBase64String(created.Version), CancellationToken.None));
        updated.Sections.Select(section => section.Position).Should().Equal(0, 1);
        versions = await ExecuteContentAsync(service => service.ListPageVersionsAsync(PracticeA, slug, CancellationToken.None)); versions.Select(version => version.VersionNumber).Should().Equal(2, 1);
        var stale = async () => await ExecuteContentAsync(service => service.UpdatePageAsync(PracticeA, slug, update, Convert.FromBase64String(created.Version), CancellationToken.None));
        await stale.Should().ThrowAsync<ApiOperationException>().Where(error => error.Code == ErrorCodes.Conflict);
        await ExecuteContentAsync(async service => { await service.DeletePageAsync(PracticeA, slug, Convert.FromBase64String(updated.Version), CancellationToken.None); return true; });
        var missing = async () => await ExecuteContentAsync(service => service.GetPageAsync(PracticeA, slug, CancellationToken.None));
        await missing.Should().ThrowAsync<ApiOperationException>().Where(error => error.Code == ErrorCodes.NotFound);
    }

    [Fact]
    public async Task TemplateSchemaAllowlistAndExplicitPublicationRejectResolvedSentinels()
    {
        await SeedAsync(); var key = $"template-{Guid.NewGuid():N}";
        const string definition = "{\"version\":1,\"subject\":[{\"type\":\"text\",\"value\":\"Hello \"},{\"type\":\"placeholder\",\"key\":\"patient.firstName\"}],\"body\":[{\"type\":\"placeholder\",\"key\":\"appointment.date\"}]}";
        var draft = await ExecuteContentAsync(service => service.UpsertTemplateAsync(PracticeA, key, new TemplateRequest("Safe template", definition, TemplateVersionStatus.Draft), null, CancellationToken.None));
        (await ExecuteContentAsync(service => service.ListPublishedTemplatesAsync(PracticeA, CancellationToken.None))).Should().NotContain(template => template.Key == key);
        var published = await ExecuteContentAsync(service => service.UpsertTemplateAsync(PracticeA, key, new TemplateRequest("Safe template", definition, TemplateVersionStatus.Published), Convert.FromBase64String(draft.Version), CancellationToken.None));
        published.Status.Should().Be(TemplateVersionStatus.Published);
        (await ExecuteContentAsync(service => service.GetPublishedTemplateAsync(PracticeA, key, CancellationToken.None))).Id.Should().Be(published.Id);

        const string sentinel = "{\"version\":1,\"subject\":[{\"type\":\"text\",\"value\":\"SYNTHETIC_EXTERNAL_VALUE_001\"}],\"body\":[{\"type\":\"text\",\"value\":\"body\"}]}";
        var rejected = async () => await ExecuteContentAsync(service => service.UpsertTemplateAsync(PracticeA, $"bad-{Guid.NewGuid():N}", new TemplateRequest("Bad", sentinel), null, CancellationToken.None));
        await rejected.Should().ThrowAsync<ApiOperationException>().Where(error => error.Code == ErrorCodes.Validation);
        await using var connection = new NpgsqlConnection(fixture.MigratorConnectionString); await connection.OpenAsync();
        ((long)(await new NpgsqlCommand("SELECT count(*) FROM email_template_versions WHERE definition_json::text LIKE '%SYNTHETIC_EXTERNAL_VALUE_%'", connection).ExecuteScalarAsync())!).Should().Be(0);
    }

    [Fact]
    public async Task ContactCursorUsesStableDisplayNameAndIdKeyset()
    {
        await SeedAsync();
        foreach (var name in new[] { "Duplicate", "Duplicate", "Duplicate", "Later" }) await ExecuteContentAsync(service => service.CreateContactAsync(PracticeA, new ContactRequest(name, null, null, "{}"), CancellationToken.None));
        var first = await ExecuteContentAsync(service => service.ListContactsAsync(PracticeA, null, 2, CancellationToken.None)); first.Items.Should().HaveCount(2); first.NextCursor.Should().NotBeNull();
        var second = await ExecuteContentAsync(service => service.ListContactsAsync(PracticeA, first.NextCursor, 2, CancellationToken.None));
        first.Items.Concat(second.Items).Select(contact => contact.Id).Should().OnlyHaveUniqueItems().And.HaveCount(4);
        var malformed = async () => await ExecuteContentAsync(service => service.ListContactsAsync(PracticeA, "not-a-cursor", 2, CancellationToken.None));
        await malformed.Should().ThrowAsync<ApiOperationException>().Where(error => error.Code == ErrorCodes.Validation);
    }

    [Fact]
    public async Task FullTextSearchIsRankedPaginatedFacetedAndTenantScoped()
    {
        await SeedAsync();
        await ExecuteContentAsync(service => service.CreatePageAsync(PracticeA, $"search-{Guid.NewGuid():N}", new PageRequest("Private bevalling", "[{\"text\":\"bevalling begeleiding\"}]"), false, CancellationToken.None));
        var otherPractice = Guid.NewGuid();
        await using (var connection = new NpgsqlConnection(fixture.MigratorConnectionString))
        {
            await connection.OpenAsync();
            var practice = new NpgsqlCommand("INSERT INTO practices(id,name,slug,created_at,updated_at,row_version) VALUES($1,'Other search',$2,now(),now(),uuid_send(gen_random_uuid()))", connection); practice.Parameters.AddWithValue(otherPractice); practice.Parameters.AddWithValue($"other-{otherPractice:N}"); await practice.ExecuteNonQueryAsync();
            var otherPage = new NpgsqlCommand("INSERT INTO practice_pages(id,practice_id,slug,title,extracted_text,created_at,updated_at,row_version) VALUES(gen_random_uuid(),$1,'private','Forbidden bevalling','bevalling secret',now(),now(),uuid_send(gen_random_uuid()))", connection); otherPage.Parameters.AddWithValue(otherPractice); await otherPage.ExecuteNonQueryAsync();
            await new NpgsqlCommand("INSERT INTO articles(id,slug,title,is_published,position,extracted_text,created_at,updated_at,row_version) VALUES(gen_random_uuid(),'public-search','Veilige bevalling',true,0,'bevalling informatie',now(),now(),uuid_send(gen_random_uuid()))", connection).ExecuteNonQueryAsync();
        }
        var first = await ExecuteContentAsync(service => service.SearchAsync(PracticeA, "bevalling", null, 1, null, CancellationToken.None)); first.Items.Should().HaveCount(1); first.NextCursor.Should().NotBeNull(); first.Facets.Should().ContainKey("article").WhoseValue.Should().Be(1); first.Facets.Should().ContainKey("practice-page").WhoseValue.Should().Be(1);
        var second = await ExecuteContentAsync(service => service.SearchAsync(PracticeA, "bevalling", first.NextCursor, 1, null, CancellationToken.None)); first.Items.Concat(second.Items).Should().HaveCount(2).And.OnlyContain(result => result.PracticeId == null || result.PracticeId == PracticeA.ToString());
        var publicOnly = await ExecuteContentAsync(service => service.SearchAsync(null, "bevalling", null, 25, null, CancellationToken.None)); publicOnly.Items.Should().OnlyContain(result => result.Kind == "article");
        await using var verify = new NpgsqlConnection(fixture.MigratorConnectionString); await verify.OpenAsync();
        ((long)(await new NpgsqlCommand("SELECT count(*) FROM pg_indexes WHERE indexname IN ('IX_articles_search_vector','IX_practice_pages_search_vector') AND indexdef ILIKE '%gin%'", verify).ExecuteScalarAsync())!).Should().Be(2);
    }

    [Fact]
    public async Task FileOperationsUseServerOwnedPathsExpiryExistenceAndCurrentMembership()
    {
        await SeedAsync(); var bytes = Encoding.UTF8.GetBytes("synthetic file body");
        var upload = await ExecuteContentAsync(service => service.AuthorizeFileUploadAsync(PracticeA, new FileUploadRequest("document.txt", "text/plain", bytes.Length), CancellationToken.None));
        upload.File.StorageObjectName.Should().StartWith($"practices/{PracticeA:N}/{upload.File.Id:N}/");
        var uploadToken = Uri.UnescapeDataString(upload.Url.Split('/')[^1]);
        await ExecuteContentAsync(async service => { await service.UploadFileAsync(uploadToken, new MemoryStream(bytes), "text/plain", bytes.Length, CancellationToken.None); return true; });
        var downloadAuthorization = await ExecuteContentAsync(service => service.AuthorizeFileDownloadAsync(PracticeA, upload.File.Id, CancellationToken.None));
        var downloadToken = Uri.UnescapeDataString(downloadAuthorization.Url.Split('/')[^1]);
        var download = await ExecuteContentAsync(service => service.DownloadFileAsync(downloadToken, CancellationToken.None)); using var reader = new StreamReader(download.Content); (await reader.ReadToEndAsync()).Should().Be("synthetic file body");

        storageLifetimeSeconds = -1;
        var expiredAuthorization = await ExecuteContentAsync(service => service.AuthorizeFileDownloadAsync(PracticeA, upload.File.Id, CancellationToken.None)); storageLifetimeSeconds = 300;
        var expired = async () => await ExecuteContentAsync(service => service.DownloadFileAsync(Uri.UnescapeDataString(expiredAuthorization.Url.Split('/')[^1]), CancellationToken.None));
        await expired.Should().ThrowAsync<ApiOperationException>().Where(error => error.Code == ErrorCodes.Forbidden);

        await using (var connection = new NpgsqlConnection(fixture.MigratorConnectionString)) { await connection.OpenAsync(); var remove = new NpgsqlCommand("DELETE FROM practice_members WHERE practice_id=$1 AND user_id=$2", connection); remove.Parameters.AddWithValue(PracticeA); remove.Parameters.AddWithValue(UserA); await remove.ExecuteNonQueryAsync(); }
        try { var removed = async () => await ExecuteContentAsync(service => service.DownloadFileAsync(downloadToken, CancellationToken.None)); await removed.Should().ThrowAsync<ApiOperationException>().Where(error => error.Code == ErrorCodes.Forbidden); }
        finally { await using var connection = new NpgsqlConnection(fixture.MigratorConnectionString); await connection.OpenAsync(); var restore = new NpgsqlCommand("INSERT INTO practice_members(practice_id,user_id,role,created_at,updated_at,row_version) VALUES($1,$2,'Owner',now(),now(),uuid_send(gen_random_uuid())) ON CONFLICT DO NOTHING", connection); restore.Parameters.AddWithValue(PracticeA); restore.Parameters.AddWithValue(UserA); await restore.ExecuteNonQueryAsync(); }
    }

    [Fact]
    public async Task GlobalArticleAuthoringUsesGlobalAdminRlsTagsSectionsAndNavigationOrder()
    {
        await SeedUsersAsync(); await SetGlobalAdministratorAsync(true);
        try
        {
            var tag = await ExecuteContentAsync(service => service.CreateTagAsync(new TagRequest("Clinical"), CancellationToken.None));
            var article = await ExecuteContentAsync(service => service.CreateArticleAsync(new ArticleRequest($"article-{Guid.NewGuid():N}", "Global article", 2, null, true, [new("First", "[]"), new("Second", "[{\"text\":\"content\"}]")], [tag.Id]), CancellationToken.None));
            article.Sections.Should().HaveCount(2); article.TagIds.Should().ContainSingle().Which.Should().Be(tag.Id);
            var earlier = await ExecuteContentAsync(service => service.CreateArticleAsync(new ArticleRequest($"article-{Guid.NewGuid():N}", "Earlier", 1, null, true, [new("Only", "[]")]), CancellationToken.None));
            (await ExecuteContentAsync(service => service.ListArticlesAsync(CancellationToken.None))).Take(2).Select(item => item.Id).Should().Equal(earlier.Id, article.Id);
            var updated = await ExecuteContentAsync(service => service.UpdateArticleAsync(article.Id, new ArticleRequest(article.Slug, "Updated", 0, null, true, [new("One", "[]")], [tag.Id]), Convert.FromBase64String(article.Version), CancellationToken.None)); updated.Title.Should().Be("Updated");

            await using var runtime = new NpgsqlConnection(fixture.RuntimeConnectionString); await runtime.OpenAsync(); await using var transaction = await runtime.BeginTransactionAsync(); await SetIdentityAsync(runtime, transaction, "subject-b", "b@example.test");
            var unauthorized = new NpgsqlCommand("INSERT INTO articles(id,slug,title,is_published,position,created_at,updated_at,row_version) VALUES(gen_random_uuid(),$1,'Denied',true,0,now(),now(),uuid_send(gen_random_uuid()))", runtime, transaction); unauthorized.Parameters.AddWithValue($"denied-{Guid.NewGuid():N}");
            var action = async () => await unauthorized.ExecuteNonQueryAsync(); await action.Should().ThrowAsync<PostgresException>().Where(error => error.SqlState == PostgresErrorCodes.InsufficientPrivilege);
        }
        finally { await SetGlobalAdministratorAsync(false); }
    }

    private async Task SeedAsync()
    {
        await SeedUsersAsync();
        await using var connection = new NpgsqlConnection(fixture.MigratorConnectionString); await connection.OpenAsync();
        var reset = new NpgsqlCommand("DELETE FROM practices WHERE id=$1", connection);
        reset.Parameters.AddWithValue(PracticeA); await reset.ExecuteNonQueryAsync();
        var practice = new NpgsqlCommand("INSERT INTO practices(id,name,slug,created_at,updated_at,row_version) VALUES($1,'Practice A','practice-a',now(),now(),uuid_send(gen_random_uuid()))", connection);
        practice.Parameters.AddWithValue(PracticeA); await practice.ExecuteNonQueryAsync();
        var membership = new NpgsqlCommand("INSERT INTO practice_members(practice_id,user_id,role,created_at,updated_at,row_version) VALUES($1,$2,'Owner',now(),now(),uuid_send(gen_random_uuid())) ON CONFLICT DO NOTHING", connection);
        membership.Parameters.AddWithValue(PracticeA); membership.Parameters.AddWithValue(UserA); await membership.ExecuteNonQueryAsync();
    }

    private async Task SeedUsersAsync()
    {
        await using var connection = new NpgsqlConnection(fixture.MigratorConnectionString); await connection.OpenAsync();
        var command = new NpgsqlCommand("""
            INSERT INTO users(id,external_subject,email,normalized_email,email_verified,is_global_administrator,created_at,updated_at,row_version) VALUES
              ($1,'subject-a','a@example.test','A@EXAMPLE.TEST',true,false,now(),now(),uuid_send(gen_random_uuid())),
              ($2,'subject-b','b@example.test','B@EXAMPLE.TEST',true,false,now(),now(),uuid_send(gen_random_uuid())) ON CONFLICT(id) DO NOTHING;
            """, connection);
        command.Parameters.AddWithValue(UserA); command.Parameters.AddWithValue(UserB); await command.ExecuteNonQueryAsync();
    }
    private async Task SetGlobalAdministratorAsync(bool value) { await using var connection = new NpgsqlConnection(fixture.MigratorConnectionString); await connection.OpenAsync(); var command = new NpgsqlCommand("UPDATE users SET is_global_administrator=$1 WHERE id=$2", connection); command.Parameters.AddWithValue(value); command.Parameters.AddWithValue(UserA); await command.ExecuteNonQueryAsync(); }

    private async Task<Guid> InsertInvitationAsync(string status, DateTimeOffset expiresAt)
    {
        var id = Guid.NewGuid();
        await using var connection = new NpgsqlConnection(fixture.MigratorConnectionString); await connection.OpenAsync();
        var command = new NpgsqlCommand("INSERT INTO practice_invitations(id,practice_id,invited_by_user_id,invited_email,invited_email_normalized,role,status,token_hash,expires_at,created_at,updated_at,row_version) VALUES($1,$2,$3,'b@example.test','B@EXAMPLE.TEST','Member',$4,'hash',$5,now()-interval '1 hour',now(),uuid_send(gen_random_uuid()))", connection);
        command.Parameters.AddWithValue(id); command.Parameters.AddWithValue(PracticeA); command.Parameters.AddWithValue(UserA); command.Parameters.AddWithValue(status); command.Parameters.AddWithValue(expiresAt); await command.ExecuteNonQueryAsync(); return id;
    }

    private async Task<PracticeDto> CreatePracticeAsUserBAsync(string key, string name, string slug)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(fixture.RuntimeConnectionString).Options;
        await using var db = new AppDbContext(options); await using var transaction = await db.Database.BeginTransactionAsync();
        const string subject = "subject-b"; const string email = "b@example.test";
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT set_config('app.external_subject', {subject}, true), set_config('app.user_email', {email}, true)");
        var service = new PracticeService(db, new TestCurrentUser("subject-b", "b@example.test"));
        var result = await service.CreateAsync(new CreatePracticeRequest(name, slug), key, CancellationToken.None); await transaction.CommitAsync(); return result;
    }

    private async Task<T> ExecuteContentAsync<T>(Func<ContentService, Task<T>> action)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(fixture.RuntimeConnectionString).Options;
        await using var db = new AppDbContext(options); await using var transaction = await db.Database.BeginTransactionAsync();
        const string subject = "subject-a"; const string email = "a@example.test";
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT set_config('app.external_subject', {subject}, true), set_config('app.user_email', {email}, true)");
        var storageConfiguration = Options.Create(new StorageOptions { RootPath = Path.GetTempPath(), SigningKey = "integration-test-signing-key-32-characters", SignedUrlLifetimeSeconds = storageLifetimeSeconds });
        var result = await action(new ContentService(db, new TestCurrentUser("subject-a", "a@example.test"), objectStorage, storageConfiguration)); await transaction.CommitAsync(); return result;
    }

    private static async Task RespondAsync(NpgsqlConnection connection, Guid invitationId, string status)
    {
        await using var transaction = await connection.BeginTransactionAsync(); await SetIdentityAsync(connection, transaction, "subject-b", "b@example.test");
        var command = new NpgsqlCommand("SELECT app_respond_to_invitation($1,$2,$3)", connection, transaction); command.Parameters.AddWithValue(invitationId); command.Parameters.AddWithValue(UserB); command.Parameters.AddWithValue(status);
        await command.ExecuteNonQueryAsync(); await transaction.CommitAsync();
    }

    private static async Task SetIdentityAsync(NpgsqlConnection connection, NpgsqlTransaction transaction, string subject, string email)
    {
        var command = new NpgsqlCommand("SELECT set_config('app.external_subject',$1,true), set_config('app.user_email',$2,true)", connection, transaction);
        command.Parameters.AddWithValue(subject); command.Parameters.AddWithValue(email); await command.ExecuteNonQueryAsync();
    }

    private static async Task<int> RunToolAsync(string workingDirectory, params string[] arguments)
    {
        var exitCode = await RunToolExitCodeAsync(workingDirectory, arguments);
        if (exitCode is not (0 or 2)) throw new InvalidOperationException($"Migration tool failed with exit code {exitCode}.");
        return exitCode;
    }

    private static async Task<int> RunToolExitCodeAsync(string workingDirectory, params string[] arguments)
    {
        var start = new ProcessStartInfo("node") { WorkingDirectory = workingDirectory, RedirectStandardOutput = true, RedirectStandardError = true, UseShellExecute = false };
        start.ArgumentList.Add("--import"); start.ArgumentList.Add("tsx"); start.ArgumentList.Add("src/cli.ts");
        foreach (var argument in arguments) start.ArgumentList.Add(argument);
        using var process = Process.Start(start) ?? throw new InvalidOperationException("Could not start Node.js migration tool.");
        var standardOutput = process.StandardOutput.ReadToEndAsync(); var standardError = process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();
        await standardOutput; await standardError;
        return process.ExitCode;
    }

    private static string ToPostgresUrl(string connectionString)
    {
        var builder = new NpgsqlConnectionStringBuilder(connectionString);
        return $"postgresql://{Uri.EscapeDataString(builder.Username ?? throw new InvalidOperationException())}:{Uri.EscapeDataString(builder.Password ?? throw new InvalidOperationException())}@{builder.Host}:{builder.Port}/{Uri.EscapeDataString(builder.Database ?? throw new InvalidOperationException())}";
    }
}

file sealed class TestCurrentUser(string subject, string email) : ICurrentUser
{
    public Guid? UserId => null;
    public string ExternalSubject => subject;
    public string? Email => email;
    public string? NormalizedEmail => email.ToUpperInvariant();
    public bool EmailVerified => true;
    public bool IsAuthenticated => true;
}

file sealed class TestObjectStorage : IObjectStorage
{
    private readonly Dictionary<string, byte[]> objects = new(StringComparer.Ordinal);
    public async Task WriteAsync(string objectName, Stream content, long expectedBytes, CancellationToken cancellationToken) { using var memory = new MemoryStream(); await content.CopyToAsync(memory, cancellationToken); if (memory.Length != expectedBytes) throw new InvalidDataException(); objects[objectName] = memory.ToArray(); }
    public Task<Stream> OpenReadAsync(string objectName, CancellationToken cancellationToken) => Task.FromResult<Stream>(new MemoryStream(objects[objectName], false));
    public Task<bool> ExistsAsync(string objectName, CancellationToken cancellationToken) => Task.FromResult(objects.ContainsKey(objectName));
    public Task DeleteAsync(string objectName, CancellationToken cancellationToken) { objects.Remove(objectName); return Task.CompletedTask; }
}
