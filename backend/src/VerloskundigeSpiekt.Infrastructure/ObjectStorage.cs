using Microsoft.Extensions.Options;

namespace VerloskundigeSpiekt.Infrastructure;

public sealed class StorageOptions
{
    public const string SectionName = "Storage";
    public string RootPath { get; set; } = string.Empty;
    public string SigningKey { get; set; } = string.Empty;
    public int SignedUrlLifetimeSeconds { get; set; } = 300;
}

public interface IObjectStorage
{
    Task WriteAsync(string objectName, Stream content, long expectedBytes, CancellationToken cancellationToken);
    Task<Stream> OpenReadAsync(string objectName, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(string objectName, CancellationToken cancellationToken);
    Task DeleteAsync(string objectName, CancellationToken cancellationToken);
}

public sealed class LocalObjectStorage(IOptions<StorageOptions> options) : IObjectStorage
{
    private readonly string root = Path.GetFullPath(options.Value.RootPath);

    public async Task WriteAsync(string objectName, Stream content, long expectedBytes, CancellationToken cancellationToken)
    {
        var path = Resolve(objectName); Directory.CreateDirectory(Path.GetDirectoryName(path)!); var temporary = $"{path}.{Guid.NewGuid():N}.upload";
        try
        {
            await using var output = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81_920, FileOptions.Asynchronous | FileOptions.WriteThrough);
            var buffer = new byte[81_920]; long total = 0; int read;
            while ((read = await content.ReadAsync(buffer, cancellationToken)) > 0) { total += read; if (total > expectedBytes) throw new InvalidDataException("Upload exceeds the authorized size."); await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken); }
            if (total != expectedBytes) throw new InvalidDataException("Upload size does not match the authorization.");
            await output.FlushAsync(cancellationToken); File.Move(temporary, path, true);
        }
        finally { if (File.Exists(temporary)) File.Delete(temporary); }
    }

    public Task<Stream> OpenReadAsync(string objectName, CancellationToken cancellationToken) => Task.FromResult<Stream>(new FileStream(Resolve(objectName), FileMode.Open, FileAccess.Read, FileShare.Read, 81_920, FileOptions.Asynchronous | FileOptions.SequentialScan));
    public Task<bool> ExistsAsync(string objectName, CancellationToken cancellationToken) => Task.FromResult(File.Exists(Resolve(objectName)));
    public Task DeleteAsync(string objectName, CancellationToken cancellationToken) { var path = Resolve(objectName); if (File.Exists(path)) File.Delete(path); return Task.CompletedTask; }

    private string Resolve(string objectName)
    {
        var path = Path.GetFullPath(Path.Combine(root, objectName.Replace('/', Path.DirectorySeparatorChar)));
        if (!path.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Storage object escaped its configured root.");
        return path;
    }
}
