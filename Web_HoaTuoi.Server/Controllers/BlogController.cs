using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Models;
using Web_HoaTuoi.Server.Services;
using System.Text.Json.Serialization;
using System.Security.Claims;

namespace Web_HoaTuoi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlogController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICloudinaryService _cloudinary;
    public BlogController(AppDbContext db, ICloudinaryService cloudinary)
    {
        _db = db;
        _cloudinary = cloudinary;
    }

    public record BlogPostDto(
        int Id, string Title, string Slug, 
        [property: JsonPropertyName("excerpt")] string Summary,
        [property: JsonPropertyName("coverImageUrl")] string? ImageUrl, 
        DateTime CreatedAt, int Type, bool IsPublished);

    public record BlogPostDetailDto(
        int Id, string Title, string Slug, 
        [property: JsonPropertyName("excerpt")] string Summary, string Content,
        [property: JsonPropertyName("coverImageUrl")] string? ImageUrl, 
        DateTime CreatedAt, int Type, bool IsPublished);

    public class CreateBlogDto
    {
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Excerpt { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string CoverImageUrl { get; set; } = string.Empty;
        public int Type { get; set; } = 0;
        public bool IsPublished { get; set; }
    }

    // POST /api/blog/upload-image
    [HttpPost("upload-image")]
    public async Task<ActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("Không có file nào được gửi lên.");
        var url = await _cloudinary.UploadAsync(file, "hoatuoi/blog");
        return Ok(new { url });
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll([FromQuery] int? type, [FromQuery] int page = 1, [FromQuery] int pageSize = 100)
    {
        var query = _db.BlogPosts.AsQueryable();
        if (type.HasValue) query = query.Where(b => b.Type == type.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BlogPostDto(b.Id, b.Title, b.Slug, b.Summary, b.ImageUrl, b.CreatedAt, b.Type, b.IsPublished))
            .ToListAsync();

        return Ok(new { Total = total, Page = page, PageSize = pageSize, Items = items });
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<BlogPostDetailDto>> GetBySlug(string slug)
    {
        var post = await _db.BlogPosts
            .Where(b => b.Slug == slug)
            .Select(b => new BlogPostDetailDto(b.Id, b.Title, b.Slug, b.Summary, b.Content, b.ImageUrl, b.CreatedAt, b.Type, b.IsPublished))
            .FirstOrDefaultAsync();

        if (post is null) return NotFound();
        return Ok(post);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateBlogDto dto)
    {
        var userId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier) 
                     ?? _db.Users.FirstOrDefault(u => u.IsAdmin)?.Id ?? "";

        var post = new BlogPost
        {
            Title = dto.Title, Slug = dto.Slug, Summary = dto.Excerpt,
            Content = dto.Content, ImageUrl = dto.CoverImageUrl, Type = dto.Type, IsPublished = dto.IsPublished,
            AuthorId = userId
        };
        _db.BlogPosts.Add(post);
        await _db.SaveChangesAsync();
        return Ok(post);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] CreateBlogDto dto)
    {
        var post = await _db.BlogPosts.FindAsync(id);
        if (post is null) return NotFound();

        post.Title = dto.Title;
        post.Slug = dto.Slug;
        post.Summary = dto.Excerpt;
        post.Content = dto.Content;
        post.ImageUrl = dto.CoverImageUrl;
        post.Type = dto.Type;
        post.IsPublished = dto.IsPublished;
        post.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(post);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var post = await _db.BlogPosts.FindAsync(id);
        if (post is null) return NotFound();
        _db.BlogPosts.Remove(post);
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("seed-dummy")]
    public async Task<ActionResult> SeedDummy()
    {
        await _db.Database.ExecuteSqlRawAsync("DELETE FROM BlogPosts");
        
        var authorId = (await _db.Users.FirstOrDefaultAsync())?.Id ?? "1";

        var posts = new List<BlogPost>
        {
            new BlogPost
            {
                Title = "BÍ QUYẾT CHĂM SÓC HOA TƯƠI LÂU TẠI NHÀ",
                Slug = "bi-quyet-cham-soc-hoa-tuoi-lau-tai-nha",
                Summary = "Nội dung hữu ích, dễ thu hút người đọc và liên quan trực tiếp đến sản phẩm hoa tươi.",
                Content = @"<p>Chăm sóc hoa tươi đúng cách giúp giữ nguyên vẻ đẹp rực rỡ và hương thơm tự nhiên kéo dài suốt nhiều ngày.</p>
<h3>1. Cách giữ hoa tươi lâu sau khi mua</h3>
<p>Ngay sau khi mua hoa về, nên cắt vát phần gốc khoảng 2–3 cm để tăng khả năng hút nước. Thay nước mỗi ngày và vệ sinh bình hoa thường xuyên sẽ giúp hạn chế vi khuẩn phát triển. Ngoài ra, cần đặt hoa ở nơi thoáng mát, tránh ánh nắng trực tiếp và các nguồn nhiệt cao.</p>
<img src=""https://images.unsplash.com/photo-1507290439931-a861b5a38200?w=800&auto=format&fit=crop"" alt=""Giữ hoa tươi lâu"" class=""rounded-xl my-6 w-full object-cover h-72 shadow-sm"" />
<h3>2. Những sai lầm khiến hoa nhanh héo</h3>
<p>Một số thói quen tưởng chừng vô hại lại là nguyên nhân khiến hoa nhanh tàn. Việc không thay nước thường xuyên, để lá ngập trong nước hoặc đặt hoa dưới ánh nắng trực tiếp đều làm giảm tuổi thọ của hoa.</p>
",
                ImageUrl = "https://images.unsplash.com/photo-1507290439931-a861b5a38200?w=800&auto=format&fit=crop",
                Type = 2, // Chăm sóc hoa
                IsPublished = true,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                AuthorId = authorId
            },
            new BlogPost
            {
                Title = "Ý NGHĨA VÀ CÂU CHUYỆN ĐẰNG SAU CÁC LOÀI HOA",
                Slug = "y-nghia-va-cau-chuyen-dang-sau-cac-loai-hoa",
                Summary = "Giúp khách hàng hiểu ý nghĩa hoa trước khi chọn mua để tặng.",
                Content = @"<p>Mỗi loài hoa mang trong mình một câu chuyện lịch sử và thông điệp cảm xúc tuyệt vời mà thiên nhiên ban tặng.</p>
<h3>1. Ý nghĩa của hoa hồng trong cuộc sống</h3>
<p>Hoa hồng là biểu tượng của tình yêu và sự lãng mạn. Tùy theo màu sắc mà hoa hồng mang những ý nghĩa khác nhau. Hoa hồng đỏ tượng trưng cho tình yêu mãnh liệt, hoa hồng trắng thể hiện sự thuần khiết và chân thành, trong khi hoa hồng vàng đại diện cho tình bạn và niềm vui.</p>
<img src=""https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop"" alt=""Ý nghĩa hoa hồng"" class=""rounded-xl my-6 w-full object-cover h-72 shadow-sm"" />
<h3>2. Vì sao hoa hướng dương được nhiều người yêu thích?</h3>
<p>Hoa hướng dương luôn hướng về phía mặt trời, tượng trưng cho ý chí vươn lên và tinh thần lạc quan. Với màu vàng rực rỡ, loài hoa này mang đến cảm giác vui vẻ, năng lượng tích cực và hy vọng.</p>
",
                ImageUrl = "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop",
                Type = 1, // Ý nghĩa hoa
                IsPublished = true,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                AuthorId = authorId
            },
            new BlogPost
            {
                Title = "KHÁM PHÁ CÁC LOÀI HOA QUÝ HIẾM VÀ ĐỘC ĐÁO TRÊN THẾ GIỚI",
                Slug = "kham-pha-cac-loai-hoa-quy-hiem-va-doc-dao-tren-the-gioi",
                Summary = "Nội dung mang tính khám phá, tạo sự khác biệt cho trang tin tức.",
                Content = @"<p>Thế giới tự nhiên luôn ẩn chứa những điều kỳ diệu với những loài hoa cực kỳ hiếm gặp và có giá trị vô cùng đắt đỏ.</p>
<h3>1. Hoa Kadupul - Loài hoa huyền thoại chỉ nở về đêm</h3>
<p>Được coi là loài hoa đắt nhất thế giới vì vô giá - Kadupul nở vào nửa đêm và tàn trước khi bình minh hé rạng.</p>
<img src=""https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop"" alt=""Hoa Kadupul quý hiếm"" class=""rounded-xl my-6 w-full object-cover h-72 shadow-sm"" />
<h3>2. Hoa Linh Lan (Lily of the Valley)</h3>
<p>Những chiếc chuông nhỏ nhắn màu trắng tinh khôi mang vẻ đẹp mong manh nhưng chứa đựng hương thơm quý phái được hoàng gia yêu thích.</p>
<img src=""https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800&auto=format&fit=crop"" alt=""Hoa linh lan tinh khôi"" class=""rounded-xl my-6 w-full object-cover h-72 shadow-sm"" />",
                ImageUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop",
                Type = 0, // Kiến thức hoa
                IsPublished = true,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                AuthorId = authorId
            }
        };

        _db.BlogPosts.AddRange(posts);
        await _db.SaveChangesAsync();
        return Ok("Seeded successfully");
    }
}
