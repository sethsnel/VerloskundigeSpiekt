using System.ComponentModel.DataAnnotations;

namespace VerloskundigeSpiekt.Api;

public sealed class FirebaseOptions
{
    public const string SectionName = "Firebase";
    [Required] public string ProjectId { get; set; } = string.Empty;
    public string[] AllowedOrigins { get; set; } = [];
    public string[] AllowedExtensionOrigins { get; set; } = [];
}
