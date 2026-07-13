using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using VerloskundigeSpiekt.Application;
using Microsoft.Extensions.Options;

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
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration, bool isDevelopment = false)
    {
        var options = configuration.GetSection(DatabaseOptions.SectionName).Get<DatabaseOptions>() ?? new DatabaseOptions();
        services.AddOptions<DatabaseOptions>().Bind(configuration.GetSection(DatabaseOptions.SectionName))
            .Validate(x => !string.IsNullOrWhiteSpace(x.ConnectionString), "Database:ConnectionString is required.")
            .Validate(x => isDevelopment || IsProductionSafe(x), "Production database connections must use a non-owner role, VerifyFull TLS, certificate validation, a short timeout, and the configured pool limit.")
            .ValidateOnStart();
        var connectionStringBuilder = new NpgsqlConnectionStringBuilder(options.ConnectionString)
        {
            MaxPoolSize = options.MaximumPoolSize
        };
        var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionStringBuilder.ConnectionString);
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
        services.AddOptions<StorageOptions>().Bind(configuration.GetSection(StorageOptions.SectionName))
            .Validate(options => !string.IsNullOrWhiteSpace(options.RootPath), "Storage:RootPath is required.")
            .Validate(options => options.SigningKey.Length >= 32, "Storage:SigningKey must contain at least 32 characters.")
            .Validate(options => options.SignedUrlLifetimeSeconds is >= 30 and <= 900, "Storage signed URL lifetime must be between 30 and 900 seconds.").ValidateOnStart();
        services.AddSingleton<IObjectStorage, LocalObjectStorage>();
        return services;
    }

    private static bool IsProductionSafe(DatabaseOptions options)
    {
        try
        {
            var connection = new NpgsqlConnectionStringBuilder(options.ConnectionString);
            return !string.IsNullOrWhiteSpace(connection.Username)
                && !connection.Username.Equals("postgres", StringComparison.OrdinalIgnoreCase)
                && !connection.Username.Equals("vs_migrator", StringComparison.OrdinalIgnoreCase)
                && connection.SslMode == SslMode.VerifyFull
                && connection.Timeout is > 0 and <= 10 && options.MaximumPoolSize is > 0 and <= 100;
        }
        catch (ArgumentException) { return false; }
    }
}
