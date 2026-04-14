ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS chat_id TEXT;

CREATE INDEX IF NOT EXISTS idx_jobs_chat_id ON jobs(chat_id);
