using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VoIPPlatform.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDynamicRatesEngine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TariffPlanId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BaseRates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DestinationName = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    BuyPrice = table.Column<decimal>(type: "decimal(18,5)", precision: 18, scale: 5, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BaseRates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TariffPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    ProfitPercent = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    FixedProfit = table.Column<decimal>(type: "decimal(18,5)", precision: 18, scale: 5, nullable: false),
                    MinProfit = table.Column<decimal>(type: "decimal(18,5)", precision: 18, scale: 5, nullable: false),
                    MaxProfit = table.Column<decimal>(type: "decimal(18,5)", precision: 18, scale: 5, nullable: false),
                    Precision = table.Column<int>(type: "int", nullable: false),
                    ChargingIntervalSeconds = table.Column<int>(type: "int", nullable: false),
                    IsPredefined = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TariffPlans", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_TariffPlanId",
                table: "Users",
                column: "TariffPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_BaseRates_Code",
                table: "BaseRates",
                column: "Code");

            migrationBuilder.CreateIndex(
                name: "IX_BaseRates_DestinationName",
                table: "BaseRates",
                column: "DestinationName");

            migrationBuilder.CreateIndex(
                name: "IX_TariffPlans_Name",
                table: "TariffPlans",
                column: "Name");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_TariffPlans_TariffPlanId",
                table: "Users",
                column: "TariffPlanId",
                principalTable: "TariffPlans",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // Seed Predefined Tariff Plans
            migrationBuilder.InsertData(
                table: "TariffPlans",
                columns: new[] { "Name", "Type", "ProfitPercent", "FixedProfit", "MinProfit", "MaxProfit", "Precision", "ChargingIntervalSeconds", "IsPredefined", "IsActive", "CreatedAt" },
                values: new object[,]
                {
                    { "[Predefined] 0% List", 0, 0m, 0m, 0m, 999999m, 5, 60, true, true, DateTime.UtcNow },
                    { "[Predefined] 10% Profit", 0, 10m, 0m, 0m, 999999m, 5, 60, true, true, DateTime.UtcNow },
                    { "[Predefined] Free List", 2, 0m, 0m, 0m, 999999m, 5, 60, true, true, DateTime.UtcNow }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_TariffPlans_TariffPlanId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "BaseRates");

            migrationBuilder.DropTable(
                name: "TariffPlans");

            migrationBuilder.DropIndex(
                name: "IX_Users_TariffPlanId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TariffPlanId",
                table: "Users");
        }
    }
}
