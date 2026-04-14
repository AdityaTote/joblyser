DROP TRIGGER IF EXISTS job_updated_at ON jobs;
DROP TRIGGER IF EXISTS document_updated_at ON documents;
DROP TRIGGER IF EXISTS user_profile_updated_at ON profiles;
DROP TRIGGER IF EXISTS users_updated_at ON users;

DROP FUNCTION IF EXISTS update_updated_at_column();

DROP INDEX IF EXISTS idx_jobs_users_sessions;
DROP INDEX IF EXISTS idx_jobs_session;
DROP INDEX IF EXISTS idx_jobs_doc;
DROP INDEX IF EXISTS idx_jobs_user;

DROP TABLE IF EXISTS jobs;

DROP INDEX IF EXISTS idx_documents_key_user;
DROP INDEX IF EXISTS idx_documents_key;

DROP TABLE IF EXISTS documents;

DROP INDEX IF EXISTS idx_users_profile_name;
DROP INDEX IF EXISTS idx_users_profile;

DROP TABLE IF EXISTS profiles;

DROP INDEX IF EXISTS idx_users_email;

DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS status_type;
DROP TYPE IF EXISTS action_type;