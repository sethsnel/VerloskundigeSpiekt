using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VerloskundigeSpiekt.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIdempotencyRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "idempotency_records",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    key = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    operation = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    request_fingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    response_status = table.Column<int>(type: "integer", nullable: false),
                    response_json = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_idempotency_records", x => new { x.user_id, x.key });
                    table.ForeignKey(
                        name: "FK_idempotency_records_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_idempotency_records_expires_at",
                schema: "public",
                table: "idempotency_records",
                column: "expires_at");

            migrationBuilder.Sql("""
                ALTER TABLE idempotency_records ENABLE ROW LEVEL SECURITY;
                CREATE POLICY idempotency_records_self_access ON idempotency_records
                  USING (user_id = (SELECT id FROM users WHERE external_subject = app_current_external_subject()))
                  WITH CHECK (user_id = (SELECT id FROM users WHERE external_subject = app_current_external_subject()));
                GRANT SELECT, INSERT, UPDATE, DELETE ON idempotency_records TO vs_api;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "idempotency_records",
                schema: "public");
        }
    }
}
