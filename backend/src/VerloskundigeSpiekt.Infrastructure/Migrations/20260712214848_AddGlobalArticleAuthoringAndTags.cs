using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VerloskundigeSpiekt.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGlobalArticleAuthoringAndTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "header_url",
                schema: "public",
                table: "articles",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "tags",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    row_version = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tags", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "article_tags",
                schema: "public",
                columns: table => new
                {
                    article_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tag_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_article_tags", x => new { x.article_id, x.tag_id });
                    table.ForeignKey(
                        name: "FK_article_tags_articles_article_id",
                        column: x => x.article_id,
                        principalSchema: "public",
                        principalTable: "articles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_article_tags_tags_tag_id",
                        column: x => x.tag_id,
                        principalSchema: "public",
                        principalTable: "tags",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_article_tags_tag_id",
                schema: "public",
                table: "article_tags",
                column: "tag_id");

            migrationBuilder.CreateIndex(
                name: "IX_tags_name",
                schema: "public",
                table: "tags",
                column: "name",
                unique: true);

            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION app_is_global_administrator() RETURNS boolean
                LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
                  SELECT EXISTS (SELECT 1 FROM users WHERE external_subject = app_current_external_subject() AND is_global_administrator)
                $$;
                ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
                ALTER TABLE article_sections ENABLE ROW LEVEL SECURITY;
                ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
                ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
                CREATE POLICY articles_public_read ON articles FOR SELECT USING (is_published OR app_is_global_administrator());
                CREATE POLICY articles_global_admin_write ON articles FOR ALL USING (app_is_global_administrator()) WITH CHECK (app_is_global_administrator());
                CREATE POLICY article_sections_public_read ON article_sections FOR SELECT USING (EXISTS (SELECT 1 FROM articles WHERE articles.id = article_id AND articles.is_published) OR app_is_global_administrator());
                CREATE POLICY article_sections_global_admin_write ON article_sections FOR ALL USING (app_is_global_administrator()) WITH CHECK (app_is_global_administrator());
                CREATE POLICY tags_public_read ON tags FOR SELECT USING (true);
                CREATE POLICY tags_global_admin_write ON tags FOR ALL USING (app_is_global_administrator()) WITH CHECK (app_is_global_administrator());
                CREATE POLICY article_tags_public_read ON article_tags FOR SELECT USING (EXISTS (SELECT 1 FROM articles WHERE articles.id = article_id AND articles.is_published) OR app_is_global_administrator());
                CREATE POLICY article_tags_global_admin_write ON article_tags FOR ALL USING (app_is_global_administrator()) WITH CHECK (app_is_global_administrator());
                GRANT SELECT, INSERT, UPDATE, DELETE ON articles, article_sections, tags, article_tags TO vs_api;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP POLICY IF EXISTS articles_public_read ON articles;
                DROP POLICY IF EXISTS articles_global_admin_write ON articles;
                DROP POLICY IF EXISTS article_sections_public_read ON article_sections;
                DROP POLICY IF EXISTS article_sections_global_admin_write ON article_sections;
                ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
                ALTER TABLE article_sections DISABLE ROW LEVEL SECURITY;
                DROP FUNCTION IF EXISTS app_is_global_administrator();
                """);
            migrationBuilder.DropTable(
                name: "article_tags",
                schema: "public");

            migrationBuilder.DropTable(
                name: "tags",
                schema: "public");

            migrationBuilder.DropColumn(
                name: "header_url",
                schema: "public",
                table: "articles");
        }
    }
}
