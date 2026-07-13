using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;
using Xunit;

namespace VerloskundigeSpiekt.IntegrationTests;

[Collection(nameof(PostgreSqlSecurityTestGroup))]
public sealed class ApiAuthorizationTests(PostgreSqlSecurityFixture fixture)
{
    private static readonly Guid MatrixMemberId = Guid.Parse("81000000-0000-0000-0000-000000000001");
    private static readonly Guid MatrixOwnerId = Guid.Parse("81000000-0000-0000-0000-000000000002");
    [Theory]
    [InlineData(null)]
    [InlineData("invalid")]
    [InlineData("expired")]
    [InlineData("wrong-audience")]
    public async Task AnonymousAndInvalidTokensAreRejected(string? token)
    {
        await using var factory = CreateFactory(); using var client = factory.CreateClient(); if (token is not null) client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test", token);
        (await client.GetAsync("/api/v1/me")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RoutePoliciesPreconditionsEnumsAndRemovedMembershipFailClosed()
    {
        var practiceId = Guid.NewGuid(); var memberId = MatrixMemberId; var ownerId = MatrixOwnerId;
        await SeedAsync(practiceId, memberId, ownerId);
        await using var factory = CreateFactory();
        using var member = Client(factory, "member"); using var owner = Client(factory, "owner");
        (await member.GetAsync($"/api/v1/practices/{practiceId}")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await member.PutAsJsonAsync($"/api/v1/practices/{practiceId}", new { name = "Denied", slug = "denied" })).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var missing = await owner.PutAsJsonAsync($"/api/v1/practices/{practiceId}", new { name = "Updated", slug = $"updated-{practiceId:N}" }); missing.StatusCode.Should().Be((HttpStatusCode)428);
        var malformedRequest = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/practices/{practiceId}") { Content = JsonContent.Create(new { name = "Updated", slug = $"updated-{practiceId:N}" }) }; malformedRequest.Headers.TryAddWithoutValidation("If-Match", "not-an-etag");
        (await owner.SendAsync(malformedRequest)).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var integerEnum = await owner.PostAsJsonAsync($"/api/v1/practices/{practiceId}/invitations", new { email = "new@example.test", role = 2 }); integerEnum.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await using (var connection = new NpgsqlConnection(fixture.MigratorConnectionString)) { await connection.OpenAsync(); var remove = new NpgsqlCommand("DELETE FROM practice_members WHERE practice_id=$1 AND user_id=$2", connection); remove.Parameters.AddWithValue(practiceId); remove.Parameters.AddWithValue(memberId); await remove.ExecuteNonQueryAsync(); }
        (await member.GetAsync($"/api/v1/practices/{practiceId}")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await member.GetAsync($"/api/v1/practices/{Guid.NewGuid()}")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UnverifiedEmailAndGlobalAdministratorRemainDistinctFromPracticeRoles()
    {
        var practiceId = Guid.NewGuid(); var memberId = MatrixMemberId; var ownerId = MatrixOwnerId; await SeedAsync(practiceId, memberId, ownerId);
        await using var factory = CreateFactory(); using var unverified = Client(factory, "unverified"); using var owner = Client(factory, "owner");
        (await unverified.GetAsync("/api/v1/invitations/pending")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await owner.PostAsJsonAsync("/api/v1/tags", new { name = $"Denied-{Guid.NewGuid():N}" })).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        using var global = Client(factory, "global"); (await global.PostAsJsonAsync("/api/v1/tags", new { name = $"Allowed-{Guid.NewGuid():N}" })).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task SearchRateLimitIsPartitionedAndRecoversAfterWindow()
    {
        await using var factory = CreateFactory(new Dictionary<string, string?> { ["RateLimits:SearchPermits"] = "2", ["RateLimits:WindowSeconds"] = "1" }); using var client = factory.CreateClient();
        (await client.GetAsync("/api/v1/search?query=missing")).StatusCode.Should().Be(HttpStatusCode.OK); (await client.GetAsync("/api/v1/search?query=missing")).StatusCode.Should().Be(HttpStatusCode.OK); (await client.GetAsync("/api/v1/search?query=missing")).StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        await Task.Delay(1_100); (await client.GetAsync("/api/v1/search?query=missing")).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private WebApplicationFactory<Program> CreateFactory(IReadOnlyDictionary<string, string?>? settings = null) => new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
    {
        builder.UseEnvironment("Development"); builder.UseSetting("Database:ConnectionString", fixture.RuntimeConnectionString); builder.UseSetting("Firebase:ProjectId", "test"); builder.UseSetting("Storage:RootPath", Path.GetTempPath()); builder.UseSetting("Storage:SigningKey", "integration-test-signing-key-32-characters");
        if (settings is not null) foreach (var setting in settings) builder.UseSetting(setting.Key, setting.Value);
        builder.ConfigureTestServices(services => services.AddAuthentication(options => { options.DefaultAuthenticateScheme = "Test"; options.DefaultChallengeScheme = "Test"; }).AddScheme<AuthenticationSchemeOptions, MatrixAuthenticationHandler>("Test", _ => { }));
    });

    private static HttpClient Client(WebApplicationFactory<Program> factory, string token) { var client = factory.CreateClient(); client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test", token); return client; }

    private async Task SeedAsync(Guid practiceId, Guid memberId, Guid ownerId)
    {
        await using var connection = new NpgsqlConnection(fixture.MigratorConnectionString); await connection.OpenAsync();
        foreach (var (id, subject, email, global) in new[] { (memberId, "matrix-member", "member@example.test", false), (ownerId, "matrix-owner", "owner@example.test", false), (Guid.NewGuid(), "matrix-unverified", "unverified@example.test", false), (Guid.NewGuid(), "matrix-global", "global@example.test", true) })
        { var user = new NpgsqlCommand("INSERT INTO users(id,external_subject,email,normalized_email,email_verified,is_global_administrator,created_at,updated_at,row_version) VALUES($1,$2,$3,upper($3),true,$4,now(),now(),uuid_send(gen_random_uuid())) ON CONFLICT(external_subject) DO UPDATE SET is_global_administrator=excluded.is_global_administrator", connection); user.Parameters.AddWithValue(id); user.Parameters.AddWithValue(subject); user.Parameters.AddWithValue(email); user.Parameters.AddWithValue(global); await user.ExecuteNonQueryAsync(); }
        var practice = new NpgsqlCommand("INSERT INTO practices(id,name,slug,created_at,updated_at,row_version) VALUES($1,'Matrix',$2,now(),now(),uuid_send(gen_random_uuid()))", connection); practice.Parameters.AddWithValue(practiceId); practice.Parameters.AddWithValue($"matrix-{practiceId:N}"); await practice.ExecuteNonQueryAsync();
        foreach (var (id, role) in new[] { (memberId, "Member"), (ownerId, "Owner") }) { var membership = new NpgsqlCommand("INSERT INTO practice_members(practice_id,user_id,role,created_at,updated_at,row_version) VALUES($1,$2,$3,now(),now(),uuid_send(gen_random_uuid()))", connection); membership.Parameters.AddWithValue(practiceId); membership.Parameters.AddWithValue(id); membership.Parameters.AddWithValue(role); await membership.ExecuteNonQueryAsync(); }
    }
}

file sealed class MatrixAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var token = Request.Headers.Authorization.ToString().Split(' ', 2).ElementAtOrDefault(1); if (token is null) return Task.FromResult(AuthenticateResult.NoResult());
        var identity = token switch { "member" => Identity("matrix-member", "member@example.test", true), "owner" => Identity("matrix-owner", "owner@example.test", true), "unverified" => Identity("matrix-unverified", "unverified@example.test", false), "global" => Identity("matrix-global", "global@example.test", true), _ => null };
        return Task.FromResult(identity is null ? AuthenticateResult.Fail("Invalid test token") : AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name)));
    }
    private static ClaimsIdentity Identity(string subject, string email, bool verified) => new([new Claim("sub", subject), new Claim("email", email), new Claim("email_verified", verified.ToString())], "Test");
}
