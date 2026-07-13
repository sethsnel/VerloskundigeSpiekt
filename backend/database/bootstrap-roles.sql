-- Run once as the PostgreSQL cluster administrator, before applying migrations.
-- Supply passwords out-of-band with ALTER ROLE; never store them in this repository.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vs_migrator') THEN
    CREATE ROLE vs_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vs_api') THEN
    CREATE ROLE vs_api LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

GRANT CONNECT ON DATABASE verloskundigespiekt TO vs_migrator, vs_api;
GRANT USAGE, CREATE ON SCHEMA public TO vs_migrator;
GRANT USAGE ON SCHEMA public TO vs_api;
ALTER SCHEMA public OWNER TO vs_migrator;
ALTER ROLE vs_api SET statement_timeout = '30s';
ALTER ROLE vs_api SET idle_in_transaction_session_timeout = '60s';
