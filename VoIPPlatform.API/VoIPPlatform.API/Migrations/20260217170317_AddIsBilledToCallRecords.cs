using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VoIPPlatform.API.Migrations
{
    /// <inheritdoc />
    public partial class AddIsBilledToCallRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsBilled",
                table: "CallRecords",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsBilled",
                table: "CallRecords");
        }
    }
}
