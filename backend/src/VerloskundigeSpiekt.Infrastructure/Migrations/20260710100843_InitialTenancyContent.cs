using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
#pragma warning disable CA1861 // EF-generated migration arrays are immutable schema metadata.

namespace VerloskundigeSpiekt.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialTenancyContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.CreateTable(
                name: "articles",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    is_published = table.Column<bool>(type: "boolean", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    row_version = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_articles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "email_template_keys",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    key = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    required = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_template_keys", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "practices",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    row_version = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_practices", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    external_subject = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    email = table.Column<string>(type: "text", nullable: true),
                    normalized_email = table.Column<string>(type: "text", nullable: true),
                    display_name = table.Column<string>(type: "text", nullable: true),
                    email_verified = table.Column<bool>(type: "boolean", nullable: false),
                    is_global_administrator = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    row_version = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "article_sections",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    article_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    heading = table.Column<string>(type: "text", nullable: false),
                    document_json = table.Column<string>(type: "text", nullable: false),
                    extracted_text = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    row_version = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_article_sections", x => x.id);
                    table.ForeignKey(
                        name: "FK_article_sections_articles_article_id",
                        column: x => x.article_id,
                        principalSchema: "public",
                        principalTable: "articles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "contacts",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    practice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: true),
                    normalized_email = table.Column<string>(type: "text", nullable: true),
                    telephone = table.Column<string>(type: "text", nullable: true),
                    normalized_telephone = table.Column<string>(type: "text", nullable: true),
                    metadata_json = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    row_version = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contacts", x => x.id);
                    table.ForeignKey(
                        name: "FK_contacts_practices_practice_id",
                        column: x => x.practice_id,
                        principalSchema: "public",
                        principalTable: "practices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "email_templates",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    practice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    key = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    row_version = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_templates", x => x.id);
                    table.ForeignKey(
                        name: "FK_email_templates_practices_practice_id",
                        column: x => x.practice_id,
                        principalSchema: "public",
                        principalTable: "practices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "file_metadata",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    practice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    storage_object_name = table.Column<string>(type: "text", nullable: false),
                    file_name = table.Column<string>(type: "text", nullable: false),
                    content_type = table.Column<string>(type: "text", nullable: false),
                    size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    e_tag = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    row_version = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_file_metadata", x => x.id);
                    table.CheckConstraint("ck_file_metadata_size", "size_bytes >= 0 AND size_bytes <= 52428800");
                    table.ForeignKey(
                        name: "FK_file_metadata_practices_practice_id",
                        column: x => x.practice_id,
                        principalSchema: "public",
                        principalTable: "practices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "practice_invitations",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    practice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    invited_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    accepted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    invited_email = table.Column<string>(type: "text", nullable: false),
                    invited_email_normalized = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    token_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    responded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    row_version = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_practice_invitations", x => x.id);
                    table.CheckConstraint("ck_practice_invitations_expiry", "expires_at > created_at");
                    table.ForeignKey(
                        name: "FK_practice_invitations_practices_practice_id",
                        column: x => x.practice_id,
                        principalSchema: "public",
                        principalTable: "practices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "practice_pages",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    practice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    extracted_text = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    row_version = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_practice_pages", x => x.id);
                    table.ForeignKey(
                        name: "FK_practice_pages_practices_practice_id",
                        column: x => x.practice_id,
                        principalSchema: "public",
                        principalTable: "practices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "practice_members",
                schema: "public",
                columns: table => new
                {
                    practice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    row_version = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_practice_members", x => new { x.practice_id, x.user_id });
                    table.ForeignKey(
                        name: "FK_practice_members_practices_practice_id",
                        column: x => x.practice_id,
                        principalSchema: "public",
                        principalTable: "practices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_practice_members_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_preferences",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    active_practice_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_preferences", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_user_preferences_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "email_template_versions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    practice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    email_template_id = table.Column<Guid>(type: "uuid", nullable: false),
                    changed_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    version_number = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    definition_json = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_template_versions", x => x.id);
                    table.ForeignKey(
                        name: "FK_email_template_versions_email_templates_email_template_id",
                        column: x => x.email_template_id,
                        principalSchema: "public",
                        principalTable: "email_templates",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "practice_page_sections",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    practice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    practice_page_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    heading = table.Column<string>(type: "text", nullable: false),
                    document_json = table.Column<string>(type: "text", nullable: false),
                    extracted_text = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    row_version = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_practice_page_sections", x => x.id);
                    table.ForeignKey(
                        name: "FK_practice_page_sections_practice_pages_practice_page_id",
                        column: x => x.practice_page_id,
                        principalSchema: "public",
                        principalTable: "practice_pages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "practice_page_versions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    practice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    practice_page_id = table.Column<Guid>(type: "uuid", nullable: false),
                    changed_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    version_number = table.Column<int>(type: "integer", nullable: false),
                    snapshot_json = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_practice_page_versions", x => x.id);
                    table.ForeignKey(
                        name: "FK_practice_page_versions_practice_pages_practice_page_id",
                        column: x => x.practice_page_id,
                        principalSchema: "public",
                        principalTable: "practice_pages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_article_sections_article_id_position",
                schema: "public",
                table: "article_sections",
                columns: new[] { "article_id", "position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_articles_slug",
                schema: "public",
                table: "articles",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_contacts_practice_id_display_name",
                schema: "public",
                table: "contacts",
                columns: new[] { "practice_id", "display_name" });

            migrationBuilder.CreateIndex(
                name: "IX_contacts_practice_id_normalized_email",
                schema: "public",
                table: "contacts",
                columns: new[] { "practice_id", "normalized_email" });

            migrationBuilder.CreateIndex(
                name: "IX_email_template_keys_key",
                schema: "public",
                table: "email_template_keys",
                column: "key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_email_template_versions_email_template_id",
                schema: "public",
                table: "email_template_versions",
                column: "email_template_id");

            migrationBuilder.CreateIndex(
                name: "IX_email_template_versions_practice_id_email_template_id_versi~",
                schema: "public",
                table: "email_template_versions",
                columns: new[] { "practice_id", "email_template_id", "version_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_email_templates_practice_id_key",
                schema: "public",
                table: "email_templates",
                columns: new[] { "practice_id", "key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_file_metadata_practice_id_storage_object_name",
                schema: "public",
                table: "file_metadata",
                columns: new[] { "practice_id", "storage_object_name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_practice_invitations_invited_email_normalized_status",
                schema: "public",
                table: "practice_invitations",
                columns: new[] { "invited_email_normalized", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_practice_invitations_practice_id_invited_email_normalized",
                schema: "public",
                table: "practice_invitations",
                columns: new[] { "practice_id", "invited_email_normalized" },
                unique: true,
                filter: "status = 'Pending'");

            migrationBuilder.CreateIndex(
                name: "IX_practice_members_user_id",
                schema: "public",
                table: "practice_members",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_practice_members_user_id_practice_id",
                schema: "public",
                table: "practice_members",
                columns: new[] { "user_id", "practice_id" });

            migrationBuilder.CreateIndex(
                name: "IX_practice_page_sections_practice_id_practice_page_id_position",
                schema: "public",
                table: "practice_page_sections",
                columns: new[] { "practice_id", "practice_page_id", "position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_practice_page_sections_practice_page_id",
                schema: "public",
                table: "practice_page_sections",
                column: "practice_page_id");

            migrationBuilder.CreateIndex(
                name: "IX_practice_page_versions_practice_id_practice_page_id_version~",
                schema: "public",
                table: "practice_page_versions",
                columns: new[] { "practice_id", "practice_page_id", "version_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_practice_page_versions_practice_page_id",
                schema: "public",
                table: "practice_page_versions",
                column: "practice_page_id");

            migrationBuilder.CreateIndex(
                name: "IX_practice_pages_practice_id_slug",
                schema: "public",
                table: "practice_pages",
                columns: new[] { "practice_id", "slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_practices_slug",
                schema: "public",
                table: "practices",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_external_subject",
                schema: "public",
                table: "users",
                column: "external_subject",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_normalized_email",
                schema: "public",
                table: "users",
                column: "normalized_email");

            // The application sets app.external_subject with SET LOCAL inside the request transaction.
            // The runtime role must not own these tables or have BYPASSRLS.
            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION app_current_external_subject() RETURNS text
                LANGUAGE sql STABLE AS $$ SELECT current_setting('app.external_subject', true) $$;
                CREATE OR REPLACE FUNCTION app_has_practice_access(target_practice_id uuid) RETURNS boolean
                LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM practice_members pm JOIN users u ON u.id = pm.user_id WHERE pm.practice_id = target_practice_id AND u.external_subject = app_current_external_subject()) $$;
                CREATE OR REPLACE FUNCTION app_is_practice_admin(target_practice_id uuid) RETURNS boolean
                LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM practice_members pm JOIN users u ON u.id = pm.user_id WHERE pm.practice_id = target_practice_id AND pm.role IN ('Administrator','Owner') AND u.external_subject = app_current_external_subject()) $$;
                ALTER TABLE users ENABLE ROW LEVEL SECURITY;
                ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
                ALTER TABLE practice_members ENABLE ROW LEVEL SECURITY;
                ALTER TABLE practice_invitations ENABLE ROW LEVEL SECURITY;
                ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
                ALTER TABLE practice_pages ENABLE ROW LEVEL SECURITY;
                ALTER TABLE practice_page_sections ENABLE ROW LEVEL SECURITY;
                ALTER TABLE practice_page_versions ENABLE ROW LEVEL SECURITY;
                ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
                ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;
                ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
                ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;

                CREATE POLICY users_self_access ON users USING (external_subject = app_current_external_subject()) WITH CHECK (external_subject = app_current_external_subject());
                CREATE POLICY practice_membership_select ON practices FOR SELECT USING (app_has_practice_access(id));
                CREATE POLICY practice_membership_update ON practices FOR UPDATE USING (app_has_practice_access(id)) WITH CHECK (app_has_practice_access(id));
                CREATE POLICY practice_membership_delete ON practices FOR DELETE USING (app_has_practice_access(id));
                CREATE POLICY practice_insert ON practices FOR INSERT WITH CHECK (app_current_external_subject() IS NOT NULL);
                CREATE POLICY practice_members_self_access ON practice_members USING (user_id = (SELECT id FROM users WHERE external_subject = app_current_external_subject()) OR app_is_practice_admin(practice_id)) WITH CHECK (user_id = (SELECT id FROM users WHERE external_subject = app_current_external_subject()) OR app_is_practice_admin(practice_id));
                CREATE POLICY practice_invitation_access ON practice_invitations USING (invited_email_normalized = upper(current_setting('app.user_email', true)) OR app_is_practice_admin(practice_id)) WITH CHECK (app_is_practice_admin(practice_id));
                CREATE POLICY user_preferences_self_access ON user_preferences USING (user_id = (SELECT id FROM users WHERE external_subject = app_current_external_subject())) WITH CHECK (user_id = (SELECT id FROM users WHERE external_subject = app_current_external_subject()));
                CREATE POLICY practice_pages_access ON practice_pages USING (app_has_practice_access(practice_id)) WITH CHECK (app_has_practice_access(practice_id));
                CREATE POLICY practice_page_sections_access ON practice_page_sections USING (app_has_practice_access(practice_id)) WITH CHECK (app_has_practice_access(practice_id));
                CREATE POLICY practice_page_versions_access ON practice_page_versions USING (app_has_practice_access(practice_id)) WITH CHECK (app_has_practice_access(practice_id));
                CREATE POLICY email_templates_access ON email_templates USING (app_has_practice_access(practice_id)) WITH CHECK (app_has_practice_access(practice_id));
                CREATE POLICY email_template_versions_access ON email_template_versions USING (app_has_practice_access(practice_id)) WITH CHECK (app_has_practice_access(practice_id));
                CREATE POLICY contacts_access ON contacts USING (app_has_practice_access(practice_id)) WITH CHECK (app_has_practice_access(practice_id));
                CREATE POLICY file_metadata_access ON file_metadata USING (app_has_practice_access(practice_id)) WITH CHECK (app_has_practice_access(practice_id));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP FUNCTION IF EXISTS app_is_practice_admin(uuid);
                DROP FUNCTION IF EXISTS app_has_practice_access(uuid);
                DROP FUNCTION IF EXISTS app_current_external_subject();
                """);
            migrationBuilder.DropTable(
                name: "article_sections",
                schema: "public");

            migrationBuilder.DropTable(
                name: "contacts",
                schema: "public");

            migrationBuilder.DropTable(
                name: "email_template_keys",
                schema: "public");

            migrationBuilder.DropTable(
                name: "email_template_versions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "file_metadata",
                schema: "public");

            migrationBuilder.DropTable(
                name: "practice_invitations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "practice_members",
                schema: "public");

            migrationBuilder.DropTable(
                name: "practice_page_sections",
                schema: "public");

            migrationBuilder.DropTable(
                name: "practice_page_versions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_preferences",
                schema: "public");

            migrationBuilder.DropTable(
                name: "articles",
                schema: "public");

            migrationBuilder.DropTable(
                name: "email_templates",
                schema: "public");

            migrationBuilder.DropTable(
                name: "practice_pages",
                schema: "public");

            migrationBuilder.DropTable(
                name: "users",
                schema: "public");

            migrationBuilder.DropTable(
                name: "practices",
                schema: "public");
        }
    }
}
