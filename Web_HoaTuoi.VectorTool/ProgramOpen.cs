// using System;
// using System.Collections.Generic;
// using System.Data;
// using System.Net.Http;
// using System.Net.Http.Headers;
// using System.Net.Http.Json;
// using System.Text.Json;
// using System.Threading.Tasks;
// using Microsoft.Data.SqlClient;
// using MongoDB.Bson;
// using MongoDB.Bson.Serialization.Attributes;
// using MongoDB.Driver;

// namespace Web_HoaTuoi.VectorTool
// {
//     class Program
//     {
//         // Định nghĩa cấu trúc Document để lưu vào MongoDB
//         public class FlowerEmbeddingDocument
//         {
//             [BsonId]
//             [BsonRepresentation(BsonType.ObjectId)]
//             public string? Id { get; set; }

//             public int ProductId { get; set; }
//             public string Name { get; set; } = string.Empty;
//             public string Description { get; set; } = string.Empty;
//             public string FlowerType { get; set; } = string.Empty;
//             public string Color { get; set; } = string.Empty;

//             // Trường quan trọng để lưu Vector phục vụ Semantic Search (OpenAI trả về 1536 chiều)
//             [BsonElement("flower_vector")]
//             public List<float> FlowerVector { get; set; } = new();

//             public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
//         }

//         static async Task Main(string[] args)
//         {
//             Console.OutputEncoding = System.Text.Encoding.UTF8;
//             Console.WriteLine("=== CÔNG CỤ CHUYỂN ĐỔI & NẠP VECTOR HOA TƯƠI (OPENAI) ===");

//             // Tự động nạp các biến từ file .env.local nếu có
//             // Nếu bạn không dùng DotNetEnv, chương trình sẽ lấy trực tiếp từ Environment của hệ thống.
//             try 
//             {
//                 DotNetEnv.Env.Load(".env.local");
//             }
//             catch 
//             {
//                 // Bỏ qua nếu không cài DotNetEnv hoặc không tìm thấy file .env.local
//             }

//             // 1. Đọc các thông tin cấu hình từ Environment Variables
//             string sqlConnectionString = Environment.GetEnvironmentVariable("SQL_CONNECTION_STRING") ?? "";
//             string mongoConnectionString = Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING") ?? "";
//             string openaiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? "";

//             if (string.IsNullOrEmpty(sqlConnectionString) || string.IsNullOrEmpty(mongoConnectionString) || string.IsNullOrEmpty(openaiApiKey))
//             {
//                 Console.WriteLine("❌ Lỗi: Thiếu cấu hình trong môi trường hoặc file .env.local!");
//                 Console.WriteLine("👉 Cần cấu hình: SQL_CONNECTION_STRING, MONGO_CONNECTION_STRING, OPENAI_API_KEY");
//                 return;
//             }

//             // 2. Lấy dữ liệu từ SQL Server
//             Console.WriteLine("\n[1/4] Đang kết nối SQL Server để lấy danh sách hoa...");
//             List<FlowerEmbeddingDocument> flowers = new();

//             try
//             {
//                 using var connection = new SqlConnection(sqlConnectionString);
//                 await connection.OpenAsync();

//                 string query = "SELECT Id, Name, Description, FlowerType, Color FROM Products";
//                 using var command = new SqlCommand(query, connection);
//                 using var reader = await command.ExecuteReaderAsync();

//                 while (await reader.ReadAsync())
//                 {
//                     flowers.Add(new FlowerEmbeddingDocument
//                     {
//                         ProductId = reader.GetInt32(0),
//                         Name = reader.IsDBNull(1) ? "" : reader.GetString(1),
//                         Description = reader.IsDBNull(2) ? "" : reader.GetString(2),
//                         FlowerType = reader.IsDBNull(3) ? "" : reader.GetString(3),
//                         Color = reader.IsDBNull(4) ? "" : reader.GetString(4)
//                     });
//                 }
//                 Console.WriteLine($"✅ Lấy thành công {flowers.Count} sản phẩm hoa từ SQL Server.");
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"❌ Lỗi kết nối SQL Server: {ex.Message}");
//                 return;
//             }

//             if (flowers.Count == 0) return;

//             // 3. Khởi tạo kết nối MongoDB và HttpClient cho OpenAI
//             using var httpClient = new HttpClient();
//             // Thêm Header Authentication chuẩn cho OpenAI API
//             httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", openaiApiKey);

//             var mongoClient = new MongoClient(mongoConnectionString);
//             var database = mongoClient.GetDatabase("HoaTuoiSearchDB"); 
//             var collection = database.GetCollection<FlowerEmbeddingDocument>("flower_embeddings"); 

//             Console.WriteLine("\n[2/4] Đang xử lý tạo Vector (OpenAI) và nạp lên MongoDB Atlas...");
//             int successCount = 0;
//             string openaiUrl = "https://api.openai.com/v1/embeddings";

//             foreach (var flower in flowers)
//             {
//                 // Gộp thông tin tối ưu hóa ngữ nghĩa cho Embedding
//                 string fullTextToEmbed = $"Tên hoa: {flower.Name}. Loại hoa: {flower.FlowerType}. Màu sắc: {flower.Color}. Mô tả: {flower.Description}";

//                 try
//                 {
//                     Console.Write($" -> Đang xử lý: {flower.Name}... ");

//                     // Cấu trúc Request Body chuẩn OpenAI Embeddings
//                     var requestBody = new
//                     {
//                         model = "text-embedding-3-small", // Có thể đổi thành text-embedding-ada-002 nếu muốn
//                         input = fullTextToEmbed
//                     };

//                     var response = await httpClient.PostAsJsonAsync(openaiUrl, requestBody);

//                     if (!response.IsSuccessStatusCode)
//                     {
//                         string errorResponse = await response.Content.ReadAsStringAsync();
//                         Console.WriteLine($"❌ Lỗi API OpenAI: {errorResponse}");
//                         continue;
//                     }

//                     // Parse kết quả trả về từ OpenAI (Cấu trúc: data[0].embedding)
//                     using var jsonDoc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
//                     var embeddingElement = jsonDoc.RootElement
//                         .GetProperty("data")[0]
//                         .GetProperty("embedding");

//                     List<float> vectorList = new();
//                     foreach (var val in embeddingElement.EnumerateArray())
//                     {
//                         vectorList.Add(val.GetSingle());
//                     }

//                     flower.FlowerVector = vectorList;

//                     // Lưu/Cập nhật vào MongoDB (Upsert theo ProductId)
//                     var filter = Builders<FlowerEmbeddingDocument>.Filter.Eq(f => f.ProductId, flower.ProductId);
//                     await collection.ReplaceOneAsync(filter, flower, new ReplaceOptions { IsUpsert = true });

//                     Console.WriteLine("✨ Đã nạp xong!");
//                     successCount++;

//                     // OpenAI tài khoản trả phí (hoặc tier thấp) xử lý rất nhanh, 
//                     // nhưng vẫn nên delay nhẹ khoảng 200-500ms để tránh bóp băng thông đột ngột.
//                     await Task.Delay(200);
//                 }
//                 catch (Exception ex)
//                 {
//                     Console.WriteLine($"❌ Thất bại: {ex.Message}");
//                 }
//             }

//             Console.WriteLine($"\n=== HOÀN THÀNH ===");
//             Console.WriteLine($"🎉 Đã nạp thành công: {successCount}/{flowers.Count} sản phẩm hoa lên MongoDB Atlas.");
//         }
//     }
// }