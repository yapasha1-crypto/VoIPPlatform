using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VoIPPlatform.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSMSService : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SMSMessages_Accounts_AccountId",
                table: "SMSMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_SMSMessages_Users_UserId",
                table: "SMSMessages");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SMSMessages",
                table: "SMSMessages");

            migrationBuilder.DropColumn(
                name: "CountryCode",
                table: "SMSMessages");

            migrationBuilder.DropColumn(
                name: "DeliveredAt",
                table: "SMSMessages");

            migrationBuilder.DropColumn(
                name: "FromNumber",
                table: "SMSMessages");

            migrationBuilder.RenameTable(
                name: "SMSMessages",
                newName: "SMS");

            migrationBuilder.RenameColumn(
                name: "ToNumber",
                table: "SMS",
                newName: "SenderNumber");

            migrationBuilder.RenameColumn(
                name: "RetryCount",
                table: "SMS",
                newName: "MessageLength");

            migrationBuilder.RenameColumn(
                name: "Message",
                table: "SMS",
                newName: "RecipientNumber");

            migrationBuilder.RenameIndex(
                name: "IX_SMSMessages_UserId",
                table: "SMS",
                newName: "IX_SMS_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_SMSMessages_AccountId",
                table: "SMS",
                newName: "IX_SMS_AccountId");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "SMS",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<DateTime>(
                name: "SentAt",
                table: "SMS",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "SMS",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "ErrorMessage",
                table: "SMS",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ExternalId",
                table: "SMS",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MessageContent",
                table: "SMS",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SMS",
                table: "SMS",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SMS_Accounts_AccountId",
                table: "SMS",
                column: "AccountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SMS_Users_UserId",
                table: "SMS",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SMS_Accounts_AccountId",
                table: "SMS");

            migrationBuilder.DropForeignKey(
                name: "FK_SMS_Users_UserId",
                table: "SMS");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SMS",
                table: "SMS");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "SMS");

            migrationBuilder.DropColumn(
                name: "ErrorMessage",
                table: "SMS");

            migrationBuilder.DropColumn(
                name: "ExternalId",
                table: "SMS");

            migrationBuilder.DropColumn(
                name: "MessageContent",
                table: "SMS");

            migrationBuilder.RenameTable(
                name: "SMS",
                newName: "SMSMessages");

            migrationBuilder.RenameColumn(
                name: "SenderNumber",
                table: "SMSMessages",
                newName: "ToNumber");

            migrationBuilder.RenameColumn(
                name: "RecipientNumber",
                table: "SMSMessages",
                newName: "Message");

            migrationBuilder.RenameColumn(
                name: "MessageLength",
                table: "SMSMessages",
                newName: "RetryCount");

            migrationBuilder.RenameIndex(
                name: "IX_SMS_UserId",
                table: "SMSMessages",
                newName: "IX_SMSMessages_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_SMS_AccountId",
                table: "SMSMessages",
                newName: "IX_SMSMessages_AccountId");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "SMSMessages",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<DateTime>(
                name: "SentAt",
                table: "SMSMessages",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CountryCode",
                table: "SMSMessages",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveredAt",
                table: "SMSMessages",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FromNumber",
                table: "SMSMessages",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SMSMessages",
                table: "SMSMessages",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SMSMessages_Accounts_AccountId",
                table: "SMSMessages",
                column: "AccountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SMSMessages_Users_UserId",
                table: "SMSMessages",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
