using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using VerloskundigeSpiekt.Application;

namespace VerloskundigeSpiekt.Infrastructure;

public sealed class DatabaseOptions
{
    public const string SectionName = "Database";
    public string ConnectionString { get; set; } = string.Empty;
    public int MaximumPoolSize { get; set; } = 10;
    public int CommandTimeoutSeconds { get; set; } = 30;
}

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var options = configuration.GetSection(DatabaseOptions.SectionName).Get<DatabaseOptions>() ?? new DatabaseOptions();
        services.AddOptions<DatabaseOptions>().Bind(configuration.GetSection(DatabaseOptions.SectionName)).Validate(x => !string.IsNullOrWhiteSpace(x.ConnectionString), "Database:ConnectionString is required.").ValidateOnStart();
        var dataSourceBuilder = new NpgsqlDataSourceBuilder(options.ConnectionString);
        dataSourceBuilder.EnableParameterLogging(false);
        var dataSource = dataSourceBuilder.Build();
        services.AddSingleton(dataSource);
        services.AddDbContext<AppDbContext>((serviceProvider, dbOptions) =>
        {
            // Authenticated requests run inside TenantContextMiddleware's explicit
            // transaction so SET LOCAL tenant context remains valid for every query.
            // Npgsql's retrying execution strategy rejects user-initiated transactions
            // and retrying an entire HTTP request could duplicate non-idempotent work.
            // Keep retries at an explicit, application-owned unit-of-work boundary.
            dbOptions.UseNpgsql(dataSource, npgsql => npgsql.CommandTimeout(options.CommandTimeoutSeconds));
            dbOptions.EnableDetailedErrors(false);
            dbOptions.EnableSensitiveDataLogging(false);
        });
        services.AddHealthChecks().AddDbContextCheck<AppDbContext>("postgresql");
        services.AddScoped<IPracticeService, PracticeService>();
        services.AddScoped<IContentService, ContentService>();
        return services;
    }
}
