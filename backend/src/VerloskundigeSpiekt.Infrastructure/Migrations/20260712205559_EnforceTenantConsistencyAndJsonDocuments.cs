using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
#pragma warning disable CA1861 // EF migration scaffolding uses inline column arrays.

namespace VerloskundigeSpiekt.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnforceTenantConsistencyAndJsonDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_email_template_versions_email_templates_email_template_id",
                schema: "public",
                table: "email_template_versions");

            migrationBuilder.DropForeignKey(
                name: "FK_practice_page_sections_practice_pages_practice_page_id",
                schema: "public",
                table: "practice_page_sections");

            migrationBuilder.DropForeignKey(
                name: "FK_practice_page_versions_practice_pages_practice_page_id",
                schema: "public",
                table: "practice_page_versions");

            migrationBuilder.DropIndex(
                name: "IX_practice_page_versions_practice_page_id",
                schema: "public",
                table: "practice_page_versions");

            migrationBuilder.DropIndex(
                name: "IX_practice_page_sections_practice_page_id",
                schema: "public",
                table: "practice_page_sections");

            migrationBuilder.DropIndex(
                name: "IX_email_template_versions_email_template_id",
                schema: "public",
                table: "email_template_versions");

            migrationBuilder.Sql("""
                ALTER TABLE practice_page_versions ALTER COLUMN snapshot_json TYPE jsonb USING snapshot_json::jsonb;
                ALTER TABLE practice_page_sections ALTER COLUMN document_json TYPE jsonb USING document_json::jsonb;
                ALTER TABLE email_template_versions ALTER COLUMN definition_json TYPE jsonb USING definition_json::jsonb;
                ALTER TABLE contacts ALTER COLUMN metadata_json TYPE jsonb USING metadata_json::jsonb;
                ALTER TABLE article_sections ALTER COLUMN document_json TYPE jsonb USING document_json::jsonb;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "snapshot_json",
                schema: "public",
                table: "practice_page_versions",
                type: "jsonb",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "document_json",
                schema: "public",
                table: "practice_page_sections",
                type: "jsonb",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "definition_json",
                schema: "public",
                table: "email_template_versions",
                type: "jsonb",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "metadata_json",
                schema: "public",
                table: "contacts",
                type: "jsonb",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "document_json",
                schema: "public",
                table: "article_sections",
                type: "jsonb",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_practice_pages_practice_id_id",
                schema: "public",
                table: "practice_pages",
                columns: new[] { "practice_id", "id" });

            migrationBuilder.AddUniqueConstraint(
                name: "AK_email_templates_practice_id_id",
                schema: "public",
                table: "email_templates",
                columns: new[] { "practice_id", "id" });

            migrationBuilder.AddForeignKey(
                name: "FK_email_template_versions_email_templates_practice_id_email_t~",
                schema: "public",
                table: "email_template_versions",
                columns: new[] { "practice_id", "email_template_id" },
                principalSchema: "public",
                principalTable: "email_templates",
                principalColumns: new[] { "practice_id", "id" },
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_practice_page_sections_practice_pages_practice_id_practice_~",
                schema: "public",
                table: "practice_page_sections",
                columns: new[] { "practice_id", "practice_page_id" },
                principalSchema: "public",
                principalTable: "practice_pages",
                principalColumns: new[] { "practice_id", "id" },
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_practice_page_versions_practice_pages_practice_id_practice_~",
                schema: "public",
                table: "practice_page_versions",
                columns: new[] { "practice_id", "practice_page_id" },
                principalSchema: "public",
                principalTable: "practice_pages",
                principalColumns: new[] { "practice_id", "id" },
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_email_template_versions_email_templates_practice_id_email_t~",
                schema: "public",
                table: "email_template_versions");

            migrationBuilder.DropForeignKey(
                name: "FK_practice_page_sections_practice_pages_practice_id_practice_~",
                schema: "public",
                table: "practice_page_sections");

            migrationBuilder.DropForeignKey(
                name: "FK_practice_page_versions_practice_pages_practice_id_practice_~",
                schema: "public",
                table: "practice_page_versions");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_practice_pages_practice_id_id",
                schema: "public",
                table: "practice_pages");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_email_templates_practice_id_id",
                schema: "public",
                table: "email_templates");

            migrationBuilder.Sql("""
                ALTER TABLE practice_page_versions ALTER COLUMN snapshot_json TYPE text USING snapshot_json::text;
                ALTER TABLE practice_page_sections ALTER COLUMN document_json TYPE text USING document_json::text;
                ALTER TABLE email_template_versions ALTER COLUMN definition_json TYPE text USING definition_json::text;
                ALTER TABLE contacts ALTER COLUMN metadata_json TYPE text USING metadata_json::text;
                ALTER TABLE article_sections ALTER COLUMN document_json TYPE text USING document_json::text;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "snapshot_json",
                schema: "public",
                table: "practice_page_versions",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AlterColumn<string>(
                name: "document_json",
                schema: "public",
                table: "practice_page_sections",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AlterColumn<string>(
                name: "definition_json",
                schema: "public",
                table: "email_template_versions",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AlterColumn<string>(
                name: "metadata_json",
                schema: "public",
                table: "contacts",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AlterColumn<string>(
                name: "document_json",
                schema: "public",
                table: "article_sections",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.CreateIndex(
                name: "IX_practice_page_versions_practice_page_id",
                schema: "public",
                table: "practice_page_versions",
                column: "practice_page_id");

            migrationBuilder.CreateIndex(
                name: "IX_practice_page_sections_practice_page_id",
                schema: "public",
                table: "practice_page_sections",
                column: "practice_page_id");

            migrationBuilder.CreateIndex(
                name: "IX_email_template_versions_email_template_id",
                schema: "public",
                table: "email_template_versions",
                column: "email_template_id");

            migrationBuilder.AddForeignKey(
                name: "FK_email_template_versions_email_templates_email_template_id",
                schema: "public",
                table: "email_template_versions",
                column: "email_template_id",
                principalSchema: "public",
                principalTable: "email_templates",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_practice_page_sections_practice_pages_practice_page_id",
                schema: "public",
                table: "practice_page_sections",
                column: "practice_page_id",
                principalSchema: "public",
                principalTable: "practice_pages",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_practice_page_versions_practice_pages_practice_page_id",
                schema: "public",
                table: "practice_page_versions",
                column: "practice_page_id",
                principalSchema: "public",
                principalTable: "practice_pages",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
