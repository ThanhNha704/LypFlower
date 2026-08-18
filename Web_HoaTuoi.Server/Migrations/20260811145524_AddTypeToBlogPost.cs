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
            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "BlogPosts",
                type: "int",
                nullable: false,
                defaultValue: 0);
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
