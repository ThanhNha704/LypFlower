using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Models;

namespace Web_HoaTuoi.Server.Services
{
    public class VectorDbService
    {
        private readonly HttpClient _httpClient;
        private readonly AppDbContext _db;
        private readonly string _mongoConnString;
        private readonly string _geminiApiKey;

        // Định nghĩa cấu trúc lưu vào MongoDB (giống như Console Tool)
        public class FlowerEmbeddingDocument
        {
            public int ProductId { get; set; }
            public string Name { get; set; } = string.Empty;
            public string Slug { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string Meaning { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public decimal SalePrice { get; set; }
            public bool IsOnSale { get; set; }
            public int CategoryId { get; set; }
            public string FlowerType { get; set; } = string.Empty;
            public string Color { get; set; } = string.Empty;
            public int Stock { get; set; }
            public bool IsActive { get; set; }
            public int SoldCount { get; set; }
            public string MainImageUrl { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
            public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
            public string BouquetSize { get; set; } = string.Empty;
            public string Occasion { get; set; } = string.Empty;
            public double WeightKg { get; set; }

            [BsonElement("flower_vector")]
            public List<float> FlowerVector { get; set; } = new();
        }

        public VectorDbService(IConfiguration configuration, IHttpClientFactory httpClientFactory, AppDbContext db)
        {
            _httpClient = httpClientFactory.CreateClient();
            _db = db;

            try { DotNetEnv.Env.Load(".env.local"); } catch { }

            var mongoConn = configuration["MONGO_CONNECTION_STRING"]
                            ?? Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING")
                            ?? DotNetEnv.Env.GetString("MONGO_CONNECTION_STRING", null)
                            ?? configuration.GetConnectionString("MongoDB");

            if (string.IsNullOrWhiteSpace(mongoConn))
            {
                mongoConn = "mongodb+srv://truongnha474:mongoDb@cluster0.r2doavc.mongodb.net/";
            }
            _mongoConnString = mongoConn;

            var rawKey = configuration["GEMINI_API_KEY"]
                         ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY")
                         ?? DotNetEnv.Env.GetString("GEMINI_API_KEY", null)
                         ?? string.Empty;

            _geminiApiKey = rawKey.Trim().Trim('"', '\'');
        }

        private IMongoCollection<FlowerEmbeddingDocument> GetMongoCollection()
        {
            var mongoSettings = MongoClientSettings.FromConnectionString(_mongoConnString);
            var client = new MongoClient(mongoSettings);
            var database = client.GetDatabase("HoaTuoiSearchDB");
            return database.GetCollection<FlowerEmbeddingDocument>("flower_embeddings");
        }

        public async Task<List<float>?> GetEmbeddingFromGeminiAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(_geminiApiKey)) return null;

            int maxRetries = 5;
            int retryDelayMs = 10000;

            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    string geminiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={_geminiApiKey}";

                    var requestBody = new
                    {
                        model = "models/gemini-embedding-001",
                        content = new { parts = new[] { new { text = text } } }
                    };

                    var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                    var response = await _httpClient.PostAsync(geminiUrl, jsonContent, cts.Token);

                    // Xử lý lỗi Rate Limit 429
                    if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                    {
                        Console.WriteLine($"[Gemini API] Bị giới hạn tần suất (429) ở lần thử {attempt}. Tự động thử lại sau {retryDelayMs / 1000} giây...");
                        await Task.Delay(retryDelayMs);
                        retryDelayMs *= 2;
                        continue;
                    }

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorMsg = await response.Content.ReadAsStringAsync();
                        Console.WriteLine($"[Gemini API Lỗi] HTTP {response.StatusCode}: {errorMsg}");
                        return null;
                    }

