using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VoIPPlatform.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCallModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CallDate",
                table: "Calls",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Destination",
                table: "Calls",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CallDate",
                table: "Calls");

            migrationBuilder.DropColumn(
                name: "Destination",
                table: "Calls");
        }
    }
}
