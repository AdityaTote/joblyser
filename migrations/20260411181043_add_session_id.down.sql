DROP INDEX IF EXISTS idx_jobs_session_id;

ALTER TABLE jobs
DROP COLUMN IF EXISTS session_id;
