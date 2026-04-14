ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_jobs_session_id ON jobs(session_id);