using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
#pragma warning disable CA1861 // EF-generated migration arrays are immutable schema metadata.

namespace VerloskundigeSpiekt.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMigrationAliases : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "migration_aliases",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    source_system = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    source_document_id = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    target_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    target_id = table.Column<Guid>(type: "uuid", nullable: false),
                    migration_run_id = table.Column<Guid>(type: "uuid", nullable: false),
                    checksum = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_migration_aliases", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_migration_aliases_source_system_source_document_id",
                schema: "public",
                table: "migration_aliases",
                columns: new[] { "source_system", "source_document_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "migration_aliases",
                schema: "public");
        }
    }
}
