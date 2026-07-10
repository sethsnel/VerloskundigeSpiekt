using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Xunit;

namespace VerloskundigeSpiekt.IntegrationTests;

public sealed class ApiSmokeTests(TestApiFactory factory) : IClassFixture<TestApiFactory>
{
    [Fact]
    public async Task LivenessDoesNotRequireDatabaseOrAuthentication()
    {
        using var response = await factory.CreateClient().GetAsync("/health/live");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task OpenApiDocumentIsAvailable()
    {
        using var response = await factory.CreateClient().GetAsync("/openapi/v1.json");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}

public sealed class TestApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Database:ConnectionString", "Host=localhost;Port=5432;Database=test;Username=test;Password=test");
        builder.UseSetting("Firebase:ProjectId", "ci-test-project");
    }
}
