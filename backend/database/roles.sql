-- Run after migrations as vs_migrator. Role creation lives in bootstrap-roles.sql.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users, practice_invitations, user_preferences, practice_pages, practice_page_sections, practice_page_versions, email_templates, email_template_versions, contacts, file_metadata, idempotency_records TO vs_api;
GRANT SELECT, UPDATE, DELETE ON TABLE practices, practice_members TO vs_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE articles, article_sections, tags, article_tags TO vs_api;
GRANT SELECT ON TABLE email_template_keys TO vs_api;
-- Deliberately no runtime access: migration_aliases is operator-only.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vs_api;
