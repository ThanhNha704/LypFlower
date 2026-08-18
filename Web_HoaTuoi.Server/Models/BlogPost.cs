namespace Web_HoaTuoi.Server.Models;

public class BlogPost
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string AuthorId { get; set; } = string.Empty;
    public AppUser Author { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsPublished { get; set; } = false;
    public int Type { get; set; } = 0; // 0 = Blog/Cảm Hứng, 1 = Lookbook
}
