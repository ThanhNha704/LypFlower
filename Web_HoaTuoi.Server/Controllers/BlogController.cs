using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_HoaTuoi.Server.Data;
using Web_HoaTuoi.Server.Models;
using System.Text.Json.Serialization;
using System.Security.Claims;

namespace Web_HoaTuoi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlogController : ControllerBase
{
    private readonly AppDbContext _db;
    public BlogController(AppDbContext db) => _db = db;

    public record BlogPostDto(
        int Id, string Title, string Slug, 
        [property: JsonPropertyName("excerpt")] string Summary,
        [property: JsonPropertyName("coverImageUrl")] string? ImageUrl, 
        DateTime CreatedAt, string Type, bool IsPublished);

    public record BlogPostDetailDto(
        int Id, string Title, string Slug, 
        [property: JsonPropertyName("excerpt")] string Summary, string Content,
        [property: JsonPropertyName("coverImageUrl")] string? ImageUrl, 
        DateTime CreatedAt, string Type, bool IsPublished);

    public class CreateBlogDto
    {
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Excerpt { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string CoverImageUrl { get; set; } = string.Empty;
        public string Type { get; set; } = "Blog";
        public bool IsPublished { get; set; }
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll([FromQuery] string? type, [FromQuery] int page = 1, [FromQuery] int pageSize = 100)
    {
        var query = _db.BlogPosts.AsQueryable();
        if (!string.IsNullOrEmpty(type)) query = query.Where(b => b.Type == type);

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
}
