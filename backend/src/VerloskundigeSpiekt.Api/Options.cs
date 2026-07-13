using System.ComponentModel.DataAnnotations;

namespace VerloskundigeSpiekt.Api;

public sealed class FirebaseOptions
{
    public const string SectionName = "Firebase";
    [Required] public string ProjectId { get; set; } = string.Empty;
    public string[] AllowedOrigins { get; set; } = [];
    public string[] AllowedExtensionOrigins { get; set; } = [];
}

public sealed class ReverseProxyOptions
{
    public const string SectionName = "ReverseProxy";
    public string[] KnownProxies { get; set; } = [];
    public string[] KnownNetworks { get; set; } = [];
}
public sealed class ApiRateLimitOptions
{
    public const string SectionName = "RateLimits";
    public int DefaultPermits { get; set; } = 120;
    public int SearchPermits { get; set; } = 30;
    public int ExtensionPermits { get; set; } = 60;
    public int WindowSeconds { get; set; } = 60;
}
