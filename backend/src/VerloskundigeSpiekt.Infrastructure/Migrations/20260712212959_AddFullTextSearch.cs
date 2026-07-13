using Microsoft.EntityFrameworkCore.Migrations;
using NpgsqlTypes;

#nullable disable

namespace VerloskundigeSpiekt.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFullTextSearch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "extracted_text",
                schema: "public",
                table: "articles",
                type: "text",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE articles article SET extracted_text = sections.text
                FROM (SELECT article_id, string_agg(coalesce(extracted_text, ''), ' ' ORDER BY position) AS text FROM article_sections GROUP BY article_id) sections
                WHERE article.id = sections.article_id;
                """);

            migrationBuilder.AddColumn<NpgsqlTsVector>(
                name: "search_vector",
                schema: "public",
                table: "practice_pages",
                type: "tsvector",
                nullable: true,
                computedColumnSql: "to_tsvector('dutch', coalesce(title, '') || ' ' || coalesce(extracted_text, ''))",
                stored: true);

            migrationBuilder.AddColumn<NpgsqlTsVector>(
                name: "search_vector",
                schema: "public",
                table: "articles",
                type: "tsvector",
                nullable: true,
                computedColumnSql: "to_tsvector('dutch', coalesce(title, '') || ' ' || coalesce(extracted_text, ''))",
                stored: true);

            migrationBuilder.CreateIndex(
                name: "IX_practice_pages_search_vector",
                schema: "public",
                table: "practice_pages",
                column: "search_vector")
                .Annotation("Npgsql:IndexMethod", "GIN");

            migrationBuilder.CreateIndex(
                name: "IX_articles_search_vector",
                schema: "public",
                table: "articles",
                column: "search_vector")
                .Annotation("Npgsql:IndexMethod", "GIN");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_practice_pages_search_vector",
                schema: "public",
                table: "practice_pages");

            migrationBuilder.DropIndex(
                name: "IX_articles_search_vector",
                schema: "public",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "search_vector",
                schema: "public",
                table: "practice_pages");

            migrationBuilder.DropColumn(
                name: "search_vector",
                schema: "public",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "extracted_text",
                schema: "public",
                table: "articles");
        }
    }
}
