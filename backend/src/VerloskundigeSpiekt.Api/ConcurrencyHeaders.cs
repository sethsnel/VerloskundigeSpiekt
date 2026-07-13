using VerloskundigeSpiekt.Application;

namespace VerloskundigeSpiekt.Api;

public static class ConcurrencyHeaders
{
    public static byte[]? DecodeIfMatch(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        if (trimmed.StartsWith("W/", StringComparison.OrdinalIgnoreCase) || trimmed.Length < 3 || trimmed[0] != '"' || trimmed[^1] != '"')
            throw Malformed();
        try
        {
            var bytes = Convert.FromBase64String(trimmed[1..^1]);
            if (bytes.Length != 16) throw Malformed();
            return bytes;
        }
        catch (FormatException) { throw Malformed(); }
    }

    public static void SetETag(HttpResponse response, string version) => response.Headers.ETag = $"\"{version}\"";

    private static ApiOperationException Malformed() => new(ErrorCodes.MalformedPrecondition, "If-Match must be a quoted resource ETag.", StatusCodes.Status400BadRequest);
}
