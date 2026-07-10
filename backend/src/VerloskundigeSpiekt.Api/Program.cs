using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using VerloskundigeSpiekt.Api;
using VerloskundigeSpiekt.Application;
using VerloskundigeSpiekt.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOptions<FirebaseOptions>().Bind(builder.Configuration.GetSection(FirebaseOptions.SectionName)).ValidateDataAnnotations().ValidateOnStart();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, HttpCurrentUser>();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
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
});
builder.Services.AddCors(options => options.AddPolicy("known-origins", policy => policy.WithOrigins(firebase.AllowedOrigins.Concat(firebase.AllowedExtensionOrigins).ToArray()).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("default", limiter => { limiter.PermitLimit = 120; limiter.Window = TimeSpan.FromMinutes(1); limiter.QueueLimit = 0; });
});
builder.Services.AddHealthChecks();

var app = builder.Build();
app.UseMiddleware<ProblemDetailsMiddleware>();
app.UseForwardedHeaders(new ForwardedHeadersOptions { ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto });
if (!app.Environment.IsDevelopment()) app.UseHsts();
app.UseHttpsRedirection();
app.UseCorrelationId();
app.UseRequestTimeouts();
app.UseCors("known-origins");
app.UseRateLimiter();
app.UseAuthentication();
app.UseMiddleware<TenantContextMiddleware>();
app.UseAuthorization();
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/health/ready").AllowAnonymous();
app.UseSwagger(options => options.RouteTemplate = "openapi/{documentName}.json");
app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "VerloskundigeSpiekt API v1"));
app.MapControllers().RequireRateLimiting("default");
app.Run();

public partial class Program { }
