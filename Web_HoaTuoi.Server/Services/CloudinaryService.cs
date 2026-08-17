using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace Web_HoaTuoi.Server.Services;

public interface ICloudinaryService
{
    Task<string> UploadAsync(IFormFile file, string folder = "hoatuoi");
    Task<bool> DeleteAsync(string publicId);
    string ExtractPublicId(string imageUrl);
}

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryService> _logger;

    public CloudinaryService(IConfiguration config, ILogger<CloudinaryService> logger)
    {
        _logger = logger;

        // Ưu tiên đọc từ biến môi trường (.env.local hoặc System Env)
        var cloudName = DotNetEnv.Env.GetString("CLOUDINARY_CLOUD_NAME", null)
                        ?? Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME")
                        ?? config["Cloudinary:CloudName"]
                        ?? throw new InvalidOperationException("CLOUDINARY_CLOUD_NAME chưa được cấu hình.");

        var apiKey = DotNetEnv.Env.GetString("CLOUDINARY_API_KEY", null)
                     ?? Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY")
                     ?? config["Cloudinary:ApiKey"]
                     ?? throw new InvalidOperationException("CLOUDINARY_API_KEY chưa được cấu hình.");

        var apiSecret = DotNetEnv.Env.GetString("CLOUDINARY_API_SECRET", null)
                        ?? Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET")
                        ?? config["Cloudinary:ApiSecret"]
                        ?? throw new InvalidOperationException("CLOUDINARY_API_SECRET chưa được cấu hình.");

        // Loại bỏ dấu ngoặc kép dư thừa nếu có
        cloudName = cloudName.Trim('"');
        apiKey = apiKey.Trim('"');
        apiSecret = apiSecret.Trim('"');

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
        _cloudinary.Api.Secure = true;
    }

    /// <summary>
    /// Upload file ảnh lên Cloudinary, trả về URL CDN của ảnh.
    /// </summary>
    public async Task<string> UploadAsync(IFormFile file, string folder = "hoatuoi")
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File ảnh không hợp lệ.");

        await using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder,
            UseFilename = false,
            UniqueFilename = true,
            Overwrite = false,
            // Tự động chuyển định dạng sang WebP để tối ưu dung lượng
            Transformation = new Transformation().Quality("auto").FetchFormat("auto")
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.Error != null)
        {
            _logger.LogError("[Cloudinary] Upload thất bại: {Error}", result.Error.Message);
            throw new Exception($"Upload ảnh lên Cloudinary thất bại: {result.Error.Message}");
        }

        _logger.LogInformation("[Cloudinary] Upload thành công: {Url}", result.SecureUrl);
        return result.SecureUrl.ToString();
    }

    /// <summary>
    /// Xóa ảnh trên Cloudinary theo PublicId.
    /// </summary>
    public async Task<bool> DeleteAsync(string publicId)
    {
        if (string.IsNullOrWhiteSpace(publicId)) return false;

        var deleteParams = new DeletionParams(publicId);
        var result = await _cloudinary.DestroyAsync(deleteParams);
        return result.Result == "ok";
    }

    /// <summary>
    /// Trích xuất Public ID của ảnh từ URL Cloudinary.
    /// </summary>
    public string ExtractPublicId(string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl)) return string.Empty;
        
        // Kiểm tra xem có phải URL Cloudinary không
        if (!imageUrl.Contains("res.cloudinary.com")) return string.Empty;
        
        try
        {
            // Định dạng URL Cloudinary: 
            // https://res.cloudinary.com/{cloudName}/image/upload/v{version}/{folder}/{subfolder}/{name}.{ext}
            // Ta cần lấy: {folder}/{subfolder}/{name}
            
            var parts = imageUrl.Split("/upload/");
            if (parts.Length < 2) return string.Empty;
            
            var pathAfterUpload = parts[1]; // v123456/hoatuoi/products/filename.jpg
            
            // Bỏ phần version (v123456/) nếu có
            if (pathAfterUpload.StartsWith("v") && pathAfterUpload.Contains("/"))
            {
                var slashIndex = pathAfterUpload.IndexOf('/');
                pathAfterUpload = pathAfterUpload.Substring(slashIndex + 1); // hoatuoi/products/filename.jpg
            }
            
            // Bỏ phần đuôi mở rộng file (.jpg, .png, .webp...)
            var dotIndex = pathAfterUpload.LastIndexOf('.');
            if (dotIndex > 0)
            {
                pathAfterUpload = pathAfterUpload.Substring(0, dotIndex); // hoatuoi/products/filename
            }
            
            return pathAfterUpload;
        }
        catch
        {
            return string.Empty;
        }
    }
}
