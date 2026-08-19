using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Web_hoatuoi.Server.Migrations
{
    /// <inheritdoc />
    public partial class RemoveOrderCancelFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CancelReason",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CancelRequestedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CancelRequestedBy",
                table: "Orders");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CancelReason",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelRequestedAt",
                table: "Orders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancelRequestedBy",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
