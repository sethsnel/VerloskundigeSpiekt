-- Execute this script through the protected migration job with an owner/admin role.
-- Passwords are injected by the secret manager; never commit values here.
CREATE ROLE vs_api LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
CREATE ROLE vs_migrator LOGIN NOSUPERUSER CREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT CONNECT ON DATABASE verloskundigespiekt TO vs_api, vs_migrator;
GRANT USAGE ON SCHEMA public TO vs_api, vs_migrator;
GRANT CREATE ON SCHEMA public TO vs_migrator;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users, practices, practice_members, practice_invitations, user_preferences, practice_pages, practice_page_sections, practice_page_versions, email_templates, email_template_versions, contacts, file_metadata TO vs_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vs_api;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vs_migrator;
ALTER ROLE vs_api SET statement_timeout = '30s';
ALTER ROLE vs_api SET idle_in_transaction_session_timeout = '60s';
