using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
#pragma warning disable CA1861 // EF migration scaffolding uses inline column arrays.

namespace VerloskundigeSpiekt.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMigrationRunState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "migration_runs",
                schema: "public",
                columns: table => new
                {
                    run_id = table.Column<Guid>(type: "uuid", nullable: false),
                    source_checksum = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    checksum_algorithm = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    tool_version = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    schema_version = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_migration_runs", x => x.run_id);
                });

            migrationBuilder.CreateTable(
                name: "migration_record_states",
                schema: "public",
                columns: table => new
                {
                    migration_run_id = table.Column<Guid>(type: "uuid", nullable: false),
                    source_document_id = table.Column<string>(type: "character varying(600)", maxLength: 600, nullable: false),
                    target_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    checksum = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    retry_count = table.Column<int>(type: "integer", nullable: false),
                    error_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    error_metadata_json = table.Column<string>(type: "jsonb", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_migration_record_states", x => new { x.migration_run_id, x.source_document_id });
                    table.ForeignKey(
                        name: "FK_migration_record_states_migration_runs_migration_run_id",
                        column: x => x.migration_run_id,
                        principalSchema: "public",
                        principalTable: "migration_runs",
                        principalColumn: "run_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_migration_record_states_migration_run_id_status",
                schema: "public",
                table: "migration_record_states",
                columns: new[] { "migration_run_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_migration_runs_source_checksum_checksum_algorithm",
                schema: "public",
                table: "migration_runs",
                columns: new[] { "source_checksum", "checksum_algorithm" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "migration_record_states",
                schema: "public");

            migrationBuilder.DropTable(
                name: "migration_runs",
                schema: "public");
        }
    }
}
