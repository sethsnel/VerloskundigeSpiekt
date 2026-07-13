using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Mvc;
using System.Threading.RateLimiting;
using System.Net;
using VerloskundigeSpiekt.Api;
using VerloskundigeSpiekt.Application;
using VerloskundigeSpiekt.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 52_428_800);

builder.Services.AddOptions<FirebaseOptions>().Bind(builder.Configuration.GetSection(FirebaseOptions.SectionName)).ValidateDataAnnotations().ValidateOnStart();
builder.Services.AddOptions<ReverseProxyOptions>().Bind(builder.Configuration.GetSection(ReverseProxyOptions.SectionName))
    .Validate(options => builder.Environment.IsDevelopment() || options.KnownProxies.Length + options.KnownNetworks.Length > 0, "At least one trusted reverse proxy/network is required outside development.").ValidateOnStart();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, HttpCurrentUser>();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment.IsDevelopment());
builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false)));
builder.Services.Configure<ApiBehaviorOptions>(options => options.InvalidModelStateResponseFactory = context =>
{
    var details = new ValidationProblemDetails(context.ModelState) { Status = StatusCodes.Status400BadRequest, Title = "Request validation failed", Type = $"https://verloskundigespiekt.nl/problems/{ErrorCodes.Validation}", Instance = context.HttpContext.Request.Path };
    details.Extensions["code"] = ErrorCodes.Validation; details.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
    return new BadRequestObjectResult(details) { ContentTypes = { "application/problem+json" } };
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();
builder.Services.AddRequestTimeouts(options => options.DefaultPolicy = new Microsoft.AspNetCore.Http.Timeouts.RequestTimeoutPolicy { Timeout = TimeSpan.FromSeconds(30) });

var firebase = builder.Configuration.GetSection(FirebaseOptions.SectionName).Get<FirebaseOptions>() ?? new FirebaseOptions();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.Authority = $"https://securetoken.google.com/{firebase.ProjectId}";
    options.Audience = firebase.ProjectId;
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = $"https://securetoken.google.com/{firebase.ProjectId}",
        ValidateAudience = true,
        ValidAudience = firebase.ProjectId,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        NameClaimType = "sub"
    };
});
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("authenticated", policy => policy.RequireAuthenticatedUser());
    options.AddPolicy(AuthorizationPolicies.PracticeMember, policy => { policy.RequireAuthenticatedUser(); policy.AddRequirements(new PracticeRoleRequirement(VerloskundigeSpiekt.Domain.PracticeRole.Member)); });
    options.AddPolicy(AuthorizationPolicies.PracticeAdministrator, policy => { policy.RequireAuthenticatedUser(); policy.AddRequirements(new PracticeRoleRequirement(VerloskundigeSpiekt.Domain.PracticeRole.Administrator)); });
    options.AddPolicy(AuthorizationPolicies.PracticeOwner, policy => { policy.RequireAuthenticatedUser(); policy.AddRequirements(new PracticeRoleRequirement(VerloskundigeSpiekt.Domain.PracticeRole.Owner)); });
    options.AddPolicy(AuthorizationPolicies.GlobalAdministrator, policy => { policy.RequireAuthenticatedUser(); policy.AddRequirements(new GlobalAdministratorRequirement()); });
});
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, PracticeRoleAuthorizationHandler>();
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, GlobalAdministratorAuthorizationHandler>();
builder.Services.AddCors(options => options.AddPolicy("known-origins", policy => policy.WithOrigins(firebase.AllowedOrigins.Concat(firebase.AllowedExtensionOrigins).ToArray()).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
var rateLimits = builder.Configuration.GetSection(ApiRateLimitOptions.SectionName).Get<ApiRateLimitOptions>() ?? new ApiRateLimitOptions();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    static string Partition(HttpContext context) => context.User.FindFirst("sub")?.Value ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context => RateLimitPartition.GetFixedWindowLimiter(Partition(context), _ => new FixedWindowRateLimiterOptions { PermitLimit = rateLimits.DefaultPermits, Window = TimeSpan.FromSeconds(rateLimits.WindowSeconds), QueueLimit = 0 }));
    options.AddPolicy("default", context => RateLimitPartition.GetFixedWindowLimiter(Partition(context), _ => new FixedWindowRateLimiterOptions { PermitLimit = rateLimits.DefaultPermits, Window = TimeSpan.FromSeconds(rateLimits.WindowSeconds), QueueLimit = 0 }));
    options.AddPolicy("search", context => RateLimitPartition.GetFixedWindowLimiter(Partition(context), _ => new FixedWindowRateLimiterOptions { PermitLimit = rateLimits.SearchPermits, Window = TimeSpan.FromSeconds(rateLimits.WindowSeconds), QueueLimit = 0 }));
    options.AddPolicy("extension-templates", context => RateLimitPartition.GetFixedWindowLimiter(Partition(context), _ => new FixedWindowRateLimiterOptions { PermitLimit = rateLimits.ExtensionPermits, Window = TimeSpan.FromSeconds(rateLimits.WindowSeconds), QueueLimit = 0 }));
});
builder.Services.AddHealthChecks();

var app = builder.Build();
var reverseProxy = builder.Configuration.GetSection(ReverseProxyOptions.SectionName).Get<ReverseProxyOptions>() ?? new ReverseProxyOptions();
var forwardedHeaders = new ForwardedHeadersOptions { ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto };
foreach (var proxy in reverseProxy.KnownProxies) if (IPAddress.TryParse(proxy, out var address)) forwardedHeaders.KnownProxies.Add(address);
foreach (var network in reverseProxy.KnownNetworks)
{
    if (System.Net.IPNetwork.TryParse(network, out var parsedNetwork)) forwardedHeaders.KnownIPNetworks.Add(parsedNetwork);
}
app.UseMiddleware<ProblemDetailsMiddleware>();
app.Use(async (context, next) =>
{
    if (!context.Request.Path.StartsWithSegments("/api/v1/storage/upload") && context.Request.ContentLength is > 2_500_000)
        throw new ApiOperationException(ErrorCodes.RequestTooLarge, "The request body exceeds the 2.5 MB limit.", StatusCodes.Status413PayloadTooLarge);
    await next(context);
});
app.UseForwardedHeaders(forwardedHeaders);
if (!app.Environment.IsDevelopment()) app.UseHsts();
app.UseHttpsRedirection();
app.UseCorrelationId();
app.UseRequestTimeouts();
app.UseCors("known-origins");
app.UseAuthentication();
app.UseRateLimiter();
app.UseMiddleware<TenantContextMiddleware>();
app.UseAuthorization();
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions { Predicate = _ => false }).AllowAnonymous().DisableRateLimiting();
app.MapHealthChecks("/health/ready").AllowAnonymous().DisableRateLimiting();
app.UseSwagger(options => options.RouteTemplate = "openapi/{documentName}.json");
app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "VerloskundigeSpiekt API v1"));
app.MapControllers();
app.Run();

public partial class Program { }
