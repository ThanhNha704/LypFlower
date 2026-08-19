using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text;
using System.Text.Json;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Models;

namespace Web_HoaTuoi.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly string _mongoConnString;
        private readonly string _geminiApiKey;
        private readonly AppDbContext _db;

        public SearchController(IConfiguration configuration, IHttpClientFactory httpClientFactory, AppDbContext db)
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

        [HttpPost("semantic-search")]
        public async Task<IActionResult> SemanticSearch([FromBody] SearchRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Query))
            {
                return BadRequest(new { message = "Từ khóa tìm kiếm không được để trống." });
            }

            List<dynamic> matchedResults = new();
            bool vectorSearchSuccess = false;

            // 1. Thực hiện tìm kiếm Vector (Vector Search) sử dụng dịch vụ Gemini Embedding kết hợp dữ liệu MongoDB
            try
            {
                var queryVector = await GetEmbeddingFromGeminiAsync(request.Query);
                if (queryVector != null && queryVector.Count > 0)
                {
                    var mongoSettings = MongoClientSettings.FromConnectionString(_mongoConnString);
                    mongoSettings.ServerSelectionTimeout = TimeSpan.FromSeconds(3); // Giới hạn thời gian kết nối tối đa 3 giây
                    var client = new MongoClient(mongoSettings);

                    var database = client.GetDatabase("HoaTuoiSearchDB");
                    var collection = database.GetCollection<BsonDocument>("flower_embeddings");

                    var vectorSearchStage = new BsonDocument("$vectorSearch", new BsonDocument
                    {
                        { "index", "vector_index" },
                        { "path", "flower_vector" },
                        { "queryVector", new BsonArray(queryVector) },
                        { "numCandidates", 50 },
                        { "limit", 10 }
                    });

                    var projectStage = new BsonDocument("$project", new BsonDocument
                    {
                        { "_id", 1 },
                        { "ProductId", 1 },
                        { "Name", 1 },
                        { "Slug", 1 },
                        { "MainImageUrl", 1 },
                        { "Description", 1 },
                        { "Meaning", 1 },
                        { "Price", 1 },
                        { "SalePrice", 1 },
                        { "FlowerType", 1 },
                        { "Color", 1 },
                        { "score", new BsonDocument("$meta", "vectorSearchScore") }
                    });

                    var matchStage = new BsonDocument("$match", new BsonDocument
                    {
                        { "score", new BsonDocument("$gte", 0.50) }
                    });

                    var pipeline = new[] { vectorSearchStage, projectStage, matchStage };
                    var resultsBson = await collection.Aggregate<BsonDocument>(pipeline).ToListAsync();

                    if (resultsBson != null && resultsBson.Count > 0)
                    {
                        var vectorResults = resultsBson.Select(doc => new
                        {
                            id = doc.GetValue("_id", null)?.ToString(),
                            productId = doc.GetValue("ProductId", 0).AsInt32,
                            name = doc.GetValue("Name", "").AsString,
                            slug = doc.GetValue("Slug", "").AsString,
                            mainImageUrl = doc.GetValue("MainImageUrl", "").AsString,
                            description = doc.GetValue("Description", "").AsString,
                            meaning = doc.GetValue("Meaning", "").AsString,
                            price = doc.GetValue("Price", 0).AsDecimal,
                            salePrice = doc.GetValue("SalePrice", 0).AsDecimal,
                            flowerType = doc.GetValue("FlowerType", "").AsString,
                            color = doc.GetValue("Color", "").AsString,
                            score = Math.Round(doc.GetValue("score", 0.85).AsDouble, 2)
                        }).ToList();

                        matchedResults.AddRange(vectorResults);
                        vectorSearchSuccess = true;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Vector Search Warning]: {ex.Message}. Fallback to SQL Search.");
            }

            // 2. Dự phòng (Fallback): Thực hiện truy vấn trên SQL Server nếu tìm kiếm Vector thất bại
            if (!vectorSearchSuccess || matchedResults.Count == 0)
            {
                var queryLower = request.Query.ToLower();
                var keywords = queryLower.Split(' ', StringSplitOptions.RemoveEmptyEntries);

                var products = await _db.Products
                    .Where(p => p.IsActive)
                    .Take(50)
                    .ToListAsync();

                var sqlMatched = products.Select(p => {
                    double score = 0.70;
                    string target = $"{p.Name} {p.Description} {p.FlowerType} {p.Color} {p.Occasion}".ToLower();
                    int matchCount = keywords.Count(k => k.Length > 2 && target.Contains(k));
                    if (matchCount > 0) score += Math.Min(0.25, matchCount * 0.08);

                    return new
                    {
                        id = p.Id.ToString(),
                        productId = p.Id,
                        name = p.Name,
                        slug = p.Slug,
                        mainImageUrl = p.MainImageUrl,
                        description = p.Description ?? "",
                        meaning = p.Description ?? "",
                        price = p.Price,
                        salePrice = p.SalePrice,
                        flowerType = p.FlowerType ?? "Hoa Tươi",
                        color = p.Color ?? "Đa sắc",
                        score = Math.Round(score, 2),
                        matchCount
                    };
                })
                .Where(x => x.matchCount > 0 || string.IsNullOrWhiteSpace(request.Query))
                .OrderByDescending(x => x.score)
                .Take(8)
                .Select(x => (dynamic)x)
                .ToList();

                if (sqlMatched.Count == 0 && products.Count > 0)
                {
                    sqlMatched = products.Take(6).Select(p => (dynamic)new
                    {
                        id = p.Id.ToString(),
                        productId = p.Id,
                        name = p.Name,
                        slug = p.Slug,
                        mainImageUrl = p.MainImageUrl,
                        description = p.Description ?? "",
                        meaning = p.Description ?? "",
                        price = p.Price,
                        salePrice = p.SalePrice,
                        flowerType = p.FlowerType ?? "Hoa Tươi",
                        color = p.Color ?? "Đa sắc",
                        score = 0.80
                    }).ToList();
                }

                matchedResults = sqlMatched;
            }

            // 3. Gọi dịch vụ Gemini AI để tạo lập câu văn tư vấn dựa trên danh sách sản phẩm tìm được
            string aiResponseText = await GenerateAiSummaryAsync(request.Query, matchedResults);

            return Ok(new
            {
                message = "Tìm kiếm thành công",
                query = request.Query,
                aiResponse = aiResponseText,
                data = matchedResults
            });
        }

        private async Task<List<float>?> GetEmbeddingFromGeminiAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(_geminiApiKey)) return null;

            try
            {
                string geminiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={_geminiApiKey}";

                var requestBody = new
                {
                    model = "models/gemini-embedding-001",
                    content = new { parts = new[] { new { text = text } } }
                };

                var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(4));
                var response = await _httpClient.PostAsync(geminiUrl, jsonContent, cts.Token);

                if (!response.IsSuccessStatusCode) return null;

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
                Console.WriteLine($"[Gemini Embedding Error]: {ex.Message}");
            }

            return null;
        }

        private async Task<string> GenerateAiSummaryAsync(string userQuery, List<dynamic> matchedProducts)
        {
            if (!string.IsNullOrWhiteSpace(_geminiApiKey) && matchedProducts.Count > 0)
            {
                try
                {
                    string geminiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={_geminiApiKey}";

                    var productDetails = matchedProducts.Select(p => $"- {p.name} (Loại: {p.flowerType}, Màu: {p.color})");
                    string productContext = string.Join("\n", productDetails);

                    string prompt = $@"Bạn là chuyên gia tư vấn hoa tươi cao cấp của Lyp Flower.
Khách hàng đang tìm kiếm với nhu cầu: '{userQuery}'.
Dưới đây là các sản phẩm phù hợp nhất tìm được từ hệ thống:
{productContext}

Hãy viết một đoạn tư vấn từ 2 - 3 câu (khoảng 60 - 80 từ) thật chuyên nghiệp, ấm áp và tinh tế:
1. Xưng 'Lyp Flower' và chào/đón nhận nhu cầu của khách hàng.
2. Phân tích nhẹ nhàng về ý nghĩa tone màu/loại hoa này phù hợp như thế nào với nhu cầu '{userQuery}'.
3. Lời chúc hoặc lời mời khách hàng khám phá các mẫu hoa bên dưới.";

                    var requestBody = new
                    {
                        contents = new[]
                        {
                            new { parts = new[] { new { text = prompt } } }
                        }
                    };

                    var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(4));
                    var response = await _httpClient.PostAsync(geminiUrl, jsonContent, cts.Token);

                    if (response.IsSuccessStatusCode)
                    {
                        using var jsonDoc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cts.Token));
                        var candidates = jsonDoc.RootElement.GetProperty("candidates");
                        if (candidates.GetArrayLength() > 0)
                        {
                            var text = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();
                            if (!string.IsNullOrWhiteSpace(text))
                            {
                                return text.Trim();
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[AI Summary Warning]: {ex.Message}");
                }
            }

            return $"Dựa trên mong muốn '{userQuery}', Lyp Flower xin gợi ý những mẫu hoa mang sắc màu dịu nhẹ cùng ý nghĩa sâu sắc nhất. Đây sẽ là món quà tuyệt vời giúp bạn gửi gắm trọn vẹn tình cảm chân thành và sự trân trọng!";
        }
    }

    public class SearchRequest
    {
        public string Query { get; set; } = string.Empty;
    }
}