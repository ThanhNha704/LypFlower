namespace Web_HoaTuoi.Server.Models;

public class ProductBundle
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int BundledProductId { get; set; }
    public Product BundledProduct { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal DiscountPercent { get; set; }
}