                    using var jsonDoc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cts.Token));
                    if (jsonDoc.RootElement.TryGetProperty("embedding", out var embedding) &&
                        embedding.TryGetProperty("values", out var values))
                    {
                        List<float> vectorList = new();
                        foreach (var val in values.EnumerateArray())
                        {
                            vectorList.Add(val.GetSingle());
                        }
                        return vectorList;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Gemini API Lỗi mạng lần {attempt}]: {ex.Message}");
                    if (attempt == maxRetries) return null;
                    await Task.Delay(2000);
                }
            }

            return null;
        }

        public async Task UpsertProductVectorAsync(Product product)
        {
            // Chỉ đồng bộ khi sản phẩm đang hoạt động (IsActive)
            if (!product.IsActive)
            {
                await DeleteProductVectorAsync(product.Id);
                return;
            }

            try
            {
                string fullTextToEmbed = $"Tên hoa: {product.Name}. " +
                                         $"Loại hoa: {product.FlowerType}. " +
                                         $"Màu sắc: {product.Color}. " +
                                         $"Kích thước: {product.BouquetSize ?? "Tiêu chuẩn"}. " +
                                         $"Trọng lượng: {product.WeightKg ?? 0} kg. " +
                                         $"Dịp tặng phù hợp: {product.Occasion ?? "Nhiều dịp"}. " +
                                         $"Ý nghĩa: {product.Meaning ?? ""}. " +
                                         $"Mô tả chi tiết: {product.Description}";

                var vector = await GetEmbeddingFromGeminiAsync(fullTextToEmbed);
                if (vector == null || vector.Count == 0)
                {
                    Console.WriteLine($"[VectorDbSync Warning] Không tạo được Vector cho sản phẩm: {product.Name}");
                    return;
                }

                var doc = new FlowerEmbeddingDocument
                {
                    ProductId = product.Id,
                    Name = product.Name,
                    Slug = product.Slug,
                    Description = product.Description,
                    Meaning = product.Meaning ?? string.Empty,
                    Price = product.Price,
                    SalePrice = product.SalePrice ?? 0,
                    IsOnSale = product.IsOnSale,
                    CategoryId = product.CategoryId,
                    FlowerType = product.FlowerType,
                    Color = product.Color,
                    Stock = product.Stock,
                    IsActive = product.IsActive,
                    SoldCount = product.SoldCount,
                    MainImageUrl = product.MainImageUrl,
                    CreatedAt = product.CreatedAt,
                    UpdatedAt = product.UpdatedAt,
                    BouquetSize = product.BouquetSize ?? string.Empty,
                    Occasion = product.Occasion ?? string.Empty,
                    WeightKg = product.WeightKg ?? 0,
                    FlowerVector = vector
                };

                var collection = GetMongoCollection();
                var filter = Builders<FlowerEmbeddingDocument>.Filter.Eq(f => f.ProductId, doc.ProductId);
                await collection.ReplaceOneAsync(filter, doc, new ReplaceOptions { IsUpsert = true });
                Console.WriteLine($"[VectorDbSync Success] Đã đồng bộ sản phẩm: {product.Name}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VectorDbSync Error] Lỗi khi đồng bộ sản phẩm {product.Name}: {ex.Message}");
            }
        }

        public async Task DeleteProductVectorAsync(int productId)
        {
            try
            {
                var collection = GetMongoCollection();
                var filter = Builders<FlowerEmbeddingDocument>.Filter.Eq(f => f.ProductId, productId);
                await collection.DeleteOneAsync(filter);
                Console.WriteLine($"[VectorDbSync Success] Đã xóa sản phẩm ID {productId} khỏi VectorDB.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VectorDbSync Error] Lỗi khi xóa sản phẩm ID {productId} khỏi VectorDB: {ex.Message}");
            }
        }

        public async Task<int> GetVectorDbCountAsync()
        {
            try
            {
                var collection = GetMongoCollection();
                var count = await collection.CountDocumentsAsync(new BsonDocument());
                return (int)count;
            }
            catch
            {
                return 0;
            }
        }

        public async Task<int> SyncAllProductsToVectorDbAsync()
        {
            var activeProducts = await _db.Products
                .Where(p => p.IsActive)
                .ToListAsync();

            var activeIds = activeProducts.Select(p => p.Id).ToList();

            // 1. Tự động dọn dẹp các sản phẩm thừa trong MongoDB (đã bị xoá hoặc ẩn ở SQL Server)
            try
            {
                var collection = GetMongoCollection();
                var deleteFilter = Builders<FlowerEmbeddingDocument>.Filter.Not(
                    Builders<FlowerEmbeddingDocument>.Filter.In(f => f.ProductId, activeIds)
                );
                var deleteResult = await collection.DeleteManyAsync(deleteFilter);
                Console.WriteLine($"[VectorDbSync Clean] Đã dọn dẹp {deleteResult.DeletedCount} sản phẩm thừa khỏi MongoDB.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VectorDbSync Warning] Không thể dọn dẹp sản phẩm thừa: {ex.Message}");
            }

            // 2. Lấy danh sách ID sản phẩm đã được đồng bộ trong MongoDB để tránh làm lại các sản phẩm cũ
            var existingProducts = new Dictionary<int, DateTime>();
            try
            {
                var collection = GetMongoCollection();
                var projection = Builders<FlowerEmbeddingDocument>.Projection
                    .Include(f => f.ProductId)
                    .Include(f => f.UpdatedAt);
                
                var docs = await collection.Find(new BsonDocument())
                    .Project(projection)
                    .ToListAsync();

                foreach (var doc in docs)
                {
                    int pid = doc["ProductId"].AsInt32;
                    DateTime updated = doc.Contains("UpdatedAt") ? doc["UpdatedAt"].ToUniversalTime() : DateTime.MinValue;
                    existingProducts[pid] = updated;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VectorDbSync Read] Lỗi đọc danh sách sản phẩm hiện có từ MongoDB: {ex.Message}");
            }

            // 3. Lọc danh sách sản phẩm cần đồng bộ (chưa có trong MongoDB hoặc ngày cập nhật mới hơn)
            var productsToSync = new List<Product>();
            foreach (var p in activeProducts)
            {
                if (!existingProducts.TryGetValue(p.Id, out var mongoUpdated))
                {
                    productsToSync.Add(p);
                }
                else if (p.UpdatedAt > mongoUpdated)
                {
                    productsToSync.Add(p);
                }
            }

            // 4. Đồng bộ các sản phẩm đang cần cập nhật
            int count = 0;
            foreach (var product in productsToSync)
            {
                try
                {
                    await UpsertProductVectorAsync(product);
                    count++;
                    // Delay nhẹ để tránh bị block API rate limit
                    await Task.Delay(500);
                }
                catch
                {
                    // Tiếp tục đồng bộ sản phẩm tiếp theo
                }
            }

            return count;
        }
    }
}
