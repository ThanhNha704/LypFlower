using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Web_hoatuoi.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddTypeToBlogPost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "BlogPosts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "BlogPosts");
        }
    }
}
